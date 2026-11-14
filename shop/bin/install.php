<?php
declare(strict_types=1);

// Command-line installer, handy for local development and automated tests.
// php bin/install.php --sqlite --url=http://localhost:8000 --email=admin@example.com --password=motdepasse123 [--name="Ma Boutique"] [--currency=TND] [--no-demo]
// MySQL: --mysql --db-host=localhost --db-name=boutique --db-user=user --db-pass=secret

if (PHP_SAPI !== 'cli') {
    exit;
}
define('ROOT_DIR', dirname(__DIR__));
define('APP_DIR', ROOT_DIR . '/app');
define('STORAGE_DIR', ROOT_DIR . '/storage');
define('UPLOAD_DIR', ROOT_DIR . '/uploads');
define('SHOP_VERSION', '1.0.0');

require APP_DIR . '/helpers.php';
require APP_DIR . '/db.php';
require APP_DIR . '/settings.php';
require APP_DIR . '/install.php';

$opts = getopt('', ['sqlite', 'mysql', 'url:', 'email:', 'password:', 'name:', 'currency:', 'locale:', 'no-demo', 'db-host:', 'db-port:', 'db-name:', 'db-user:', 'db-pass:']);
$in = [
    'shop_name' => $opts['name'] ?? 'Ma Boutique',
    'admin_name' => 'Administrateur',
    'admin_email' => $opts['email'] ?? '',
    'admin_password' => $opts['password'] ?? '',
    'driver' => isset($opts['mysql']) ? 'mysql' : 'sqlite',
    'db_host' => $opts['db-host'] ?? 'localhost',
    'db_port' => $opts['db-port'] ?? '3306',
    'db_name' => $opts['db-name'] ?? '',
    'db_user' => $opts['db-user'] ?? '',
    'db_pass' => $opts['db-pass'] ?? '',
    'currency' => strtoupper($opts['currency'] ?? 'TND'),
    'locale' => $opts['locale'] ?? 'fr',
    'base_url' => $opts['url'] ?? 'http://localhost:8000',
    'demo' => !isset($opts['no-demo']),
    'pretty_urls' => true,
];
if (is_file(STORAGE_DIR . '/config.php')) {
    fwrite(STDERR, "Déjà installé (storage/config.php existe).\n");
    exit(1);
}
if ($errors = validate_install_input($in)) {
    foreach ($errors as $k => $msg) {
        fwrite(STDERR, "$k: $msg\n");
    }
    exit(1);
}
try {
    run_install($in);
} catch (Throwable $e) {
    if ($in['driver'] === 'sqlite') {
        @unlink(STORAGE_DIR . '/shop.sqlite');
    }
    fwrite(STDERR, 'Erreur : ' . $e->getMessage() . "\n");
    exit(1);
}
echo "Boutique installée : {$in['base_url']} (admin : {$in['base_url']}/admin)\n";
