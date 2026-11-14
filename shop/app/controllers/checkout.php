<?php
declare(strict_types=1);

function cart_page(): void
{
    [$lines, $notices] = cart_lines();
    foreach ($notices as $n) {
        flash('info', $n);
    }
    render('shop/cart', [
        'title' => __('cart.title') . ' — ' . setting('shop_name'),
        'lines' => $lines,
        'totals' => cart_totals($lines),
        'robots' => 'noindex',
    ]);
}

function cart_add(): void
{
    $productId = (int) input('product_id');
    $variantId = (int) input('variant_id') ?: null;
    $qty = max(1, min(CART_MAX_QTY, (int) input('qty', 1)));
    $product = one('SELECT * FROM products WHERE id = :id AND is_active = 1', ['id' => $productId]);
    $error = null;
    $variant = null;
    if (!$product) {
        $error = __('cart.unavailable');
    } else {
        $hasVariants = (int) val('SELECT COUNT(*) FROM product_variants WHERE product_id = :id', ['id' => $productId]) > 0;
        if ($hasVariants) {
            $variant = $variantId ? one('SELECT * FROM product_variants WHERE id = :id AND product_id = :p', ['id' => $variantId, 'p' => $productId]) : null;
            if (!$variant) {
                $error = __('cart.choose_option', ['option' => mb_strtolower($product['option_label'] ?: __('product.option'))]);
            }
        }
        if (!$error) {
            $inCart = cart_items()[cart_key($productId, $variant ? (int) $variant['id'] : null)] ?? 0;
            $stock = available_stock($product, $variant);
            if ($stock !== null && $inCart + $qty > $stock) {
                $error = $stock - $inCart > 0 ? __('cart.only_left', ['qty' => $stock - $inCart]) : __('cart.out_of_stock');
            }
        }
    }
    if ($error) {
        if (wants_json()) {
            json_response(['ok' => false, 'error' => $error], 422);
        }
        flash('error', $error);
        back('/panier');
    }
    $key = cart_key($productId, $variant ? (int) $variant['id'] : null);
    cart_set($productId, $variant ? (int) $variant['id'] : null, (cart_items()[$key] ?? 0) + $qty);
    if (wants_json()) {
        json_response([
            'ok' => true,
            'count' => cart_count(),
            'message' => __('cart.added'),
            'item' => [
                'name' => $product['name'] . ($variant ? ' — ' . $variant['name'] : ''),
                'price' => format_money(unit_price($product, $variant)),
                'image' => media(product_cover($productId)),
                'qty' => $qty,
            ],
        ]);
    }
    if (input('buy_now')) {
        redirect(url('/commande'));
    }
    flash('success', __('cart.added'));
    back('/panier');
}

function cart_update(): void
{
    $key = (string) input('key');
    if (preg_match('/^(\d+):(\d+)$/', $key, $m) && isset(cart_items()[$key])) {
        $qty = input('remove') ? 0 : (int) input('qty');
        cart_set((int) $m[1], (int) $m[2] ?: null, $qty);
    }
    redirect(url('/panier'));
}

function cart_coupon_apply(): void
{
    if (input('remove')) {
        cart_set_coupon(null);
        redirect(url(input('from') === 'checkout' ? '/commande' : '/panier'));
    }
    $code = mb_strtoupper(trim((string) input('code')));
    [$lines] = cart_lines();
    $coupon = $code !== '' ? find_coupon($code) : null;
    $error = coupon_error($coupon, array_sum(array_column($lines, 'total')));
    if ($error) {
        flash('error', $error);
    } else {
        cart_set_coupon($coupon['code']);
        flash('success', __('coupon.applied'));
    }
    redirect(url(input('from') === 'checkout' ? '/commande' : '/panier'));
}

function checkout_fields(): array
{
    return ['name', 'email', 'phone', 'address', 'city', 'postal_code', 'country', 'notes'];
}

function checkout_page(): void
{
    [$lines, $notices] = cart_lines();
    if (!$lines) {
        foreach ($notices as $n) {
            flash('info', $n);
        }
        redirect(url('/panier'));
    }
    $methods = payment_methods();
    $errors = [];
    $method = (string) input('payment_method', $methods[0] ?? '');
    $termsPage = val("SELECT slug FROM pages WHERE slug = 'conditions-generales-de-vente' AND is_active = 1");

    if (is_post()) {
        $c = [];
        foreach (checkout_fields() as $f) {
            $c[$f] = mb_substr((string) input($f), 0, $f === 'notes' ? 1000 : 190);
        }
        $c['email'] = mb_strtolower($c['email']);
        foreach (['name', 'address', 'city'] as $f) {
            if (mb_strlen($c[$f]) < 2) {
                $errors[$f] = __('form.required');
            }
        }
        if (!valid_email($c['email'])) {
            $errors['email'] = __('form.invalid_email');
        }
        if (!valid_phone($c['phone'])) {
            $errors['phone'] = __('form.invalid_phone');
        }
        if (setting('require_postal_code') && $c['postal_code'] === '') {
            $errors['postal_code'] = __('form.required');
        }
        if (!in_array($method, $methods, true)) {
            $errors['payment_method'] = __('checkout.choose_payment');
        }
        if ($termsPage && !input('terms')) {
            $errors['terms'] = __('checkout.accept_terms_required');
        }
        if ($notices) {
            foreach ($notices as $n) {
                flash('info', $n);
            }
            $errors['_cart'] = true;
        }
        if (!$errors) {
            $totals = cart_totals($lines, $method);
            try {
                $order = create_order($c, $lines, $totals, $method);
            } catch (OutOfStockException $e) {
                flash('error', __('cart.out_of_stock_removed', ['name' => $e->getMessage()]));
                redirect(url('/panier'));
            }
            cart_clear();
            $_SESSION['customer'] = array_intersect_key($c, array_flip(['name', 'email', 'phone', 'address', 'city', 'postal_code', 'country']));
            start_payment($order);
        }
        remember_input($_POST);
    }

    $customer = $_SESSION['customer'] ?? [];
    render('shop/checkout', [
        'title' => __('checkout.title') . ' — ' . setting('shop_name'),
        'lines' => $lines,
        'totals' => cart_totals($lines, $method),
        'methods' => $methods,
        'method' => $method,
        'errors' => $errors,
        'customer' => $customer,
        'termsPage' => $termsPage,
        'robots' => 'noindex',
    ]);
}

