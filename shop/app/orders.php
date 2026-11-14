<?php
declare(strict_types=1);

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refunded'];

function order_status_label(string $status): string
{
    return __('status.' . $status);
}

function payment_method_label(string $method): string
{
    return __('payment.' . $method);
}

function payment_status_label(string $status): string
{
    return __('payment_status.' . $status);
}

class OutOfStockException extends RuntimeException
{
}

/**
 * Creates an order from resolved cart lines inside one transaction: re-checks and decrements stock,
 * records items and coupon usage. Throws OutOfStockException when a line can no longer be served.
 */
function create_order(array $customer, array $lines, array $totals, string $paymentMethod): array
{
    return transaction(function () use ($customer, $lines, $totals, $paymentMethod) {
        foreach ($lines as $line) {
            $pid = (int) $line['product']['id'];
            $vid = $line['variant'] ? (int) $line['variant']['id'] : null;
            $table = $vid ? 'product_variants' : 'products';
            $rowId = $vid ?? $pid;
            $stock = val("SELECT stock FROM $table WHERE id = :id", ['id' => $rowId]);
            if ($stock !== null) {
                $n = q(
                    "UPDATE $table SET stock = stock - :q1 WHERE id = :id AND stock IS NOT NULL AND stock >= :q2",
                    ['q1' => $line['qty'], 'q2' => $line['qty'], 'id' => $rowId]
                )->rowCount();
                if ($n !== 1) {
                    throw new OutOfStockException($line['name']);
                }
            }
            q('UPDATE products SET sales_count = sales_count + :q WHERE id = :id', ['q' => $line['qty'], 'id' => $pid]);
        }

        $ts = now();
        $orderId = insert('orders', [
            'token' => random_token(16),
            'status' => 'pending',
            'payment_method' => $paymentMethod,
            'payment_status' => 'unpaid',
            'customer_name' => $customer['name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'],
            'address' => $customer['address'],
            'city' => $customer['city'],
            'postal_code' => $customer['postal_code'] ?: null,
            'country' => $customer['country'] ?: null,
            'notes' => $customer['notes'] ?: null,
            'coupon_code' => $totals['coupon']['code'] ?? null,
            'subtotal' => $totals['subtotal'],
            'discount' => $totals['discount'],
            'shipping' => $totals['shipping'] + $totals['fee'],
            'total' => $totals['total'],
            'locale' => locale(),
            'ip' => client_ip(),
            'created_at' => $ts,
            'updated_at' => $ts,
        ]);
        $number = strtoupper((string) setting('order_prefix', 'CMD')) . '-' . (10000 + $orderId);
        update('orders', ['number' => $number], 'id = :id', ['id' => $orderId]);

        foreach ($lines as $line) {
            insert('order_items', [
                'order_id' => $orderId,
                'product_id' => (int) $line['product']['id'],
                'variant_id' => $line['variant'] ? (int) $line['variant']['id'] : null,
                'name' => $line['name'],
                'variant_name' => $line['variant_name'],
                'sku' => $line['variant']['sku'] ?? $line['product']['sku'] ?? null,
                'unit_price' => $line['unit_price'],
                'quantity' => $line['qty'],
                'total' => $line['total'],
            ]);
        }
        if (!empty($totals['coupon'])) {
            q('UPDATE coupons SET used_count = used_count + 1 WHERE id = :id', ['id' => $totals['coupon']['id']]);
        }
        order_event($orderId, 'Commande créée (' . payment_method_label($paymentMethod) . ')');
        return find_order($orderId);
    });
}

function find_order(int $id): ?array
{
    return one('SELECT * FROM orders WHERE id = :id', ['id' => $id]);
}

function find_order_by_number(string $number): ?array
{
    return one('SELECT * FROM orders WHERE number = :n', ['n' => $number]);
}

function order_items(int $orderId): array
{
    return all('SELECT * FROM order_items WHERE order_id = :id ORDER BY id', ['id' => $orderId]);
}

