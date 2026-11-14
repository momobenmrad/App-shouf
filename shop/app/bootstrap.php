<?php
declare(strict_types=1);

define('ROOT_DIR', dirname(__DIR__));
define('APP_DIR', __DIR__);
define('STORAGE_DIR', ROOT_DIR . '/storage');
define('UPLOAD_DIR', ROOT_DIR . '/uploads');
define('SHOP_VERSION', '1.0.0');

if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    exit('Cette boutique nécessite PHP 8.1 ou plus récent.');
}

mb_internal_encoding('UTF-8');

require APP_DIR . '/helpers.php';
require APP_DIR . '/db.php';
require APP_DIR . '/settings.php';
require APP_DIR . '/i18n.php';
require APP_DIR . '/cart.php';
require APP_DIR . '/orders.php';
require APP_DIR . '/mailer.php';
require APP_DIR . '/payments/payments.php';

$configFile = STORAGE_DIR . '/config.php';
if (!is_file($configFile)) {
    header('Location: ' . base_path() . '/install/');
    exit;
}
$GLOBALS['config'] = require $configFile;

date_default_timezone_set(config('timezone', 'Africa/Tunis'));

if (config('debug')) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', STORAGE_DIR . '/error.log');
}

set_exception_handler(function (Throwable $e): void {
    error_log((string) $e);
    if (!headers_sent()) {
        http_response_code(500);
    }
    if (config('debug')) {
        echo '<pre>' . e((string) $e) . '</pre>';
    } else {
        echo '<!doctype html><meta charset="utf-8"><title>Erreur</title>'
            . '<div style="font-family:system-ui;max-width:32rem;margin:15vh auto;padding:1rem;text-align:center">'
            . '<h1>Une erreur est survenue</h1><p>Merci de réessayer dans quelques instants.</p></div>';
    }
});

$https = is_https();
session_name('shop_sid');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => base_path() . '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

boot_locale();
