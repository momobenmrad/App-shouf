<?php /** @var array $p */ ?>
<article class="product-card">
    <a class="product-media" href="<?= e($p['url']) ?>" tabindex="-1" aria-hidden="true">
        <img src="<?= e(media($p['cover'])) ?>" alt="" loading="lazy" decoding="async" width="600" height="750">
        <?php if ($p['hover']): ?>
            <img class="product-media-hover" src="<?= e(media($p['hover'])) ?>" alt="" loading="lazy" decoding="async" width="600" height="750">
        <?php endif ?>
    </a>
    <div class="product-badges">
        <?php if (!$p['in_stock']): ?>
            <span class="badge badge-muted"><?= e(__('product.sold_out')) ?></span>
        <?php elseif ($p['discount_pct'] > 0): ?>
            <span class="badge badge-sale">−<?= (int) $p['discount_pct'] ?>%</span>
        <?php elseif (strtotime($p['created_at']) > strtotime('-21 days')): ?>
            <span class="badge badge-new"><?= e(__('product.new')) ?></span>
        <?php endif ?>
    </div>
    <div class="product-body">
        <h3 class="product-title"><a href="<?= e($p['url']) ?>"><?= e($p['name']) ?></a></h3>
        <p class="price">
            <?php if ($p['price_varies']): ?><span class="price-from"><?= e(__('product.from')) ?></span><?php endif ?>
            <span class="price-now"><?= e(format_money($p['from_price'])) ?></span>
            <?php if ($p['discount_pct'] > 0): ?><s class="price-old"><?= e(format_money((int) $p['compare_price'])) ?></s><?php endif ?>
        </p>
    </div>
    <?php if ($p['in_stock']): ?>
        <?php if ($p['has_variants']): ?>
            <a class="btn btn-outline btn-sm product-cta" href="<?= e($p['url']) ?>"><?= e(__('product.choose')) ?></a>
        <?php else: ?>
            <form class="product-cta" action="<?= e(url('/panier/ajouter')) ?>" method="post" data-add-to-cart>
                <?= csrf_field() ?>
                <input type="hidden" name="product_id" value="<?= (int) $p['id'] ?>">
                <button class="btn btn-outline btn-sm btn-block" type="submit"><?= e(__('product.add')) ?></button>
            </form>
        <?php endif ?>
    <?php endif ?>
</article>
