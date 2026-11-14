<dl class="totals">
    <div><dt><?= e(__('cart.subtotal')) ?></dt><dd><?= e(format_money($totals['subtotal'])) ?></dd></div>
    <?php if ($totals['discount'] > 0): ?>
        <div class="totals-discount"><dt><?= e(__('cart.discount')) ?> <span class="chip chip-sm"><?= e($totals['coupon']['code']) ?></span></dt><dd>−<?= e(format_money($totals['discount'])) ?></dd></div>
    <?php endif ?>
    <div><dt><?= e(__('cart.shipping')) ?></dt><dd data-shipping><?= $totals['shipping'] > 0 ? e(format_money($totals['shipping'])) : '<span class="text-success">' . e(__('cart.free')) . '</span>' ?></dd></div>
    <?php if (($totals['fee'] ?? 0) > 0 || !empty($feeRow)): ?>
        <div data-fee-row <?= ($totals['fee'] ?? 0) > 0 ? '' : 'hidden' ?>><dt><?= e(__('cart.cod_fee')) ?></dt><dd data-fee><?= e(format_money($totals['fee'] ?? 0)) ?></dd></div>
    <?php endif ?>
    <div class="totals-grand"><dt><?= e(__('cart.total')) ?></dt><dd data-total data-base="<?= (int) ($totals['total'] - ($totals['fee'] ?? 0)) ?>"><?= e(format_money($totals['total'])) ?></dd></div>
</dl>
