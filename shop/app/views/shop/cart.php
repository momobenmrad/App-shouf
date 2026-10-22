<div class="container page-cart">
    <header class="page-head">
        <h1><?= e(__('cart.title')) ?></h1>
    </header>

    <?php if (!$lines): ?>
        <div class="empty-state">
            <div class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg></div>
            <h2><?= e(__('cart.empty')) ?></h2>
            <p><?= e(__('cart.empty_text')) ?></p>
            <a class="btn btn-primary btn-lg" href="<?= e(url('/boutique')) ?>"><?= e(__('cart.continue')) ?></a>
        </div>
    <?php else: ?>
        <?php if ($totals['free_shipping_remaining'] !== null): ?>
            <?php $threshold = (int) setting('free_shipping_threshold'); $done = $totals['free_shipping_remaining'] === 0; ?>
            <div class="shipping-meter <?= $done ? 'is-done' : '' ?>">
                <p><?= $done ? e(__('cart.free_shipping_unlocked')) : e(__('cart.free_shipping_remaining', ['amount' => format_money($totals['free_shipping_remaining'])])) ?></p>
                <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="<?= (int) round(100 * ($threshold - $totals['free_shipping_remaining']) / max(1, $threshold)) ?>">
                    <span style="width: <?= (int) round(100 * ($threshold - $totals['free_shipping_remaining']) / max(1, $threshold)) ?>%"></span>
                </div>
            </div>
        <?php endif ?>

        <div class="cart-layout">
            <ul class="cart-lines" role="list">
                <?php foreach ($lines as $line): ?>
                    <li class="cart-line">
                        <a href="<?= e($line['url']) ?>" class="cart-thumb"><img src="<?= e(media($line['image'])) ?>" alt="" width="96" height="120" loading="lazy"></a>
                        <div class="cart-line-info">
                            <a href="<?= e($line['url']) ?>" class="cart-line-name"><?= e($line['name']) ?></a>
                            <?php if ($line['variant_name']): ?><p class="muted small"><?= e($line['variant_name']) ?></p><?php endif ?>
                            <p class="small"><?= e(format_money($line['unit_price'])) ?></p>
                            <form action="<?= e(url('/panier/modifier')) ?>" method="post" class="cart-line-actions" data-cart-line>
                                <?= csrf_field() ?>
                                <input type="hidden" name="key" value="<?= e($line['key']) ?>">
                                <div class="qty qty-sm" data-qty>
                                    <button type="button" data-qty-step="-1" aria-label="<?= e(__('cart.decrease')) ?>">−</button>
                                    <label class="sr-only" for="qty-<?= e($line['key']) ?>"><?= e(__('cart.quantity')) ?></label>
                                    <input id="qty-<?= e($line['key']) ?>" type="number" name="qty" value="<?= (int) $line['qty'] ?>" min="1" max="<?= (int) $line['max'] ?>" inputmode="numeric" data-autosubmit>
                                    <button type="button" data-qty-step="1" aria-label="<?= e(__('cart.increase')) ?>">+</button>
                                </div>
                                <noscript><button class="btn btn-ghost btn-sm" type="submit"><?= e(__('cart.update')) ?></button></noscript>
                                <button class="link-btn" type="submit" name="remove" value="1"><?= e(__('cart.remove')) ?></button>
                            </form>
                        </div>
                        <p class="cart-line-total"><?= e(format_money($line['total'])) ?></p>
                    </li>
                <?php endforeach ?>
            </ul>

            <aside class="summary card">
                <h2 class="summary-title"><?= e(__('cart.summary')) ?></h2>
                <?php partial('shop/coupon', ['totals' => $totals, 'from' => 'cart']) ?>
                <?php partial('shop/totals', ['totals' => $totals]) ?>
                <a class="btn btn-primary btn-lg btn-block" href="<?= e(url('/commande')) ?>"><?= e(__('cart.checkout')) ?></a>
                <a class="btn btn-ghost btn-block" href="<?= e(url('/boutique')) ?>"><?= e(__('cart.continue')) ?></a>
                <p class="secure-note"><?php partial('shop/icons', ['icon' => 'lock']) ?> <?= e(__('cart.secure_note')) ?></p>
            </aside>
        </div>
    <?php endif ?>
</div>
