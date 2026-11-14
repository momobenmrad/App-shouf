<?php
$crumbs = [];
if ($category) {
    $crumbs[__('nav.shop')] = url('/boutique');
}
$crumbs[$heading] = null;
$q = $_GET;
unset($q['r'], $q['page']);
$categories = active_categories();
?>
<div class="container page-catalog">
    <?php partial('shop/breadcrumbs', ['items' => $crumbs]) ?>

    <header class="page-head">
        <h1><?= e($heading) ?></h1>
        <?php if ($category && $category['description']): ?><p class="lead"><?= e($category['description']) ?></p><?php endif ?>
    </header>

    <div class="catalog-layout">
        <aside class="filters" aria-label="<?= e(__('catalog.filters')) ?>">
            <details class="filters-box" open>
                <summary><?= e(__('catalog.categories')) ?></summary>
                <ul class="filter-links">
                    <li><a href="<?= e(url('/boutique')) ?>" <?= !$category && empty($search) ? 'aria-current="page"' : '' ?>><?= e(__('catalog.all')) ?></a></li>
                    <?php foreach ($categories as $c): ?>
                        <li class="<?= $c['parent_id'] ? 'sub' : '' ?>"><a href="<?= e(url('/categorie/' . $c['slug'])) ?>" <?= $category && (int) $category['id'] === (int) $c['id'] ? 'aria-current="page"' : '' ?>><?= e($c['name']) ?> <span class="count"><?= (int) $c['product_count'] ?></span></a></li>
                    <?php endforeach ?>
                </ul>
            </details>
            <form class="filters-box" method="get" action="<?= e(url(current_path())) ?>">
                <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="<?= e(current_path()) ?>"><?php endif ?>
                <?php if (!empty($search)): ?><input type="hidden" name="q" value="<?= e($search) ?>"><?php endif ?>
                <input type="hidden" name="sort" value="<?= e($sort) ?>">
                <fieldset>
                    <legend><?= e(__('catalog.price')) ?></legend>
                    <div class="price-range">
                        <label><span class="sr-only"><?= e(__('catalog.min')) ?></span><input type="number" inputmode="decimal" min="0" step="any" name="min" placeholder="<?= e(__('catalog.min')) ?>" value="<?= e($_GET['min'] ?? '') ?>"></label>
                        <span aria-hidden="true">–</span>
                        <label><span class="sr-only"><?= e(__('catalog.max')) ?></span><input type="number" inputmode="decimal" min="0" step="any" name="max" placeholder="<?= e(__('catalog.max')) ?>" value="<?= e($_GET['max'] ?? '') ?>"></label>
                    </div>
                </fieldset>
                <label class="check"><input type="checkbox" name="promo" value="1" <?= !empty($_GET['promo']) ? 'checked' : '' ?>> <?= e(__('catalog.on_sale')) ?></label>
                <button class="btn btn-outline btn-sm btn-block" type="submit"><?= e(__('catalog.apply')) ?></button>
            </form>
        </aside>

        <section class="catalog-results" aria-labelledby="results-count">
            <div class="toolbar">
                <p id="results-count" class="muted"><?= e(__('catalog.results', ['n' => $pager['total']])) ?></p>
                <form method="get" action="<?= e(url(current_path())) ?>" class="sort-form">
                    <?php foreach ($q as $k => $v): if ($k === 'sort' || is_array($v)) continue; ?>
                        <input type="hidden" name="<?= e($k) ?>" value="<?= e($v) ?>">
                    <?php endforeach ?>
                    <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="<?= e(current_path()) ?>"><?php endif ?>
                    <label for="sort"><?= e(__('catalog.sort')) ?></label>
                    <select id="sort" name="sort" data-autosubmit>
                        <?php foreach (['new', 'popular', 'price_asc', 'price_desc'] as $s): ?>
                            <option value="<?= $s ?>" <?= $sort === $s ? 'selected' : '' ?>><?= e(__('catalog.sort_' . $s)) ?></option>
                        <?php endforeach ?>
                    </select>
                </form>
            </div>

            <?php if ($products): ?>
                <div class="product-grid product-grid-3">
                    <?php foreach ($products as $p) partial('shop/product_card', ['p' => $p]) ?>
                </div>
                <?php partial('shop/pagination', ['pager' => $pager]) ?>
            <?php else: ?>
                <div class="empty-state">
                    <h2><?= e(__('catalog.no_results')) ?></h2>
                    <p><?= e(__('catalog.no_results_text')) ?></p>
                    <a class="btn btn-primary" href="<?= e(url('/boutique')) ?>"><?= e(__('catalog.all')) ?></a>
                </div>
            <?php endif ?>
        </section>
    </div>
</div>
