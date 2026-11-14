<?php
declare(strict_types=1);

// Flouci (https://flouci.com) — paiement par wallet Flouci et carte bancaire. Montants en millimes.

const FLOUCI_API = 'https://developers.flouci.com/api';

function flouci_start(array $order): string
{
    $res = http_request('POST', FLOUCI_API . '/generate_payment', ['Content-Type' => 'application/json'], json_encode([
        'app_token' => setting('flouci_app_token'),
        'app_secret' => setting('flouci_app_secret'),
        'amount' => (string) to_millimes((int) $order['total']),
        'accept_card' => 'true',
        'session_timeout_secs' => 1200,
        'success_link' => abs_url('/paiement/flouci/retour', ['order' => $order['number'], 't' => $order['token']]),
        'fail_link' => order_public_url($order) . '&failed=1',
        'developer_tracking_id' => $order['number'],
    ]));
    $result = $res['json']['result'] ?? [];
    if ($res['status'] >= 400 || empty($result['link']) || empty($result['payment_id'])) {
        payment_log('flouci', "generate_payment failed: HTTP {$res['status']} {$res['raw']}");
        throw new RuntimeException('Flouci : le paiement n’a pas pu être initialisé.');
    }
    update('orders', ['payment_ref' => $result['payment_id']], 'id = :id', ['id' => $order['id']]);
    return $result['link'];
}

function flouci_confirm(array $order, string $paymentId): array
{
    if ($paymentId !== $order['payment_ref'] || !preg_match('/^[A-Za-z0-9_-]{1,100}$/', $paymentId)) {
        return $order;
    }
    $res = http_request('GET', FLOUCI_API . '/verify_payment/' . $paymentId, [
        'Content-Type' => 'application/json',
        'apppublic' => (string) setting('flouci_app_token'),
        'appsecret' => (string) setting('flouci_app_secret'),
    ]);
    $result = $res['json']['result'] ?? [];
    if (($res['json']['success'] ?? false) && ($result['status'] ?? '') === 'SUCCESS') {
        return mark_order_paid($order, 'Flouci', $paymentId);
    }
    payment_log('flouci', "verify {$order['number']}: HTTP {$res['status']} {$res['raw']}");
    return $order;
}
