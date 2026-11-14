<?php
declare(strict_types=1);

// Stripe Checkout (hosted payment page). Stripe does not support every currency (TND is not supported):
// set "Devise Stripe" and the conversion rate in the admin when the shop currency differs.

const STRIPE_ZERO_DECIMAL = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];

function stripe_amount(int $minor): int
{
    $currency = strtolower((string) setting('stripe_currency', 'eur'));
    $major = $minor / (10 ** currency_decimals()) * (float) setting('stripe_rate', 1);
    return (int) round(in_array($currency, STRIPE_ZERO_DECIMAL, true) ? $major : $major * 100);
}

function stripe_api(string $method, string $path, array $params = []): array
{
    $res = http_request(
        $method,
        'https://api.stripe.com/v1' . $path,
        ['Authorization' => 'Bearer ' . setting('stripe_secret_key'), 'Content-Type' => 'application/x-www-form-urlencoded'],
        $params ? http_build_query($params) : null
    );
    if ($res['status'] >= 400 || !$res['json']) {
        $msg = $res['json']['error']['message'] ?? ('HTTP ' . $res['status']);
        payment_log('stripe', "$path failed: $msg");
        throw new RuntimeException('Stripe : ' . $msg);
    }
    return $res['json'];
}

/** Creates a Checkout Session and returns the URL to redirect the customer to. */
function stripe_start(array $order): string
{
    $session = stripe_api('POST', '/checkout/sessions', [
        'mode' => 'payment',
        'client_reference_id' => $order['number'],
        'customer_email' => $order['email'],
        'line_items' => [[
            'quantity' => 1,
            'price_data' => [
                'currency' => strtolower((string) setting('stripe_currency', 'eur')),
                'unit_amount' => stripe_amount((int) $order['total']),
                'product_data' => ['name' => __('payment.order_label', ['number' => $order['number'], 'shop' => setting('shop_name')])],
            ],
        ]],
        'metadata' => ['order_number' => $order['number']],
        'success_url' => abs_url('/paiement/stripe/retour', ['order' => $order['number'], 't' => $order['token']]) . '&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => order_public_url($order) . '&cancelled=1',
        'locale' => in_array(locale(), ['fr', 'en'], true) ? locale() : 'auto',
    ]);
    update('orders', ['payment_ref' => $session['id']], 'id = :id', ['id' => $order['id']]);
    return $session['url'];
}

/** Confirms a session server-side; returns the updated order. */
function stripe_confirm(array $order, string $sessionId): array
{
    if (!preg_match('/^cs_[A-Za-z0-9_]+$/', $sessionId)) {
        return $order;
    }
    $session = stripe_api('GET', '/checkout/sessions/' . $sessionId);
    if (($session['client_reference_id'] ?? '') !== $order['number']) {
        payment_log('stripe', "session $sessionId does not belong to {$order['number']}");
        return $order;
    }
    if (($session['payment_status'] ?? '') === 'paid') {
        return mark_order_paid($order, 'Stripe', (string) ($session['payment_intent'] ?? $sessionId));
    }
    return $order;
}

/** Verifies the Stripe-Signature header (HMAC-SHA256, 5 minute tolerance). */
function stripe_verify_signature(string $payload, string $header, string $secret): bool
{
    $parts = [];
    foreach (explode(',', $header) as $kv) {
        [$k, $v] = array_pad(explode('=', trim($kv), 2), 2, '');
        $parts[$k][] = $v;
    }
    $t = (int) ($parts['t'][0] ?? 0);
    if (!$t || abs(time() - $t) > 300) {
        return false;
    }
    $expected = hash_hmac('sha256', $t . '.' . $payload, $secret);
    foreach ($parts['v1'] ?? [] as $sig) {
        if (hash_equals($expected, $sig)) {
            return true;
        }
    }
    return false;
}

function stripe_webhook(): never
{
    $payload = (string) file_get_contents('php://input');
    $secret = (string) setting('stripe_webhook_secret');
    if (!$secret || !stripe_verify_signature($payload, $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '', $secret)) {
        json_response(['ok' => false], 400);
    }
    $event = json_decode($payload, true);
    $type = $event['type'] ?? '';
    $session = $event['data']['object'] ?? [];
    $number = $session['client_reference_id'] ?? '';
    if ($number && ($order = find_order_by_number((string) $number))) {
        if (in_array($type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)
            && ($session['payment_status'] ?? '') === 'paid') {
            mark_order_paid($order, 'Stripe', (string) ($session['payment_intent'] ?? $session['id']));
        } elseif ($type === 'checkout.session.async_payment_failed') {
            mark_order_payment_failed($order, 'Stripe');
        }
    }
    json_response(['ok' => true]);
}
