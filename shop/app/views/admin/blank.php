<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title><?= e($title ?? 'Administration') ?> — <?= e(setting('shop_name')) ?></title>
    <link rel="icon" href="<?= e(asset('assets/img/favicon.svg')) ?>">
    <link rel="stylesheet" href="<?= e(asset('assets/css/admin.css')) ?>">
</head>
<body class="admin-blank">
<?= $content ?>
</body>
</html>
