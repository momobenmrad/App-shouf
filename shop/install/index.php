<?php
declare(strict_types=1);

// Web installer: checks the server, creates the database and the first administrator, then locks itself.

define('ROOT_DIR', dirname(__DIR__));
define('APP_DIR', ROOT_DIR . '/app');
define('STORAGE_DIR', ROOT_DIR . '/storage');
define('UPLOAD_DIR', ROOT_DIR . '/uploads');
define('SHOP_VERSION', '1.0.0');

require APP_DIR . '/helpers.php';
require APP_DIR . '/db.php';
require APP_DIR . '/settings.php';
require APP_DIR . '/install.php';

session_name('shop_install');
session_start();
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');

$installed = is_file(STORAGE_DIR . '/config.php');
$errors = [];
$done = null;
$requirements = install_requirements();
$blocking = array_filter([$requirements[0], $requirements[1], $requirements[2], $requirements[5], $requirements[6]], fn($r) => !$r[1]);
$detectedUrl = (is_https() ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . base_path();
$in = [
    'shop_name' => '', 'admin_name' => '', 'admin_email' => '', 'admin_password' => '',
    'driver' => extension_loaded('pdo_mysql') ? 'mysql' : 'sqlite', 'db_host' => 'localhost', 'db_port' => '3306', 'db_name' => '', 'db_user' => '', 'db_pass' => '',
    'currency' => 'TND', 'locale' => 'fr', 'base_url' => $detectedUrl, 'demo' => '1',
];
if (empty($_SESSION['install_csrf'])) {
    $_SESSION['install_csrf'] = bin2hex(random_bytes(16));
}

if (!$installed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    if (!hash_equals($_SESSION['install_csrf'], (string) ($_POST['_csrf'] ?? ''))) {
        $errors['_'] = 'Session expirée, merci de réessayer.';
    } else {
        foreach (array_keys($in) as $k) {
            $in[$k] = is_string($_POST[$k] ?? null) ? trim($_POST[$k]) : ($k === 'demo' ? '' : $in[$k]);
        }
        $in['admin_password'] = (string) ($_POST['admin_password'] ?? '');
        $in['db_pass'] = (string) ($_POST['db_pass'] ?? '');
        $in['pretty_urls'] = true;
        $errors = validate_install_input($in);
        if (!$errors && $blocking) {
            $errors['_'] = 'Le serveur ne remplit pas les prérequis indiqués en rouge.';
        }
        if (!$errors) {
            try {
                $done = run_install($in);
            } catch (Throwable $e) {
                if ($in['driver'] === 'sqlite' && is_file(STORAGE_DIR . '/shop.sqlite') && !is_file(STORAGE_DIR . '/config.php')) {
                    @unlink(STORAGE_DIR . '/shop.sqlite');
                }
                $msg = $e->getMessage();
                if ($e instanceof PDOException && str_contains($msg, 'Access denied')) {
                    $msg = 'Accès refusé par MySQL : vérifiez l’utilisateur et le mot de passe de la base.';
                } elseif ($e instanceof PDOException && (str_contains($msg, 'Unknown database') || str_contains($msg, '1049'))) {
                    $msg = 'Base de données introuvable : créez-la d’abord depuis votre panneau d’hébergement (cPanel → Bases de données MySQL).';
                } elseif ($e instanceof PDOException && (str_contains($msg, '2002') || str_contains($msg, 'getaddrinfo'))) {
                    $msg = 'Serveur MySQL injoignable : vérifiez l’hôte (souvent « localhost »).';
                }
                $errors['_'] = $msg;
            }
        }
    }
}

$err = fn(string $k) => isset($errors[$k]) ? '<p class="field-error">' . e($errors[$k]) . '</p>' : '';
?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Installation de la boutique</title>
    <link rel="stylesheet" href="../assets/css/admin.css">
    <style>
        .install { max-width: 760px; margin: 2.5rem auto; padding: 0 1rem; display: grid; gap: 1.25rem; }
        .install h1 { font-size: 26px; }
        .install .panel h2 { font-size: 16px; margin-bottom: 1rem; }
        .req { list-style: none; margin: 0; padding: 0; display: grid; gap: .4rem; }
        .req li::before { content: "✓"; display: inline-block; width: 1.4rem; color: var(--success); font-weight: 800; }
        .req li.ko::before { content: "✕"; color: var(--danger); }
        .req li.ko { color: var(--danger); }
        .driver-mysql, .driver-sqlite { display: none; }
        form[data-driver="mysql"] .driver-mysql, form[data-driver="sqlite"] .driver-sqlite { display: grid; }
        .success { text-align: center; padding: 2rem; }
        .success .big { font-size: 48px; }
    </style>
</head>
<body class="admin-blank">
<main class="install">
    <div>
        <h1>Installation de la boutique</h1>
        <p class="muted">Trois minutes suffisent. Préparez les accès à une base MySQL vide (créée depuis votre panneau d’hébergement), ou choisissez SQLite pour un essai.</p>
    </div>

<?php if ($done): ?>
    <section class="panel success">
        <div class="big">🎉</div>
        <h2>Votre boutique est installée !</h2>
        <p>Connectez-vous à l’administration avec l’e-mail <strong><?= e($in['admin_email']) ?></strong>, puis suivez la liste « Mise en route » du tableau de bord.</p>
        <p class="hint">Par sécurité, vous pouvez supprimer le dossier <code>install/</code> du serveur (il est de toute façon verrouillé).</p>
        <div class="inline-form" style="justify-content:center;margin-top:1rem">
            <a class="btn btn-primary" href="<?= e($done['base_url']) ?>/admin">Ouvrir l’administration</a>
            <a class="btn btn-outline" href="<?= e($done['base_url']) ?>/">Voir la boutique</a>
        </div>
    </section>
<?php elseif ($installed): ?>
    <section class="panel">
        <h2>La boutique est déjà installée</h2>
        <p>Le fichier <code>storage/config.php</code> existe. Pour réinstaller, supprimez-le ainsi que les tables de la base (ou <code>storage/shop.sqlite</code>).</p>
        <a class="btn btn-primary" href="../">Aller à la boutique</a>
    </section>
<?php else: ?>
    <section class="panel">
        <h2>1. Vérification du serveur</h2>
        <ul class="req">
            <?php foreach ($requirements as [$label, $ok]): ?><li class="<?= $ok ? '' : 'ko' ?>"><?= e($label) ?></li><?php endforeach ?>
        </ul>
    </section>

    <?php if (!empty($errors['_'])): ?><div class="alert alert-error" role="alert"><?= e($errors['_']) ?></div><?php endif ?>

    <form method="post" class="form-stack" data-driver="<?= e($in['driver']) ?>" id="install-form">
        <input type="hidden" name="_csrf" value="<?= e($_SESSION['install_csrf']) ?>">

        <section class="panel form-stack">
            <h2>2. Votre boutique</h2>
            <div class="field-row">
                <div class="field"><label for="shop_name">Nom de la boutique</label><input id="shop_name" name="shop_name" required value="<?= e($in['shop_name']) ?>" placeholder="Ma Boutique"><?= $err('shop_name') ?></div>
                <div class="field"><label for="currency">Devise</label>
                    <select id="currency" name="currency"><?php foreach (CURRENCY_PRESETS as $code => $p): ?><option value="<?= $code ?>" <?= $in['currency'] === $code ? 'selected' : '' ?>><?= e($p['label']) ?></option><?php endforeach ?></select></div>
            </div>
            <div class="field-row">
                <div class="field"><label for="base_url">Adresse du site</label><input id="base_url" name="base_url" required value="<?= e($in['base_url']) ?>"><?= $err('base_url') ?><p class="hint">Détectée automatiquement. Utilisez https:// dès que le certificat SSL est actif.</p></div>
                <div class="field"><label for="locale">Langue par défaut</label>
                    <select id="locale" name="locale"><option value="fr">Français</option><option value="ar" <?= $in['locale'] === 'ar' ? 'selected' : '' ?>>العربية</option><option value="en" <?= $in['locale'] === 'en' ? 'selected' : '' ?>>English</option></select></div>
            </div>
            <label class="check"><input type="checkbox" name="demo" value="1" <?= $in['demo'] ? 'checked' : '' ?>> Ajouter des produits de démonstration (modifiables ou supprimables ensuite)</label>
        </section>

        <section class="panel form-stack">
            <h2>3. Compte administrateur</h2>
            <div class="field-row">
                <div class="field"><label for="admin_name">Votre nom</label><input id="admin_name" name="admin_name" value="<?= e($in['admin_name']) ?>" autocomplete="name"></div>
                <div class="field"><label for="admin_email">E-mail</label><input id="admin_email" type="email" name="admin_email" required value="<?= e($in['admin_email']) ?>" autocomplete="username"><?= $err('admin_email') ?></div>
            </div>
            <div class="field"><label for="admin_password">Mot de passe (10 caractères minimum)</label><input id="admin_password" type="password" name="admin_password" required minlength="10" autocomplete="new-password"><?= $err('admin_password') ?></div>
        </section>

        <section class="panel form-stack">
            <h2>4. Base de données</h2>
            <div class="checks">
                <label class="check"><input type="radio" name="driver" value="mysql" <?= $in['driver'] === 'mysql' ? 'checked' : '' ?> <?= extension_loaded('pdo_mysql') ? '' : 'disabled' ?>> MySQL / MariaDB (recommandé en production)</label>
                <label class="check"><input type="radio" name="driver" value="sqlite" <?= $in['driver'] === 'sqlite' ? 'checked' : '' ?> <?= extension_loaded('pdo_sqlite') ? '' : 'disabled' ?>> SQLite (fichier, idéal pour un essai)</label>
            </div>
            <div class="driver-mysql form-stack">
                <div class="field-row">
                    <div class="field"><label for="db_host">Hôte</label><input id="db_host" name="db_host" value="<?= e($in['db_host']) ?>"></div>
                    <div class="field"><label for="db_port">Port</label><input id="db_port" name="db_port" value="<?= e($in['db_port']) ?>"></div>
                </div>
                <div class="field"><label for="db_name">Nom de la base</label><input id="db_name" name="db_name" value="<?= e($in['db_name']) ?>" placeholder="ex. cpaneluser_boutique"><?= $err('db_name') ?></div>
                <div class="field-row">
                    <div class="field"><label for="db_user">Utilisateur</label><input id="db_user" name="db_user" value="<?= e($in['db_user']) ?>" autocomplete="off"></div>
                    <div class="field"><label for="db_pass">Mot de passe</label><input id="db_pass" type="password" name="db_pass" autocomplete="off"></div>
                </div>
            </div>
            <p class="driver-sqlite hint">La base sera créée dans <code>storage/shop.sqlite</code>. Convient à une petite boutique ; préférez MySQL pour un trafic important.</p>
        </section>

        <button class="btn btn-primary" type="submit" <?= $blocking ? 'disabled' : '' ?>>Installer la boutique</button>
    </form>
    <script>
        document.querySelectorAll('input[name="driver"]').forEach((r) => r.addEventListener('change', () => {
            document.getElementById('install-form').dataset.driver = r.value;
        }));
    </script>
<?php endif ?>
</main>
</body>
</html>
