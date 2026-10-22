<?php if ($pager['pages'] > 1): ?>
    <nav class="pagination" aria-label="Pagination">
        <?php for ($i = 1; $i <= $pager['pages']; $i++): ?>
            <?php if ($i === 1 || $i === $pager['pages'] || abs($i - $pager['page']) <= 2): ?>
                <a href="<?= e(page_url($i)) ?>" <?= $i === $pager['page'] ? 'aria-current="page"' : '' ?>><?= $i ?></a>
            <?php elseif (abs($i - $pager['page']) === 3): ?><span>…</span><?php endif ?>
        <?php endfor ?>
    </nav>
<?php endif ?>