function order_event(int $orderId, string $message): void
{
    insert('order_events', ['order_id' => $orderId, 'message' => mb_substr($message, 0, 300), 'created_at' => now()]);
}

function order_public_url(array $order): string
{
    return abs_url('/commande/' . $order['number'], ['t' => $order['token']]);
}

/** Idempotently records a successful online payment and notifies the customer and the shop. */
function mark_order_paid(array $order, string $provider, string $reference): array
{
    if ($order['payment_status'] === 'paid') {
        return $order;
    }
    $changed = update(
        'orders',
        ['payment_status' => 'paid', 'payment_ref' => $reference, 'paid_at' => now(), 'updated_at' => now(), 'status' => $order['status'] === 'pending' ? 'confirmed' : $order['status']],
        "id = :id AND payment_status <> 'paid'",
        ['id' => $order['id']]
    );
    $order = find_order((int) $order['id']);
    if ($changed) {
        order_event((int) $order['id'], 'Paiement ' . $provider . ' confirmé (réf. ' . $reference . ')');
        send_order_emails($order);
    }
    return $order;
}

function mark_order_payment_failed(array $order, string $provider, string $reason = ''): void
{
    if ($order['payment_status'] === 'paid') {
        return;
    }
    update('orders', ['payment_status' => 'failed', 'updated_at' => now()], 'id = :id', ['id' => $order['id']]);
    order_event((int) $order['id'], 'Échec du paiement ' . $provider . ($reason ? ' : ' . $reason : ''));
}

/** Puts reserved stock back when an order is cancelled (only once per order). */
function restore_order_stock(array $order): void
{
    if ((int) $order['stock_restored']) {
        return;
    }
    transaction(function () use ($order) {
        foreach (order_items((int) $order['id']) as $item) {
            if ($item['variant_id']) {
                q('UPDATE product_variants SET stock = stock + :q WHERE id = :id AND stock IS NOT NULL', ['q' => $item['quantity'], 'id' => $item['variant_id']]);
            } elseif ($item['product_id']) {
                q('UPDATE products SET stock = stock + :q WHERE id = :id AND stock IS NOT NULL', ['q' => $item['quantity'], 'id' => $item['product_id']]);
            }
            if ($item['product_id']) {
                q('UPDATE products SET sales_count = CASE WHEN sales_count >= :q1 THEN sales_count - :q2 ELSE 0 END WHERE id = :id',
                    ['q1' => $item['quantity'], 'q2' => $item['quantity'], 'id' => $item['product_id']]);
            }
        }
        update('orders', ['stock_restored' => 1], 'id = :id', ['id' => $order['id']]);
    });
    order_event((int) $order['id'], 'Stock remis en vente');
}

function send_order_emails(array $order): void
{
    $items = order_items((int) $order['id']);
    $previousLocale = locale();
    // Write to the customer in the language they ordered in, even from a payment webhook.
    if ($order['locale'] && isset(SUPPORTED_LOCALES[$order['locale']])) {
        $GLOBALS['_locale'] = $order['locale'];
    }
    try {
        send_mail(
            $order['email'],
            __('mail.order_subject', ['number' => $order['number'], 'shop' => setting('shop_name')]),
            mail_view('emails/order_customer', ['order' => $order, 'items' => $items])
        );
        $GLOBALS['_locale'] = 'fr';
        $notify = setting('notify_email') ?: setting('shop_email');
        if ($notify) {
            send_mail(
                $notify,
                'Nouvelle commande ' . $order['number'] . ' — ' . format_money((int) $order['total']),
                mail_view('emails/order_admin', ['order' => $order, 'items' => $items]),
                $order['email']
            );
        }
    } catch (Throwable $e) {
        error_log('Order mail failed: ' . $e->getMessage());
    } finally {
        $GLOBALS['_locale'] = $previousLocale;
    }
}
