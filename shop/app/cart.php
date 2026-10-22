<?php
declare(strict_types=1);

const CART_MAX_QTY = 99;

function cart_items(): array
{
    return $_SESSION['cart']['items'] ?? [];
}

function cart_count(): int
{
    return array_sum(cart_items());
}

function cart_key(int $productId, ?int $variantId): string
{
    return $productId . ':' . ($variantId ?: 0);
}

function cart_set(int $productId, ?int $variantId, int $qty): void
{
    $key = cart_key($productId, $variantId);
    if ($qty <= 0) {
        unset($_SESSION['cart']['items'][$key]);
    } else {
        $_SESSION['cart']['items'][$key] = min($qty, CART_MAX_QTY);
    }
}

function cart_clear(): void
{
    unset($_SESSION['cart']);
}

function cart_coupon(): ?string
{
    return $_SESSION['cart']['coupon'] ?? null;
}

function cart_set_coupon(?string $code): void
{
    if ($code === null) {
        unset($_SESSION['cart']['coupon']);
    } else {
        $_SESSION['cart']['coupon'] = $code;
    }
}

/** Units still available for a product/variant, or null when stock is not tracked. */
function available_stock(array $product, ?array $variant): ?int
{
    $stock = $variant ? $variant['stock'] : $product['stock'];
    return $stock === null ? null : max(0, (int) $stock);
}

function unit_price(array $product, ?array $variant): int
{
    return $variant && $variant['price'] !== null ? (int) $variant['price'] : (int) $product['price'];
}

/**
 * Resolves the session cart against the database: drops removed products, clamps quantities to stock
 * and reprices every line. Returns [lines, notices].
 */
function cart_lines(): array
{
    $items = cart_items();
    if (!$items) {
        return [[], []];
    }
    $productIds = $variantIds = [];
    foreach (array_keys($items) as $key) {
        [$p, $v] = array_map('intval', explode(':', (string) $key));
        $productIds[] = $p;
        if ($v) {
            $variantIds[] = $v;
        }
    }
    $params = [];
    $products = [];
    foreach (all('SELECT * FROM products WHERE is_active = 1 AND id IN ' . in_list($productIds, $params), $params) as $p) {
        $products[(int) $p['id']] = $p;
    }
    $variants = [];
    if ($variantIds) {
        $params = [];
        foreach (all('SELECT * FROM product_variants WHERE id IN ' . in_list($variantIds, $params), $params) as $v) {
            $variants[(int) $v['id']] = $v;
        }
    }
    $variantCounts = [];
    $params = [];
    foreach (all('SELECT product_id, COUNT(*) n FROM product_variants WHERE product_id IN ' . in_list($productIds, $params) . ' GROUP BY product_id', $params) as $r) {
        $variantCounts[(int) $r['product_id']] = (int) $r['n'];
    }

    $lines = [];
    $notices = [];
    foreach ($items as $key => $qty) {
        [$pid, $vid] = array_map('intval', explode(':', (string) $key));
        $product = $products[$pid] ?? null;
        $variant = $vid ? ($variants[$vid] ?? null) : null;
        $invalidVariant = $vid ? (!$variant || (int) $variant['product_id'] !== $pid) : (($variantCounts[$pid] ?? 0) > 0);
        if (!$product || $invalidVariant) {
            unset($_SESSION['cart']['items'][$key]);
            $notices[] = __('cart.item_removed');
            continue;
        }
        $stock = available_stock($product, $variant);
        if ($stock !== null && $qty > $stock) {
            if ($stock === 0) {
                unset($_SESSION['cart']['items'][$key]);
                $notices[] = __('cart.out_of_stock_removed', ['name' => $product['name']]);
                continue;
            }
            $qty = $stock;
            $_SESSION['cart']['items'][$key] = $qty;
            $notices[] = __('cart.qty_adjusted', ['name' => $product['name'], 'qty' => $qty]);
        }
        $price = unit_price($product, $variant);
        $lines[] = [
            'key' => $key,
            'product' => $product,
            'variant' => $variant,
            'name' => $product['name'],
            'variant_name' => $variant['name'] ?? null,
            'unit_price' => $price,
            'qty' => (int) $qty,
            'total' => $price * (int) $qty,
            'max' => $stock === null ? CART_MAX_QTY : min($stock, CART_MAX_QTY),
            'image' => product_cover($pid),
            'url' => url('/produit/' . $product['slug']),
        ];
    }
    return [$lines, $notices];
}

function find_coupon(string $code): ?array
{
    return one('SELECT * FROM coupons WHERE UPPER(code) = :c', ['c' => mb_strtoupper(trim($code))]);
}

