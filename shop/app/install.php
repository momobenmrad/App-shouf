<?php
declare(strict_types=1);

// Installation logic shared by the web installer (install/index.php) and the CLI (bin/install.php).

require_once APP_DIR . '/schema.php';

const CURRENCY_PRESETS = [
    'TND' => ['symbol' => 'DT', 'decimals' => 3, 'position' => 'after', 'country' => 'Tunisie', 'label' => 'Dinar tunisien (TND)'],
    'EUR' => ['symbol' => '€', 'decimals' => 2, 'position' => 'after', 'country' => 'France', 'label' => 'Euro (EUR)'],
    'MAD' => ['symbol' => 'DH', 'decimals' => 2, 'position' => 'after', 'country' => 'Maroc', 'label' => 'Dirham marocain (MAD)'],
    'DZD' => ['symbol' => 'DA', 'decimals' => 2, 'position' => 'after', 'country' => 'Algérie', 'label' => 'Dinar algérien (DZD)'],
    'XOF' => ['symbol' => 'FCFA', 'decimals' => 0, 'position' => 'after', 'country' => 'Sénégal', 'label' => 'Franc CFA (XOF)'],
    'USD' => ['symbol' => '$', 'decimals' => 2, 'position' => 'before', 'country' => 'United States', 'label' => 'Dollar US (USD)'],
];

function install_requirements(): array
{
    return [
        ['PHP 8.1 ou plus récent (actuel : ' . PHP_VERSION . ')', PHP_VERSION_ID >= 80100],
        ['Extension PDO MySQL ou SQLite', extension_loaded('pdo_mysql') || extension_loaded('pdo_sqlite')],
        ['Extension mbstring', extension_loaded('mbstring')],
        ['Extension cURL (paiements en ligne)', extension_loaded('curl')],
        ['Extension GD (redimensionnement des photos) — recommandée', extension_loaded('gd')],
        ['Dossier storage/ accessible en écriture', is_writable(STORAGE_DIR)],
        ['Dossier uploads/ accessible en écriture', is_writable(UPLOAD_DIR)],
    ];
}

/**
 * Creates the database schema, settings, administrator, legal pages and optional demo catalog,
 * then writes storage/config.php. Returns the written configuration.
 */
function run_install(array $in): array
{
    $driver = $in['driver'] === 'sqlite' ? 'sqlite' : 'mysql';
    $db = $driver === 'sqlite'
        ? ['driver' => 'sqlite', 'path' => STORAGE_DIR . '/shop.sqlite']
        : ['driver' => 'mysql', 'host' => $in['db_host'] ?: 'localhost', 'port' => (int) ($in['db_port'] ?: 3306), 'name' => $in['db_name'], 'user' => $in['db_user'], 'pass' => $in['db_pass']];

    $config = [
        'db' => $db,
        'base_url' => rtrim($in['base_url'], '/'),
        'pretty_urls' => (bool) ($in['pretty_urls'] ?? true),
        'timezone' => $in['timezone'] ?? 'Africa/Tunis',
        'debug' => false,
    ];
    $GLOBALS['config'] = $config;

    $pdo = db();
    if ((bool) val($driver === 'sqlite'
        ? "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'orders'"
        : "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'")) {
        throw new RuntimeException('Cette base contient déjà une boutique (table « orders »). Utilisez une base vide.');
    }
    foreach (schema_statements($driver) as $sql) {
        $pdo->exec($sql);
    }

    $preset = CURRENCY_PRESETS[$in['currency']] ?? CURRENCY_PRESETS['TND'];
    $scale = 10 ** $preset['decimals'];
    $settings = [
        'shop_name' => $in['shop_name'],
        'shop_email' => $in['admin_email'],
        'notify_email' => $in['admin_email'],
        'currency_code' => $in['currency'],
        'currency_symbol' => $preset['symbol'],
        'currency_decimals' => (string) $preset['decimals'],
        'currency_position' => $preset['position'],
        'default_country' => $preset['country'],
        'default_locale' => $in['locale'] ?? 'fr',
        'shipping_fee' => (string) (7 * $scale),
        'free_shipping_threshold' => (string) (150 * $scale),
        'announcement' => 'Livraison offerte dès 150 ' . $preset['symbol'] . ' d’achat',
    ];
    if ($in['currency'] !== 'TND') {
        $settings['stripe_currency'] = in_array($in['currency'], ['EUR', 'MAD', 'DZD', 'XOF', 'USD'], true) ? strtolower($in['currency']) : 'eur';
    }
    foreach ($settings as $k => $v) {
        q('INSERT INTO settings (name, value) VALUES (:k, :v)', ['k' => $k, 'v' => $v]);
    }
    unset($GLOBALS['_settings']);

    insert('admins', [
        'name' => $in['admin_name'] ?: 'Administrateur',
        'email' => mb_strtolower($in['admin_email']),
        'password_hash' => password_hash($in['admin_password'], PASSWORD_DEFAULT),
        'created_at' => now(),
    ]);

    require_once APP_DIR . '/seed.php';
    seed_pages($in['shop_name']);
    if (!empty($in['demo'])) {
        seed_demo_catalog($scale);
    }

    $export = "<?php\n// Généré par l’installateur le " . date('d/m/Y H:i') . ". Ne partagez pas ce fichier.\nreturn " . var_export($config, true) . ";\n";
    if (file_put_contents(STORAGE_DIR . '/config.php', $export, LOCK_EX) === false) {
        throw new RuntimeException('Impossible d’écrire storage/config.php : vérifiez les droits du dossier storage/.');
    }
    @chmod(STORAGE_DIR . '/config.php', 0600);
    return $config;
}

function validate_install_input(array $in): array
{
    $errors = [];
    if (trim($in['shop_name'] ?? '') === '') {
        $errors['shop_name'] = 'Indiquez le nom de la boutique.';
    }
    if (!valid_email($in['admin_email'] ?? '')) {
        $errors['admin_email'] = 'E-mail invalide.';
    }
    if (mb_strlen($in['admin_password'] ?? '') < 10) {
        $errors['admin_password'] = '10 caractères minimum.';
    }
    if (($in['driver'] ?? '') === 'mysql') {
        if (($in['db_name'] ?? '') === '' || ($in['db_user'] ?? '') === '') {
            $errors['db_name'] = 'Nom de la base et utilisateur obligatoires.';
        }
    } elseif (($in['driver'] ?? '') !== 'sqlite') {
        $errors['driver'] = 'Choisissez un type de base de données.';
    }
    if (!isset(CURRENCY_PRESETS[$in['currency'] ?? ''])) {
        $errors['currency'] = 'Devise inconnue.';
    }
    if (!preg_match('#^https?://[^\s]+$#', $in['base_url'] ?? '')) {
        $errors['base_url'] = 'Adresse invalide (ex. https://www.ma-boutique.com).';
    }
    return $errors;
}
