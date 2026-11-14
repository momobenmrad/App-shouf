<?php
$crumbs = [__('nav.shop') => url('/boutique')];
if ($category) {
    $crumbs[$category['name']] = url('/categorie/' . $category['slug']);
}
$crumbs[$product['name']] = null;
$variantData = array_map(fn($v) => [
    'id' => (int) $v['id'],
    'price' => format_money(unit_price($product, $v)),
    'stock' => $v['stock'] === null ? null : (int) $v['stock'],
], $variants);
$productStock = $product['stock'] === null ? null : (int) $product['stock'];
$lowThreshold = (int) setting('low_stock_threshold', 3);
$jsonLd = [
    '@context' => 'https://schema.org',
    '@type' => 'Product',
    'name' => $product['name'],
    'image' => array_map(fn($i) => abs_media($i['path']), $images),
    'description' => str_limit((string) ($product['short_description'] ?: $product['description']), 500),
    'sku' => $product['sku'] ?: (string) $product['id'],
    'brand' => ['@type' => 'Brand', 'name' => setting('shop_name')],
    'offers' => [
        '@type' => 'Offer',
        'url' => abs_url('/produit/' . $product['slug']),
        'priceCurrency' => setting('currency_code'),
        'price' => money_input($product['from_price']),
        'availability' => $product['in_stock'] ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    ],
];
?>
<div class="container">
    <?php partial('shop/breadcrumbs', ['items' => $crumbs]) ?>

    <div class="product-layout">
        <div class="gallery" data-gallery>
            <div class="gallery-main">
                <img src="<?= e(media($images[0]['path'] ?? null)) ?>" alt="<?= e($images[0]['alt'] ?? $product['name']) ?>" width="900" height="1125" data-gallery-main fetchpriority="high">
                <?php if ($product['discount_pct'] > 0): ?><span class="badge badge-sale gallery-badge">−<?= (int) $product['discount_pct'] ?>%</span><?php endif ?>
            </div>
            <?php if (count($images) > 1): ?>
                <ul class="gallery-thumbs" role="list">
                    <?php foreach ($images as $i => $img): ?>
                        <li><button type="button" data-gallery-thumb="<?= e(media($img['path'])) ?>" aria-label="<?= e(__('product.view_image', ['n' => $i + 1])) ?>" <?= $i === 0 ? 'aria-current="true"' : '' ?>>
                            <img src="<?= e(media($img['path'])) ?>" alt="" loading="lazy" width="120" height="150">
                        </button></li>
                    <?php endforeach ?>
                </ul>
            <?php endif ?>
        </div>

        <div class="product-info">
            <?php if ($category): ?><a class="eyebrow" href="<?= e(url('/categorie/' . $category['slug'])) ?>"><?= e($category['name']) ?></a><?php endif ?>
            <h1 class="product-name"><?= e($product['name']) ?></h1>

            <p class="price price-lg">
                <span class="price-now" data-price><?= e(format_money($variants ? $product['from_price'] : (int) $product['price'])) ?></span>
                <?php if ($product['discount_pct'] > 0): ?>
                    <s class="price-old"><?= e(format_money((int) $product['compare_price'])) ?></s>
                    <span class="badge badge-sale"><?= e(__('product.save', ['amount' => format_money((int) $product['compare_price'] - (int) $product['price'])])) ?></span>
                <?php endif ?>
            </p>

            <?php if ($product['short_description']): ?>
                <p class="product-lead"><?= e($product['short_description']) ?></p>
            <?php endif ?>

            <form class="buy-box" action="<?= e(url('/panier/ajouter')) ?>" method="post" data-add-to-cart data-variants='<?= e(json_encode($variantData)) ?>' data-low="<?= $lowThreshold ?>">
                <?= csrf_field() ?>
                <input type="hidden" name="product_id" value="<?= (int) $product['id'] ?>">

                <?php if ($variants): ?>
                    <fieldset class="variant-picker">
                        <legend><?= e($product['option_label'] ?: __('product.option')) ?> <span class="variant-selected" data-variant-label></span></legend>
                        <div class="chips">
                            <?php foreach ($variants as $v): $out = $v['stock'] !== null && (int) $v['stock'] <= 0; ?>
                                <label class="chip-option <?= $out ? 'is-out' : '' ?>">
                                    <input type="radio" name="variant_id" value="<?= (int) $v['id'] ?>" <?= $out ? 'disabled' : '' ?> <?= count($variants) === 1 && !$out ? 'checked' : '' ?> data-name="<?= e($v['name']) ?>">
                                    <span><?= e($v['name']) ?></span>
                                </label>
                            <?php endforeach ?>
                        </div>
                        <p class="field-error" data-variant-error hidden><?= e(__('product.choose_option')) ?></p>
                    </fieldset>
                <?php endif ?>

                <p class="stock-status" data-stock-status>
                    <?php if (!$product['in_stock']): ?>
                        <span class="dot dot-out"></span><?= e(__('product.sold_out')) ?>
                    <?php elseif (!$variants && $productStock !== null && $productStock <= $lowThreshold): ?>
                        <span class="dot dot-low"></span><?= e(__('product.only_left', ['qty' => $productStock])) ?>
                    <?php else: ?>
                        <span class="dot dot-in"></span><?= e(__('product.in_stock')) ?>
                    <?php endif ?>
                </p>

                <?php if ($product['in_stock']): ?>
                    <div class="buy-row">
                        <div class="qty" data-qty>
                            <button type="button" data-qty-step="-1" aria-label="<?= e(__('cart.decrease')) ?>">−</button>
                            <label class="sr-only" for="qty"><?= e(__('cart.quantity')) ?></label>
                            <input id="qty" type="number" name="qty" value="1" min="1" max="<?= $productStock !== null && !$variants ? max(1, min(CART_MAX_QTY, $productStock)) : CART_MAX_QTY ?>" inputmode="numeric">
                            <button type="button" data-qty-step="1" aria-label="<?= e(__('cart.increase')) ?>">+</button>
                        </div>
                        <button class="btn btn-primary btn-lg btn-grow" type="submit"><?= e(__('product.add')) ?></button>
                    </div>
                    <button class="btn btn-dark btn-lg btn-block" type="submit" name="buy_now" value="1" data-buy-now><?= e(__('product.buy_now')) ?></button>
                <?php endif ?>
            </form>

            <ul class="product-perks">
                <li><?php partial('shop/icons', ['icon' => 'truck']) ?><?= e(__('product.perk_delivery', ['delay' => setting('delivery_delay')])) ?></li>
                <?php if ((int) setting('free_shipping_threshold') > 0): ?>
                    <li><?php partial('shop/icons', ['icon' => 'check']) ?><?= e(__('product.perk_free', ['amount' => format_money((int) setting('free_shipping_threshold'))])) ?></li>
                <?php endif ?>
                <?php if (in_array('cod', payment_methods(), true)): ?>
                    <li><?php partial('shop/icons', ['icon' => 'cash']) ?><?= e(__('product.perk_cod')) ?></li>
                <?php endif ?>
                <li><?php partial('shop/icons', ['icon' => 'return']) ?><?= e(__('trust.returns_text')) ?></li>
            </ul>

            <?php if ($product['description']): ?>
                <details class="accordion" open>
                    <summary><?= e(__('product.description')) ?></summary>
                    <div class="prose"><?= rich_text((string) $product['description']) ?></div>
                </details>
            <?php endif ?>
            <details class="accordion">
                <summary><?= e(__('product.shipping_returns')) ?></summary>
                <div class="prose">
                    <p><?= e(__('product.shipping_text', ['delay' => setting('delivery_delay'), 'fee' => format_money((int) setting('shipping_fee'))])) ?></p>
                    <p><?= e(__('product.returns_text')) ?></p>
                </div>
            </details>
            <?php if ($product['sku']): ?><p class="muted small"><?= e(__('product.sku')) ?> : <?= e($product['sku']) ?></p><?php endif ?>
        </div>
    </div>

    <?php if ($related): ?>
        <section class="section" aria-labelledby="related-title">
            <div class="section-head"><h2 id="related-title"><?= e(__('product.related')) ?></h2></div>
            <div class="product-grid">
                <?php foreach ($related as $p) partial('shop/product_card', ['p' => $p]) ?>
            </div>
        </section>
    <?php endif ?>
</div>

<?php if ($product['in_stock']): ?>
    <div class="sticky-buy" data-sticky-buy hidden>
        <div class="container sticky-buy-inner">
            <div class="sticky-buy-info">
                <strong><?= e($product['name']) ?></strong>
                <span data-price><?= e(format_money($variants ? $product['from_price'] : (int) $product['price'])) ?></span>
            </div>
            <button class="btn btn-primary" type="button" data-sticky-submit><?= e(__('product.add')) ?></button>
        </div>
    </div>
<?php endif ?>

<script type="application/ld+json"><?= json_encode($jsonLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
