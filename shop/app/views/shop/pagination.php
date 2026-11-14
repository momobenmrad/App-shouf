<?php if ($pager['pages'] > 1): ?>
    <nav class="pagination" aria-label="<?= e(__('nav.pagination')) ?>">
        <?php if ($pager['page'] > 1): ?>
            <a href="<?= e(page_url($pager['page'] - 1)) ?>" rel="prev" aria-label="<?= e(__('nav.prev')) ?>">‹</a>
        <?php endif ?>
        <?php for ($i = 1; $i <= $pager['pages']; $i++): ?>
            <?php if ($i === 1 || $i === $pager['pages'] || abs($i - $pager['page']) <= 2): ?>
                <a href="<?= e(page_url($i)) ?>" <?= $i === $pager['page'] ? 'aria-current="page"' : '' ?>><?= $i ?></a>
            <?php elseif (abs($i - $pager['page']) === 3): ?>
                <span aria-hidden="true">…</span>
            <?php endif ?>
        <?php endfor ?>
        <?php if ($pager['page'] < $pager['pages']): ?>
            <a href="<?= e(page_url($pager['page'] + 1)) ?>" rel="next" aria-label="<?= e(__('nav.next')) ?>">›</a>
        <?php endif ?>
    </nav>
<?php endif ?>
