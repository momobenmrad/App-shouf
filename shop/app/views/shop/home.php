<section class="hero <?= setting('hero_image') ? 'has-image' : '' ?>">
    <?php if (setting('hero_image')): ?>
        <img class="hero-bg" src="<?= e(media(setting('hero_image'))) ?>" alt="" fetchpriority="high">
    <?php endif ?>
    <div class="container hero-inner">
        <div class="hero-copy">
            <p class="eyebrow"><?= e(setting('shop_name')) ?></p>
            <h1><?= e(shop_text('hero_title')) ?></h1>
            <p class="hero-sub"><?= e(shop_text('hero_subtitle')) ?></p>
            <div class="hero-actions">
                <a class="btn btn-primary btn-lg" href="<?= e(url('/boutique')) ?>"><?= e(shop_text('hero_cta') ?: __('home.cta')) ?></a>
                <a class="btn btn-ghost btn-lg" href="<?= e(url('/boutique', ['promo' => 1])) ?>"><?= e(__('home.see_deals')) ?></a>
            </div>
        </div>
        <?php if (!setting('hero_image') && $featured): ?>
            <div class="hero-visual" aria-hidden="true">
                <?php foreach (array_slice($featured, 0, 3) as $i => $p): ?>
                    <img class="hero-tile hero-tile-<?= $i + 1 ?>" src="<?= e(media($p['cover'])) ?>" alt="">
                <?php endforeach ?>
            </div>
        <?php endif ?>
    </div>
</section>

<div class="container">
    <?php partial('shop/trust') ?>
</div>

<?php if ($categories): ?>
    <section class="section container" aria-labelledby="cats-title">
        <div class="section-head">
            <h2 id="cats-title"><?= e(__('home.categories')) ?></h2>
            <a class="link-arrow" href="<?= e(url('/boutique')) ?>"><?= e(__('home.see_all')) ?></a>
        </div>
        <div class="category-grid">
            <?php foreach ($categories as $c): ?>
                <a class="category-card" href="<?= e(url('/categorie/' . $c['slug'])) ?>">
                    <img src="<?= e(media($c['cover'])) ?>" alt="" loading="lazy">
                    <span class="category-card-body">
                        <strong><?= e($c['name']) ?></strong>
                        <span><?= e(__('home.products_count', ['n' => $c['product_count']])) ?></span>
                    </span>
                </a>
            <?php endforeach ?>
        </div>
    </section>
<?php endif ?>

<?php if ($featured): ?>
    <section class="section container" aria-labelledby="featured-title">
        <div class="section-head">
            <h2 id="featured-title"><?= e(__('home.featured')) ?></h2>
            <a class="link-arrow" href="<?= e(url('/boutique')) ?>"><?= e(__('home.see_all')) ?></a>
        </div>
        <div class="product-grid">
            <?php foreach ($featured as $p) partial('shop/product_card', ['p' => $p]) ?>
        </div>
    </section>
<?php endif ?>

<?php if ($bestsellers): ?>
    <section class="section container" aria-labelledby="best-title">
        <div class="section-head">
            <h2 id="best-title"><?= e(__('home.bestsellers')) ?></h2>
            <a class="link-arrow" href="<?= e(url('/boutique', ['sort' => 'popular'])) ?>"><?= e(__('home.see_all')) ?></a>
        </div>
        <div class="product-grid">
            <?php foreach ($bestsellers as $p) partial('shop/product_card', ['p' => $p]) ?>
        </div>
    </section>
<?php endif ?>

<?php if ($latest): ?>
    <section class="section container" aria-labelledby="new-title">
        <div class="section-head">
            <h2 id="new-title"><?= e(__('home.new')) ?></h2>
            <a class="link-arrow" href="<?= e(url('/boutique', ['sort' => 'new'])) ?>"><?= e(__('home.see_all')) ?></a>
        </div>
        <div class="product-grid">
            <?php foreach (array_slice($latest, 0, 8) as $p) partial('shop/product_card', ['p' => $p]) ?>
        </div>
    </section>
<?php else: ?>
    <section class="section container">
        <div class="empty-state">
            <h2><?= e(__('home.empty_title')) ?></h2>
            <p><?= e(__('home.empty_text')) ?></p>
        </div>
    </section>
<?php endif ?>

<?php if ((int) setting('free_shipping_threshold') > 0): ?>
    <section class="section container">
        <div class="promo-banner">
            <div>
                <h2><?= e(__('home.banner_title', ['amount' => format_money((int) setting('free_shipping_threshold'))])) ?></h2>
                <p><?= e(__('home.banner_text')) ?></p>
            </div>
            <a class="btn btn-light btn-lg" href="<?= e(url('/boutique')) ?>"><?= e(__('home.cta')) ?></a>
        </div>
    </section>
<?php endif ?>
