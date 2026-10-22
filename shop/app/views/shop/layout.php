<?php
$shopName = (string) setting('shop_name');
$brand = (string) setting('brand_color', '#0f766e');
$pageTitle = $title ?? $shopName;
$metaDescription = $description ?? (setting('meta_description') ?: shop_text('shop_tagline'));
$canonical = abs_url(current_path());
$ogImage = !empty($og_image) ? abs_media($og_image) : (setting('logo') ? abs_media(setting('logo')) : null);
$cartCount = cart_count();
$categories = active_categories();
$whatsapp = preg_replace('/\D/', '', (string) setting('whatsapp'));
?>
<!doctype html>
<html lang="<?= e(locale()) ?>" dir="<?= e(text_dir()) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title><?= e($pageTitle) ?></title>
    <meta name="description" content="<?= e(str_limit((string) $metaDescription, 160)) ?>">
    <?php if (!empty($robots)): ?><meta name="robots" content="<?= e($robots) ?>"><?php endif ?>
    <link rel="canonical" href="<?= e($canonical) ?>">
    <meta property="og:type" content="<?= isset($product) ? 'product' : 'website' ?>">
    <meta property="og:site_name" content="<?= e($shopName) ?>">
    <meta property="og:title" content="<?= e($pageTitle) ?>">
    <meta property="og:description" content="<?= e(str_limit((string) $metaDescription, 200)) ?>">
    <meta property="og:url" content="<?= e($canonical) ?>">
    <?php if ($ogImage): ?><meta property="og:image" content="<?= e($ogImage) ?>"><?php endif ?>
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="<?= e($brand) ?>">
    <link rel="icon" href="<?= e(setting('favicon') ? media(setting('favicon')) : asset('assets/img/favicon.svg')) ?>">
    <link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
    <style>
        :root {
            --brand: <?= e($brand) ?>;
            --brand-strong: <?= e(shade($brand, -0.18)) ?>;
            --brand-soft: <?= e(shade($brand, 0.9)) ?>;
            --on-brand: <?= e(contrast_text($brand)) ?>;
        }
    </style>
    <?php if ($ga = setting('google_analytics')): ?>
        <script async src="https://www.googletagmanager.com/gtag/js?id=<?= e($ga) ?>"></script>
        <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',<?= json_encode($ga) ?>);</script>
    <?php endif ?>
    <?php if ($px = setting('facebook_pixel')): ?>
        <script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',<?= json_encode($px) ?>);fbq('track','PageView');</script>
    <?php endif ?>
    <?= $head ?? '' ?>
</head>
<body>
<a class="skip-link" href="#main"><?= e(__('a11y.skip')) ?></a>

<?php if ($announcement = shop_text('announcement')): ?>
    <div class="announcement"><div class="container"><?= e($announcement) ?></div></div>
<?php endif ?>

<header class="site-header" data-header>
    <div class="container header-inner">
        <button class="icon-btn menu-toggle" type="button" aria-label="<?= e(__('nav.menu')) ?>" aria-expanded="false" aria-controls="drawer" data-drawer-open>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>

        <a class="logo" href="<?= e(url('/')) ?>" aria-label="<?= e($shopName) ?> — <?= e(__('nav.home')) ?>">
            <?php if (setting('logo')): ?>
                <img src="<?= e(media(setting('logo'))) ?>" alt="<?= e($shopName) ?>" height="40">
            <?php else: ?>
                <span class="logo-mark" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($shopName, 0, 1))) ?></span>
                <span class="logo-text"><?= e($shopName) ?></span>
            <?php endif ?>
        </a>

        <nav class="main-nav" aria-label="<?= e(__('nav.main')) ?>">
            <a href="<?= e(url('/boutique')) ?>" <?= current_path() === '/boutique' ? 'aria-current="page"' : '' ?>><?= e(__('nav.shop')) ?></a>
            <?php foreach (array_slice(array_filter($categories, fn($c) => !$c['parent_id']), 0, 5) as $c): ?>
                <a href="<?= e(url('/categorie/' . $c['slug'])) ?>" <?= current_path() === '/categorie/' . $c['slug'] ? 'aria-current="page"' : '' ?>><?= e($c['name']) ?></a>
            <?php endforeach ?>
            <a href="<?= e(url('/boutique', ['promo' => 1])) ?>" class="nav-promo"><?= e(__('nav.deals')) ?></a>
        </nav>

        <div class="header-actions">
            <form class="search-form" action="<?= e(url('/recherche')) ?>" method="get" role="search">
                <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="/recherche"><?php endif ?>
                <label class="sr-only" for="q"><?= e(__('search.label')) ?></label>
                <input id="q" type="search" name="q" placeholder="<?= e(__('search.placeholder')) ?>" value="<?= e($search ?? '') ?>" autocomplete="off">
                <button type="submit" aria-label="<?= e(__('search.submit')) ?>">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                </button>
            </form>

            <?php if (count(enabled_locales()) > 1): ?>
                <details class="lang-switch">
                    <summary aria-label="<?= e(__('nav.language')) ?>"><?= e(SUPPORTED_LOCALES[locale()]['short']) ?></summary>
                    <div class="lang-menu">
                        <?php foreach (enabled_locales() as $l): ?>
                            <a href="<?= e(lang_url($l)) ?>" lang="<?= e($l) ?>" <?= $l === locale() ? 'aria-current="true"' : '' ?>><?= e(SUPPORTED_LOCALES[$l]['name']) ?></a>
                        <?php endforeach ?>
                    </div>
                </details>
            <?php endif ?>

            <button class="icon-btn search-toggle" type="button" aria-label="<?= e(__('search.label')) ?>" data-drawer-open data-focus-search>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </button>

            <a class="icon-btn cart-btn" href="<?= e(url('/panier')) ?>" aria-label="<?= e(__('nav.cart')) ?>">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
                <span class="cart-count" data-cart-count <?= $cartCount ? '' : 'hidden' ?>><?= $cartCount ?></span>
            </a>
        </div>
    </div>
