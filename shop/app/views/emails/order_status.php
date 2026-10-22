<?php $brand = (string) setting('brand_color', '#0f766e'); ?>
<h1 style="font-size:22px;margin:0 0 8px;"><?= e(__('mail.status_title', ['number' => $order['number']])) ?></h1>
<p style="margin:0 0 16px;"><?= e(__('mail.status_' . $order['status'])) ?></p>
<?php if ($tracking): ?>
    <p style="margin:0 0 16px;"><?= e(__('mail.tracking')) ?> : <strong><?= e($tracking) ?></strong></p>
<?php endif ?>
<p style="margin:24px 0;"><a href="<?= e(order_public_url($order)) ?>" style="background:<?= e($brand) ?>;color:<?= e(contrast_text($brand)) ?>;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;"><?= e(__('mail.track_order')) ?></a></p>
