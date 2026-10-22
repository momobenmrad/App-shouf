<div class="grid-main">
    <section class="panel">
        <div class="panel-head"><h2>Catégories</h2></div>
        <?php if ($categories): ?>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Nom</th><th class="num">Produits</th><th class="num">Ordre</th><th>État</th><th></th></tr></thead>
                    <tbody>
                    <?php foreach ($categories as $c): ?>
                        <tr>
                            <td class="product-cell">
                                <?php if ($c['image']): ?><img src="<?= e(media($c['image'])) ?>" alt="" width="40" height="40"><?php endif ?>
                                <div><strong><?= $c['parent_id'] ? '— ' : '' ?><?= e($c['name']) ?></strong><br><span class="muted small">/categorie/<?= e($c['slug']) ?></span></div>
                            </td>
                            <td class="num"><?= (int) $c['product_count'] ?></td>
                            <td class="num"><?= (int) $c['position'] ?></td>
                            <td><?= (int) $c['is_active'] ? '<span class="badge badge-success">Visible</span>' : '<span class="badge badge-muted">Masquée</span>' ?></td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/categories', ['edit' => $c['id']])) ?>">Modifier</a>
                                <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $c['id'] ?>">
                                    <button class="btn btn-ghost btn-sm text-danger" type="submit" data-confirm="Supprimer la catégorie « <?= e($c['name']) ?> » ?">Supprimer</button></form>
                            </td>
                        </tr>
                    <?php endforeach ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <p class="empty">Aucune catégorie. Créez-en une avec le formulaire.</p>
        <?php endif ?>
    </section>

    <section class="panel">
        <div class="panel-head"><h2><?= $edit ? 'Modifier « ' . e($edit['name']) . ' »' : 'Nouvelle catégorie' ?></h2><?php if ($edit): ?><a href="<?= e(url('/admin/categories')) ?>">Annuler</a><?php endif ?></div>
        <form method="post" enctype="multipart/form-data" class="form-stack">
            <?= csrf_field() ?>
            <input type="hidden" name="id" value="<?= (int) ($edit['id'] ?? 0) ?>">
            <div class="field"><label for="c-name">Nom *</label><input id="c-name" name="name" required value="<?= e($edit['name'] ?? '') ?>"></div>
            <div class="field"><label for="c-slug">Adresse (slug)</label><input id="c-slug" name="slug" value="<?= e($edit['slug'] ?? '') ?>" placeholder="automatique"></div>
            <div class="field">
                <label for="c-parent">Catégorie parente</label>
                <select id="c-parent" name="parent_id">
                    <option value="">— Aucune —</option>
                    <?php foreach ($categories as $c): if (!$c['parent_id'] && (int) $c['id'] !== (int) ($edit['id'] ?? 0)): ?>
                        <option value="<?= (int) $c['id'] ?>" <?= (int) ($edit['parent_id'] ?? 0) === (int) $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
                    <?php endif; endforeach ?>
                </select>
            </div>
            <div class="field"><label for="c-desc">Description</label><textarea id="c-desc" name="description" rows="3"><?= e($edit['description'] ?? '') ?></textarea></div>
            <div class="field"><label for="c-img">Image</label><input id="c-img" type="file" name="image" accept="image/*"><?php if (!empty($edit['image'])): ?><img class="thumb-preview" src="<?= e(media($edit['image'])) ?>" alt=""><?php endif ?></div>
            <div class="field"><label for="c-pos">Ordre d’affichage</label><input id="c-pos" type="number" name="position" value="<?= (int) ($edit['position'] ?? 0) ?>"></div>
            <label class="switch"><input type="checkbox" name="is_active" value="1" <?= ($edit['is_active'] ?? 1) ? 'checked' : '' ?>><span>Visible</span></label>
            <button class="btn btn-primary" type="submit">Enregistrer</button>
        </form>
    </section>
</div>
