<?php $brand = (string) setting('brand_color', '#0f766e'); ?>
<!doctype html>
<html lang="<?= e(locale()) ?>" dir="<?= e(text_dir()) ?>">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#18181b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px;">
    <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr><td style="background:<?= e($brand) ?>;padding:20px 28px;color:<?= e(contrast_text($brand)) ?>;font-size:20px;font-weight:700;">
                <?php if (setting('logo')): ?>
                    <img src="<?= e(abs_media(setting('logo'))) ?>" alt="<?= e(setting('shop_name')) ?>" height="36" style="display:block;max-height:36px;">
                <?php else: ?>
                    <?= e(setting('shop_name')) ?>
                <?php endif ?>
            </td></tr>
            <tr><td style="padding:28px;font-size:15px;line-height:1.6;"><?= $body ?></td></tr>
            <tr><td style="padding:20px 28px;background:#fafaf9;color:#71717a;font-size:12px;line-height:1.5;">
                <?= e(setting('shop_name')) ?><?= setting('shop_address') ? ' · ' . e(setting('shop_address')) : '' ?><br>
                <?= setting('shop_phone') ? e(setting('shop_phone')) . ' · ' : '' ?><a href="<?= e(abs_url('/')) ?>" style="color:#71717a;"><?= e(preg_replace('#^https?://#', '', site_root())) ?></a>
            </td></tr>
        </table>
    </td></tr>
</table>
</body>
</html>