</header>

<div class="drawer" id="drawer" hidden data-drawer>
    <div class="drawer-backdrop" data-drawer-close></div>
    <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="<?= e(__('nav.menu')) ?>">
        <div class="drawer-head">
            <strong><?= e($shopName) ?></strong>
            <button class="icon-btn" type="button" aria-label="<?= e(__('nav.close')) ?>" data-drawer-close>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
        </div>
        <form class="search-form drawer-search" action="<?= e(url('/recherche')) ?>" method="get" role="search">
            <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="/recherche"><?php endif ?>
            <label class="sr-only" for="q-drawer"><?= e(__('search.label')) ?></label>
            <input id="q-drawer" type="search" name="q" placeholder="<?= e(__('search.placeholder')) ?>" autocomplete="off">
            <button type="submit" aria-label="<?= e(__('search.submit')) ?>">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </button>
        </form>
        <nav class="drawer-nav" aria-label="<?= e(__('nav.main')) ?>">
            <a href="<?= e(url('/')) ?>"><?= e(__('nav.home')) ?></a>
            <a href="<?= e(url('/boutique')) ?>"><?= e(__('nav.shop')) ?></a>
            <?php foreach ($categories as $c): ?>
                <a href="<?= e(url('/categorie/' . $c['slug'])) ?>" class="<?= $c['parent_id'] ? 'sub' : '' ?>"><?= e($c['name']) ?></a>
            <?php endforeach ?>
            <a href="<?= e(url('/boutique', ['promo' => 1])) ?>"><?= e(__('nav.deals')) ?></a>
            <hr>
            <a href="<?= e(url('/suivi')) ?>"><?= e(__('nav.track')) ?></a>
            <a href="<?= e(url('/contact')) ?>"><?= e(__('nav.contact')) ?></a>
        </nav>
        <?php if (count(enabled_locales()) > 1): ?>
            <div class="drawer-langs">
                <?php foreach (enabled_locales() as $l): ?>
                    <a href="<?= e(lang_url($l)) ?>" lang="<?= e($l) ?>" class="chip <?= $l === locale() ? 'is-active' : '' ?>"><?= e(SUPPORTED_LOCALES[$l]['name']) ?></a>
                <?php endforeach ?>
            </div>
        <?php endif ?>
    </div>
</div>

<main id="main" tabindex="-1">
    <?php $flashes = take_flashes(); if ($flashes): ?>
        <div class="container flashes">
            <?php foreach ($flashes as $f): ?>
                <div class="alert alert-<?= e($f['type']) ?>" role="<?= $f['type'] === 'error' ? 'alert' : 'status' ?>"><?= e($f['message']) ?></div>
            <?php endforeach ?>
        </div>
    <?php endif ?>
    <?= $content ?>
</main>

