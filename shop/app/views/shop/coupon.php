<?php if ($totals['coupon']): ?>
    <form class="coupon-applied" action="<?= e(url('/panier/coupon')) ?>" method="post">
        <?= csrf_field() ?>
        <input type="hidden" name="from" value="<?= e($from) ?>">
        <span><?= e(__('coupon.active', ['code' => $totals['coupon']['code']])) ?></span>
        <button class="link-btn" type="submit" name="remove" value="1"><?= e(__('cart.remove')) ?></button>
    </form>
<?php else: ?>
    <details class="coupon-box">
        <summary><?= e(__('coupon.have_code')) ?></summary>
        <form class="inline-form" action="<?= e(url('/panier/coupon')) ?>" method="post">
            <?= csrf_field() ?>
            <input type="hidden" name="from" value="<?= e($from) ?>">
            <label class="sr-only" for="coupon-<?= e($from) ?>"><?= e(__('coupon.label')) ?></label>
            <input id="coupon-<?= e($from) ?>" name="code" placeholder="<?= e(__('coupon.placeholder')) ?>" autocomplete="off" autocapitalize="characters" required>
            <button class="btn btn-outline" type="submit"><?= e(__('coupon.apply')) ?></button>
        </form>
    </details>
<?php endif ?>
