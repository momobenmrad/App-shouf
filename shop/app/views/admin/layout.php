<?php
$path = current_path();
$pending = (int) val("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
$unread = (int) val('SELECT COUNT(*) FROM messages WHERE is_read = 0');
$nav = [
    ['/admin', 'Tableau de bord', 'M3 12 12 4l9 8M5 10v10h14V10', null],
    ['/admin/commandes', 'Commandes', 'M6 7h12l-1 13H7L6 7ZM9 7a3 3 0 0 1 6 0', $pending],
    ['/admin/produits', 'Produits', 'M4 7l8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10', null],
    ['/admin/categories', 'Catégories', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', null],
    ['/admin/clients', 'Clients', 'M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', null],
    ['/admin/coupons', 'Codes promo', 'M4 8V5h16v3a3 3 0 0 0 0 6v3H4v-3a3 3 0 0 0 0-6ZM10 9v6', null],
    ['/admin/pages', 'Pages', 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7', null],
    ['/admin/messages', 'Messages', 'M4 5h16v11H9l-5 4V5Z', $unread],
    ['/admin/parametres', 'Paramètres', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-2-4-2 .5-1.5-1L15 4h-6l-.5 2.5-1.5 1L5 7l-2 4 2 1v0l-2 1 2 4 2-.5 1.5 1L9 20h6l.5-2.5 1.5-1 2 .5 2-4-2-1Z', null],
];
$isActive = fn($href) => $href === '/admin' ? $path === '/admin' : str_starts_with($path, $href);
?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title><?= e($title ?? 'Administration') ?> — <?= e(setting('shop_name')) ?></title>
    <link rel="icon" href="<?= e(asset('assets/img/favicon.svg')) ?>">
    <link rel="stylesheet" href="<?= e(asset('assets/css/admin.css')) ?>">
    <style>:root { --brand: <?= e(setting('brand_color', '#0f766e')) ?>; --on-brand: <?= e(contrast_text((string) setting('brand_color', '#0f766e'))) ?>; }</style>
</head>
<body>
<div class="admin-shell">
    <aside class="sidebar" id="sidebar">
        <a class="sidebar-brand" href="<?= e(url('/admin')) ?>">
            <span class="brand-mark"><?= e(mb_strtoupper(mb_substr((string) setting('shop_name'), 0, 1))) ?></span>
            <span><?= e(setting('shop_name')) ?></span>
        </a>
        <nav class="sidebar-nav" aria-label="Administration">
            <?php foreach ($nav as [$href, $label, $icon, $count]): ?>
                <a href="<?= e(url($href)) ?>" <?= $isActive($href) ? 'aria-current="page"' : '' ?>>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="<?= $icon ?>"/></svg>
                    <span><?= e($label) ?></span>
                    <?php if ($count): ?><span class="nav-count"><?= (int) $count ?></span><?php endif ?>
                </a>
            <?php endforeach ?>
        </nav>
        <div class="sidebar-foot">
            <a href="<?= e(url('/')) ?>" target="_blank">Voir la boutique ↗</a>
        </div>
    </aside>

    <div class="admin-main">
        <header class="topbar">
            <button class="icon-btn sidebar-toggle" type="button" aria-label="Menu" aria-controls="sidebar" aria-expanded="false" data-sidebar-toggle>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
            <h1 class="topbar-title"><?= e($title ?? '') ?></h1>
            <div class="topbar-user">
                <a href="<?= e(url('/admin/compte')) ?>"><?= e(current_admin()['name'] ?? '') ?></a>
                <form method="post" action="<?= e(url('/admin/deconnexion')) ?>">
                    <?= csrf_field() ?>
                    <button class="btn btn-ghost btn-sm" type="submit">Déconnexion</button>
                </form>
            </div>
        </header>
        <main class="admin-content">
            <?php foreach (take_flashes() as $f): ?>
                <div class="alert alert-<?= e($f['type']) ?>" role="<?= $f['type'] === 'error' ? 'alert' : 'status' ?>"><?= e($f['message']) ?></div>
            <?php endforeach ?>
            <?= $content ?>
        </main>
    </div>
</div>
<script>window.ADMIN = <?= json_encode(['decimals' => currency_decimals()]) ?>;</script>
<script src="<?= e(asset('assets/js/admin.js')) ?>" defer></script>
</body>
</html>
