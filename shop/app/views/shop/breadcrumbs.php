<nav class="breadcrumbs" aria-label="<?= e(__('nav.breadcrumbs')) ?>">
    <ol>
        <li><a href="<?= e(url('/')) ?>"><?= e(__('nav.home')) ?></a></li>
        <?php foreach ($items as $label => $href): ?>
            <li><?php if ($href): ?><a href="<?= e($href) ?>"><?= e($label) ?></a><?php else: ?><span aria-current="page"><?= e($label) ?></span><?php endif ?></li>
        <?php endforeach ?>
    </ol>
</nav>