/** Sends the customer to the payment provider, or confirms a cash-on-delivery order directly. */
function start_payment(array $order): never
{
    $orderUrl = url('/commande/' . $order['number'], ['t' => $order['token']]);
    if ($order['payment_method'] === 'cod') {
        send_order_emails($order);
        redirect(url('/commande/' . $order['number'], ['t' => $order['token'], 'merci' => 1]));
    }
    try {
        $payUrl = match ($order['payment_method']) {
            'stripe' => stripe_start($order),
            'konnect' => konnect_start($order),
            'flouci' => flouci_start($order),
        };
        order_event((int) $order['id'], 'Redirection vers ' . payment_method_label($order['payment_method']));
        redirect($payUrl);
    } catch (RuntimeException $e) {
        error_log($e->getMessage());
        order_event((int) $order['id'], 'Initialisation du paiement impossible : ' . $e->getMessage());
        flash('error', __('payment.start_failed'));
        redirect($orderUrl);
    }
}

/** Loads an order from its public number + secret token, 404 otherwise. */
function public_order(string $number, ?string $token): array
{
    $order = find_order_by_number($number);
    if (!$order || !is_string($token) || !hash_equals($order['token'], $token)) {
        abort(404);
    }
    return $order;
}

function order_page(string $number): void
{
    $order = public_order($number, $_GET['t'] ?? null);
    if (!empty($_GET['failed']) && $order['payment_status'] !== 'paid') {
        flash('error', __('payment.failed'));
    } elseif (!empty($_GET['cancelled']) && $order['payment_status'] !== 'paid') {
        flash('info', __('payment.cancelled'));
    }
    $canPay = $order['payment_method'] !== 'cod' && $order['payment_status'] !== 'paid' && !in_array($order['status'], ['cancelled', 'delivered'], true);
    render('shop/order', [
        'title' => __('order.title', ['number' => $order['number']]) . ' — ' . setting('shop_name'),
        'order' => $order,
        'items' => order_items((int) $order['id']),
        'isNew' => !empty($_GET['merci']),
        'canPay' => $canPay,
        'methods' => payment_methods(),
        'robots' => 'noindex',
    ]);
}

function order_pay(string $number): void
{
    $order = public_order($number, (string) input('t'));
    $method = (string) input('payment_method');
    if ($order['payment_status'] === 'paid' || $order['status'] === 'cancelled' || !in_array($method, payment_methods(), true)) {
        redirect(url('/commande/' . $order['number'], ['t' => $order['token']]));
    }
    if ($method !== $order['payment_method']) {
        update('orders', ['payment_method' => $method, 'payment_status' => 'unpaid', 'updated_at' => now()], 'id = :id', ['id' => $order['id']]);
        order_event((int) $order['id'], 'Mode de paiement changé : ' . payment_method_label($method));
        $order = find_order((int) $order['id']);
    }
    start_payment($order);
}

function track_page(): void
{
    $error = null;
    if (is_post()) {
        $order = find_order_by_number(mb_strtoupper(trim((string) input('number'))));
        if ($order && mb_strtolower(trim((string) input('email'))) === mb_strtolower($order['email'])) {
            redirect(url('/commande/' . $order['number'], ['t' => $order['token']]));
        }
        $error = __('track.not_found');
        remember_input($_POST);
    }
    render('shop/track', ['title' => __('track.title') . ' — ' . setting('shop_name'), 'error' => $error, 'robots' => 'noindex']);
}

function payment_return(callable $confirm): never
{
    $order = public_order((string) ($_GET['order'] ?? ''), $_GET['t'] ?? null);
    try {
        $order = $confirm($order);
    } catch (RuntimeException $e) {
        error_log($e->getMessage());
    }
    $paid = $order['payment_status'] === 'paid';
    if (!$paid) {
        flash('info', __('payment.pending'));
    }
    redirect(url('/commande/' . $order['number'], ['t' => $order['token'], 'merci' => $paid ? 1 : null]));
}

function stripe_return(): void
{
    payment_return(fn($o) => stripe_confirm($o, (string) ($_GET['session_id'] ?? '')));
}

function konnect_return(): void
{
    payment_return(fn($o) => konnect_confirm($o));
}

function flouci_return(): void
{
    payment_return(fn($o) => flouci_confirm($o, (string) ($_GET['payment_id'] ?? '')));
}