<footer class="site-footer">
    <div class="container footer-grid">
        <div class="footer-about">
            <a class="logo logo-footer" href="<?= e(url('/')) ?>">
                <?php if (setting('logo')): ?>
                    <img src="<?= e(media(setting('logo'))) ?>" alt="<?= e($shopName) ?>" height="36">
                <?php else: ?>
                    <span class="logo-mark" aria-hidden="true"><?= e(mb_strtoupper(mb_substr($shopName, 0, 1))) ?></span>
                    <span class="logo-text"><?= e($shopName) ?></span>
                <?php endif ?>
            </a>
            <p><?= e(setting('footer_text') ?: shop_text('shop_tagline')) ?></p>
            <ul class="contact-list">
                <?php if (setting('shop_phone')): ?><li><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', (string) setting('shop_phone'))) ?>" dir="ltr"><?= e(setting('shop_phone')) ?></a></li><?php endif ?>
                <?php if (setting('shop_email')): ?><li><a href="mailto:<?= e(setting('shop_email')) ?>"><?= e(setting('shop_email')) ?></a></li><?php endif ?>
                <?php if (setting('shop_address')): ?><li><?= e(setting('shop_address')) ?></li><?php endif ?>
            </ul>
            <div class="socials">
                <?php foreach (['facebook' => 'Facebook', 'instagram' => 'Instagram', 'tiktok' => 'TikTok'] as $key => $label): ?>
                    <?php if ($link = setting($key)): ?>
                        <a href="<?= e($link) ?>" target="_blank" rel="noopener" aria-label="<?= e($label) ?>"><?php partial('shop/icons', ['icon' => $key]) ?></a>
                    <?php endif ?>
                <?php endforeach ?>
            </div>
        </div>

        <div>
            <h2 class="footer-title"><?= e(__('footer.shop')) ?></h2>
            <ul>
                <li><a href="<?= e(url('/boutique')) ?>"><?= e(__('footer.all_products')) ?></a></li>
                <?php foreach (array_slice(array_filter($categories, fn($c) => !$c['parent_id']), 0, 6) as $c): ?>
                    <li><a href="<?= e(url('/categorie/' . $c['slug'])) ?>"><?= e($c['name']) ?></a></li>
                <?php endforeach ?>
            </ul>
        </div>

        <div>
            <h2 class="footer-title"><?= e(__('footer.help')) ?></h2>
            <ul>
                <li><a href="<?= e(url('/suivi')) ?>"><?= e(__('nav.track')) ?></a></li>
                <li><a href="<?= e(url('/contact')) ?>"><?= e(__('nav.contact')) ?></a></li>
                <?php foreach (footer_pages() as $p): ?>
                    <li><a href="<?= e(url('/page/' . $p['slug'])) ?>"><?= e($p['title']) ?></a></li>
                <?php endforeach ?>
            </ul>
        </div>

        <div>
            <h2 class="footer-title"><?= e(__('newsletter.title')) ?></h2>
            <p><?= e(__('newsletter.text')) ?></p>
            <form class="newsletter-form" action="<?= e(url('/newsletter')) ?>" method="post" data-newsletter>
                <?= csrf_field() ?>
                <label class="sr-only" for="nl-email"><?= e(__('form.email')) ?></label>
                <input id="nl-email" type="email" name="email" required placeholder="<?= e(__('newsletter.placeholder')) ?>" autocomplete="email">
                <button class="btn btn-primary" type="submit"><?= e(__('newsletter.submit')) ?></button>
            </form>
            <p class="newsletter-msg" data-newsletter-msg role="status"></p>
        </div>
    </div>
    <div class="footer-bottom">
        <div class="container footer-bottom-inner">
            <p>© <?= date('Y') ?> <?= e(setting('legal_name') ?: $shopName) ?>. <?= e(__('footer.rights')) ?></p>
            <ul class="pay-badges" aria-label="<?= e(__('footer.payments')) ?>">
                <?php foreach (payment_methods() as $m): ?>
                    <li><?= e(payment_method_label($m)) ?></li>
                <?php endforeach ?>
            </ul>
        </div>
    </div>
</footer>

<?php if ($whatsapp): ?>
    <a class="whatsapp-fab" href="https://wa.me/<?= e($whatsapp) ?>?text=<?= rawurlencode(__('whatsapp.message', ['shop' => $shopName])) ?>" target="_blank" rel="noopener" aria-label="<?= e(__('whatsapp.label')) ?>">
        <?php partial('shop/icons', ['icon' => 'whatsapp']) ?>
    </a>
<?php endif ?>

<div class="toast-region" aria-live="polite" data-toasts></div>

<script>
    window.SHOP = <?= json_encode([
        'csrf' => csrf_token(),
        'cartUrl' => url('/panier'),
        'checkoutUrl' => url('/commande'),
        'money' => ['decimals' => currency_decimals(), 'symbol' => setting('currency_symbol'), 'position' => setting('currency_position')],
        'i18n' => [
            'added' => __('cart.added'),
            'viewCart' => __('cart.view'),
            'checkout' => __('cart.checkout'),
            'error' => __('errors.generic'),
            'chooseOption' => __('product.choose_option'),
            'onlyLeft' => __('product.only_left'),
            'inStock' => __('product.in_stock'),
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?>;
</script>
<script src="<?= e(asset('assets/js/app.js')) ?>" defer></script>
</body>
</html>
