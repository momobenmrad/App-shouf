<?php
declare(strict_types=1);

// Konnect (https://konnect.network) — cartes bancaires tunisiennes, e-DINAR, wallet Konnect. API v2.

function konnect_base(): string
{
    return setting('konnect_sandbox') ? 'https://api.sandbox.konnect.network/api/v2' : 'https://api.konnect.network/api/v2';
}

function konnect_api(string $method, string $path, ?array $body = null): array
{
    $res = http_request(
        $method,
        konnect_base() . $path,
        ['x-api-key' => (string) setting('konnect_api_key'), 'Content-Type' => 'application/json'],
        $body === null ? null : json_encode($body)
    );
    if ($res['status'] >= 400 || !$res['json']) {
        payment_log('konnect', "$path failed: HTTP {$res['status']} {$res['raw']}");
        throw new RuntimeException('Konnect : le paiement n’a pas pu être initialisé.');
    }
    return $res['json'];
}

function konnect_start(array $order): string
{
    [$first, $last] = array_pad(explode(' ', $order['customer_name'], 2), 2, '');
    $res = konnect_api('POST', '/payments/init-payment', [
        'receiverWalletId' => setting('konnect_wallet_id'),
        'token' => 'TND',
        'amount' => to_millimes((int) $order['total']),
        'type' => 'immediate',
        'description' => __('payment.order_label', ['number' => $order['number'], 'shop' => setting('shop_name')]),
        'acceptedPaymentMethods' => ['wallet', 'bank_card', 'e-DINAR'],
        'lifespan' => 30,
        'checkoutForm' => false,
        'addPaymentFeesToAmount' => false,
        'firstName' => $first,
        'lastName' => $last,
        'phoneNumber' => preg_replace('/\D/', '', $order['phone']),
        'email' => $order['email'],
        'orderId' => $order['number'],
        'webhook' => abs_url('/webhook/konnect'),
        'silentWebhook' => true,
        'successUrl' => abs_url('/paiement/konnect/retour', ['order' => $order['number'], 't' => $order['token']]),
        'failUrl' => order_public_url($order) . '&failed=1',
        'theme' => 'light',
    ]);
    if (empty($res['payUrl']) || empty($res['paymentRef'])) {
        throw new RuntimeException('Konnect : réponse inattendue.');
    }
    update('orders', ['payment_ref' => $res['paymentRef']], 'id = :id', ['id' => $order['id']]);
    return $res['payUrl'];
}

/** Asks Konnect for the payment status (never trust redirect parameters alone). */
function konnect_confirm(array $order): array
{
    $ref = (string) $order['payment_ref'];
    if (!preg_match('/^[A-Za-z0-9_-]{1,100}$/', $ref)) {
        return $order;
    }
    $res = konnect_api('GET', '/payments/' . $ref);
    $payment = $res['payment'] ?? [];
    $status = $payment['status'] ?? '';
    $amountOk = !isset($payment['amount']) || (int) $payment['amount'] === to_millimes((int) $order['total']);
    if ($status === 'completed' && $amountOk) {
        return mark_order_paid($order, 'Konnect', $ref);
    }
    if ($status === 'completed' && !$amountOk) {
        payment_log('konnect', "amount mismatch for {$order['number']}");
    }
    return $order;
}

/** Konnect calls GET /webhook/konnect?payment_ref=… once the payment is settled. */
function konnect_webhook(): never
{
    $ref = (string) ($_GET['payment_ref'] ?? '');
    $order = $ref ? one('SELECT * FROM orders WHERE payment_ref = :r', ['r' => $ref]) : null;
    if ($order) {
        konnect_confirm($order);
    }
    json_response(['ok' => true]);
}
