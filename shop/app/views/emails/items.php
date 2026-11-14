<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
    <?php foreach ($items as $it): ?>
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;"><?= (int) $it['quantity'] ?> × <?= e($it['name']) ?><?= $it['variant_name'] ? ' <span style="color:#71717a">(' . e($it['variant_name']) . ')</span>' : '' ?></td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:end;white-space:nowrap;"><?= e(format_money((int) $it['total'])) ?></td>
        </tr>
    <?php endforeach ?>
    <tr><td style="padding:6px 0;color:#71717a;"><?= e(__('cart.subtotal')) ?></td><td style="text-align:end;"><?= e(format_money((int) $order['subtotal'])) ?></td></tr>
    <?php if ((int) $order['discount'] > 0): ?>
        <tr><td style="padding:6px 0;color:#71717a;"><?= e(__('cart.discount')) ?> (<?= e($order['coupon_code']) ?>)</td><td style="text-align:end;">−<?= e(format_money((int) $order['discount'])) ?></td></tr>
    <?php endif ?>
    <tr><td style="padding:6px 0;color:#71717a;"><?= e(__('cart.shipping')) ?></td><td style="text-align:end;"><?= (int) $order['shipping'] > 0 ? e(format_money((int) $order['shipping'])) : e(__('cart.free')) ?></td></tr>
    <tr><td style="padding:10px 0;font-weight:700;font-size:17px;"><?= e(__('cart.total')) ?></td><td style="text-align:end;font-weight:700;font-size:17px;"><?= e(format_money((int) $order['total'])) ?></td></tr>
</table>
