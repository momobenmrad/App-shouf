<?php $brand = (string) setting('brand_color', '#0f766e'); ?>
<h1 style="font-size:22px;margin:0 0 8px;"><?= e(__('order.thanks', ['name' => explode(' ', $order['customer_name'])[0]])) ?></h1>
<p style="margin:0 0 16px;"><?= e(__('order.thanks_text', ['number' => $order['number']])) ?></p>
<?php if ($order['payment_method'] === 'cod'): ?>
    <p style="margin:0 0 16px;"><?= e(__('order.cod_text', ['total' => format_money((int) $order['total'])])) ?></p>
<?php else: ?>
    <p style="margin:0 0 16px;"><?= e(__('mail.paid_with', ['method' => payment_method_label($order['payment_method'])])) ?></p>
<?php endif ?>
<?php partial('emails/items', ['order' => $order, 'items' => $items]) ?>
<p style="margin:16px 0 4px;font-weight:700;"><?= e(__('order.delivery_to')) ?></p>
<p style="margin:0 0 20px;color:#3f3f46;"><?= e($order['customer_name']) ?><br><?= e($order['address']) ?><br><?= e(trim($order['postal_code'] . ' ' . $order['city'])) ?><br><?= e($order['phone']) ?></p>
<p style="margin:24px 0;"><a href="<?= e(order_public_url($order)) ?>" style="background:<?= e($brand) ?>;color:<?= e(contrast_text($brand)) ?>;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;"><?= e(__('mail.track_order')) ?></a></p>
