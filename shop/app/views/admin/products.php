<div class="page-actions">
    <form class="filter-bar" method="get" action="<?= e(url('/admin/produits')) ?>">
        <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="/admin/produits"><?php endif ?>
        <input type="search" name="q" placeholder="Nom ou référence…" value="<?= e($_GET['q'] ?? '') ?>" aria-label="Rechercher">
        <select name="cat" aria-label="Catégorie">
            <option value="">Toutes catégories</option>
            <?php foreach ($categories as $c): ?><option value="<?= (int) $c['id'] ?>" <?= (int) ($_GET['cat'] ?? 0) === (int) $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach ?>
        </select>
        <select name="state" aria-label="État">
            <option value="">Tous</option>
            <option value="inactive" <?= ($_GET['state'] ?? '') === 'inactive' ? 'selected' : '' ?>>Masqués</option>
            <option value="out" <?= ($_GET['state'] ?? '') === 'out' ? 'selected' : '' ?>>En rupture</option>
        </select>
        <button class="btn btn-outline" type="submit">Filtrer</button>
    </form>
    <div class="spacer"></div>
    <a class="btn btn-primary" href="<?= e(url('/admin/produits/nouveau')) ?>">+ Nouveau produit</a>
</div>

<form class="panel" method="post" action="<?= e(url('/admin/produits')) ?>" data-bulk>
    <?= csrf_field() ?>
    <?php if ($products): ?>
        <div class="bulk-bar">
            <label class="check"><input type="checkbox" data-check-all> Tout sélectionner</label>
            <select name="bulk" aria-label="Action groupée">
                <option value="">Action groupée…</option>
                <option value="activate">Publier</option>
                <option value="deactivate">Masquer</option>
                <option value="feature">Mettre en avant</option>
                <option value="unfeature">Retirer de la mise en avant</option>
            </select>
            <button class="btn btn-outline btn-sm" type="submit">Appliquer</button>
        </div>
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th class="w-check"></th><th>Produit</th><th>Catégorie</th><th class="num">Prix</th><th class="num">Stock</th><th class="num">Ventes</th><th>État</th></tr></thead>
                <tbody>
                <?php foreach ($products as $p):
                    $stock = $p['variant_count'] ? ($p['variant_stock'] === null ? null : (int) $p['variant_stock']) : ($p['stock'] === null ? null : (int) $p['stock']); ?>
                    <tr>
                        <td><input type="checkbox" name="ids[]" value="<?= (int) $p['id'] ?>" aria-label="Sélectionner <?= e($p['name']) ?>"></td>
                        <td class="product-cell">
                            <img src="<?= e(media($p['cover'])) ?>" alt="" width="44" height="55" loading="lazy">
                            <div><a href="<?= e(url('/admin/produits/' . $p['id'])) ?>"><strong><?= e($p['name']) ?></strong></a>
                                <br><span class="muted small"><?= e($p['sku'] ?: '—') ?><?= $p['variant_count'] ? ' · ' . (int) $p['variant_count'] . ' options' : '' ?></span></div>
                        </td>
                        <td><?= e($p['category_name'] ?? '—') ?></td>
                        <td class="num nowrap"><?= e(format_money((int) $p['price'])) ?><?php if ($p['compare_price']): ?><br><s class="muted small"><?= e(format_money((int) $p['compare_price'])) ?></s><?php endif ?></td>
                        <td class="num"><?php if ($stock === null): ?><span class="muted">∞</span><?php else: ?><span class="badge badge-<?= $stock <= 0 ? 'danger' : ($stock <= (int) setting('low_stock_threshold', 3) ? 'warn' : 'muted') ?>"><?= $stock ?></span><?php endif ?></td>
                        <td class="num"><?= (int) $p['sales_count'] ?></td>
                        <td><?= (int) $p['is_active'] ? '<span class="badge badge-success">Publié</span>' : '<span class="badge badge-muted">Masqué</span>' ?><?= (int) $p['is_featured'] ? ' <span class="badge badge-brand">★</span>' : '' ?></td>
                    </tr>
                <?php endforeach ?>
                </tbody>
            </table>
        </div>
        <?php partial('admin/pagination', ['pager' => $pager]) ?>
    <?php else: ?>
        <div class="empty">
            <p>Aucun produit trouvé.</p>
            <a class="btn btn-primary" href="<?= e(url('/admin/produits/nouveau')) ?>">Ajouter votre premier produit</a>
        </div>
    <?php endif ?>
</form>