/** Returns an error message if the coupon cannot be used for this subtotal, null otherwise. */
function coupon_error(?array $coupon, int $subtotal): ?string
{
    if (!$coupon || !(int) $coupon['is_active']) {
        return __('coupon.invalid');
    }
    if ($coupon['expires_at'] && $coupon['expires_at'] < now()) {
        return __('coupon.expired');
    }
    if ($coupon['max_uses'] !== null && (int) $coupon['used_count'] >= (int) $coupon['max_uses']) {
        return __('coupon.exhausted');
    }
    if ($subtotal < (int) $coupon['min_total']) {
        return __('coupon.min_total', ['amount' => format_money((int) $coupon['min_total'])]);
    }
    return null;
}

function coupon_discount(array $coupon, int $subtotal): int
{
    $d = $coupon['type'] === 'percent'
        ? (int) round($subtotal * min(100, (int) $coupon['value']) / 100)
        : (int) $coupon['value'];
    return min($d, $subtotal);
}

function shipping_cost(int $amount): int
{
    $threshold = (int) setting('free_shipping_threshold', 0);
    if ($amount <= 0 || ($threshold > 0 && $amount >= $threshold)) {
        return 0;
    }
    return (int) setting('shipping_fee', 0);
}

function cart_totals(array $lines, ?string $paymentMethod = null): array
{
    $subtotal = array_sum(array_column($lines, 'total'));
    $discount = 0;
    $coupon = null;
    $couponError = null;
    if ($code = cart_coupon()) {
        $coupon = find_coupon($code);
        $couponError = coupon_error($coupon, $subtotal);
        if ($couponError) {
            $coupon = null;
        } else {
            $discount = coupon_discount($coupon, $subtotal);
        }
    }
    $shipping = $lines ? shipping_cost($subtotal - $discount) : 0;
    $fee = $paymentMethod === 'cod' ? (int) setting('cod_fee', 0) : 0;
    $threshold = (int) setting('free_shipping_threshold', 0);
    return [
        'subtotal' => $subtotal,
        'discount' => $discount,
        'shipping' => $shipping,
        'fee' => $fee,
        'total' => max(0, $subtotal - $discount + $shipping + $fee),
        'coupon' => $coupon,
        'coupon_error' => $couponError,
        'free_shipping_remaining' => $threshold > 0 && $lines ? max(0, $threshold - ($subtotal - $discount)) : null,
    ];
}

// ---------------------------------------------------------------- product helpers

function product_cover(int $productId): ?string
{
    static $cache = [];
    if (!array_key_exists($productId, $cache)) {
        $cache[$productId] = val('SELECT path FROM product_images WHERE product_id = :id ORDER BY position, id LIMIT 1', ['id' => $productId]);
    }
    return $cache[$productId];
}

/** Adds cover/hover images, variant info and stock flags to a list of product rows. */
function hydrate_products(array $products): array
{
    if (!$products) {
        return [];
    }
    $params = [];
    $in = in_list(array_column($products, 'id'), $params);
    $images = [];
    foreach (all("SELECT product_id, path FROM product_images WHERE product_id IN $in ORDER BY position, id", $params) as $img) {
        $images[(int) $img['product_id']][] = $img['path'];
    }
    $variants = [];
    foreach (all("SELECT product_id, MIN(price) min_price, MAX(price) max_price, COUNT(price) priced, COUNT(*) n,
                         SUM(CASE WHEN stock IS NULL OR stock > 0 THEN 1 ELSE 0 END) in_stock
                  FROM product_variants WHERE product_id IN $in GROUP BY product_id", $params) as $v) {
        $variants[(int) $v['product_id']] = $v;
    }
    foreach ($products as &$p) {
        $id = (int) $p['id'];
        $p['images'] = $images[$id] ?? [];
        $p['cover'] = $p['images'][0] ?? null;
        $p['hover'] = $p['images'][1] ?? null;
        $v = $variants[$id] ?? null;
        $p['has_variants'] = (bool) $v;
        $p['in_stock'] = $v ? (int) $v['in_stock'] > 0 : ($p['stock'] === null || (int) $p['stock'] > 0);
        // Effective prices: priced variants, plus the base price for variants without their own.
        $prices = [(int) $p['price']];
        if ($v && (int) $v['priced'] > 0) {
            $prices = [(int) $v['min_price'], (int) $v['max_price']];
            if ((int) $v['priced'] < (int) $v['n']) {
                $prices[] = (int) $p['price'];
            }
        }
        $p['from_price'] = min($prices);
        $p['price_varies'] = min($prices) !== max($prices);
        $p['discount_pct'] = $p['compare_price'] && (int) $p['compare_price'] > (int) $p['price']
            ? (int) round(100 - ((int) $p['price'] * 100 / (int) $p['compare_price']))
            : 0;
        $p['url'] = url('/produit/' . $p['slug']);
    }
    return $products;
}
