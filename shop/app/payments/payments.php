<?php
declare(strict_types=1);

require __DIR__ . '/stripe.php';
require __DIR__ . '/konnect.php';
require __DIR__ . '/flouci.php';

/** Payment methods that are enabled and fully configured, in display order (Konnect and Flouci only settle TND). */
function payment_methods(): array
{
    $methods = [];
    if (setting('cod_enabled')) {
        $methods[] = 'cod';
    }
    $tnd = strtoupper((string) setting('currency_code')) === 'TND';
    if ($tnd && setting('konnect_enabled') && setting('konnect_api_key') && setting('konnect_wallet_id')) {
        $methods[] = 'konnect';
    }
    if ($tnd && setting('flouci_enabled') && setting('flouci_app_token') && setting('flouci_app_secret')) {
        $methods[] = 'flouci';
    }
    if (setting('stripe_enabled') && setting('stripe_secret_key')) {
        $methods[] = 'stripe';
    }
    return $methods;
}

/** Converts a shop amount (minor units) to millimes, the unit of Tunisian gateways. */
function to_millimes(int $minor): int
{
    return (int) round($minor * (10 ** (3 - currency_decimals())));
}

/** Small JSON/form HTTP client on top of cURL (available on virtually every shared host). */
function http_request(string $method, string $url, array $headers = [], ?string $body = null): array
{
    $ch = curl_init($url);
    $h = [];
    foreach ($headers as $k => $v) {
        $h[] = "$k: $v";
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $h,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        payment_log(parse_url($url, PHP_URL_HOST) ?: 'http', "$method $url failed: $error");
        throw new RuntimeException('Connexion au service de paiement impossible : ' . $error);
    }
    $json = json_decode((string) $raw, true);
    return ['status' => $status, 'json' => is_array($json) ? $json : null, 'raw' => (string) $raw];
}

function payment_log(string $provider, string $message): void
{
    @file_put_contents(STORAGE_DIR . '/payments.log', '[' . now() . "] $provider: $message\n", FILE_APPEND);
}
