<?php
$v = fn(string $k, $default = '') => old($k, $product[$k] ?? $default);
$err = fn(string $k) => isset($errors[$k]) ? '<p class="field-error">' . e($errors[$k]) . '</p>' : '';
$variantRows = old('variants') ?: array_map(fn($r) => [
    'id' => $r['id'], 'name' => $r['name'], 'sku' => $r['sku'],
    'price' => $r['price'] === null ? '' : money_input((int) $r['price']), 'stock' => $r['stock'] ?? '',
], $variants);
?>
<div class="page-actions">
    <a class="btn btn-ghost" href="<?= e(url('/admin/produits')) ?>">← Produits</a>
    <div class="spacer"></div>
    <?php if ($product): ?>
        <a class="btn btn-outline" href="<?= e(url('/produit/' . $product['slug'])) ?>" target="_blank">Voir sur la boutique ↗</a>
        <form method="post" action="<?= e(url('/admin/produits/' . $product['id'] . '/dupliquer')) ?>"><?= csrf_field() ?><button class="btn btn-outline" type="submit">Dupliquer</button></form>
    <?php endif ?>
</div>

<form method="post" enctype="multipart/form-data" class="grid-main" id="product-form">
    <?= csrf_field() ?>
    <div>
        <section class="panel form-stack">
            <div class="field <?= isset($errors['name']) ? 'has-error' : '' ?>">
                <label for="name">Nom du produit *</label>
                <input id="name" name="name" required value="<?= e($v('name')) ?>" data-slug-source>
                <?= $err('name') ?>
            </div>
            <div class="field">
                <label for="short_description">Accroche <span class="muted">(affichée près du prix, 1 à 2 phrases)</span></label>
                <textarea id="short_description" name="short_description" rows="2" maxlength="500"><?= e($v('short_description')) ?></textarea>
            </div>
            <div class="field">
                <label for="description">Description détaillée</label>
                <textarea id="description" name="description" rows="10"><?= e($v('description')) ?></textarea>
                <p class="hint">Mise en forme : ligne vide = nouveau paragraphe · « ## Titre » · « - élément » pour une liste · **gras** · [texte](https://lien)</p>
            </div>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Photos</h2><span class="muted small">Glissez pour réordonner — la première est la photo principale</span></div>
            <ul class="image-grid" data-sortable>
                <?php foreach ($images as $img): ?>
                    <li draggable="true">
                        <input type="hidden" name="image_order[]" value="<?= (int) $img['id'] ?>">
                        <img src="<?= e(media($img['path'])) ?>" alt="">
                        <label class="image-delete"><input type="checkbox" name="delete_images[]" value="<?= (int) $img['id'] ?>"> Supprimer</label>
                    </li>
                <?php endforeach ?>
            </ul>
            <label class="dropzone">
                <input type="file" name="images[]" accept="image/jpeg,image/png,image/webp,image/gif" multiple data-preview>
                <span><strong>Ajouter des photos</strong> — JPG, PNG ou WebP, 8 Mo max. Format portrait 4:5 conseillé (ex. 1200 × 1500 px).</span>
            </label>
            <div class="image-grid preview" data-preview-target></div>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Options / variantes</h2><span class="muted small">Tailles, couleurs, contenances… (facultatif)</span></div>
            <div class="field">
                <label for="option_label">Nom de l’option</label>
                <input id="option_label" name="option_label" placeholder="Ex. Taille, Couleur, Contenance" value="<?= e($v('option_label')) ?>">
            </div>
            <div class="table-wrap">
                <table class="table variants-table">
                    <thead><tr><th>Valeur</th><th>Réf.</th><th>Prix spécifique</th><th>Stock</th><th></th></tr></thead>
                    <tbody data-variants>
                    <?php foreach ($variantRows as $i => $row): ?>
                        <tr>
                            <td><input type="hidden" name="variants[<?= $i ?>][id]" value="<?= e($row['id'] ?? '') ?>"><input name="variants[<?= $i ?>][name]" value="<?= e($row['name'] ?? '') ?>" placeholder="Ex. M" aria-label="Valeur"></td>
                            <td><input name="variants[<?= $i ?>][sku]" value="<?= e($row['sku'] ?? '') ?>" aria-label="Référence"></td>
                            <td><input name="variants[<?= $i ?>][price]" value="<?= e($row['price'] ?? '') ?>" inputmode="decimal" placeholder="= prix produit" aria-label="Prix"></td>
                            <td><input name="variants[<?= $i ?>][stock]" value="<?= e($row['stock'] ?? '') ?>" inputmode="numeric" placeholder="∞" aria-label="Stock"></td>
                            <td><button class="icon-btn" type="button" data-remove-row aria-label="Retirer">✕</button></td>
                        </tr>
                    <?php endforeach ?>
                    </tbody>
                </table>
            </div>
            <template data-variant-template>
                <tr>
                    <td><input type="hidden" name="variants[__i__][id]" value=""><input name="variants[__i__][name]" placeholder="Ex. M" aria-label="Valeur"></td>
                    <td><input name="variants[__i__][sku]" aria-label="Référence"></td>
                    <td><input name="variants[__i__][price]" inputmode="decimal" placeholder="= prix produit" aria-label="Prix"></td>
                    <td><input name="variants[__i__][stock]" inputmode="numeric" placeholder="∞" aria-label="Stock"></td>
                    <td><button class="icon-btn" type="button" data-remove-row aria-label="Retirer">✕</button></td>
                </tr>
            </template>
            <button class="btn btn-outline btn-sm" type="button" data-add-variant>+ Ajouter une option</button>
            <p class="hint">Stock vide = non suivi (illimité). Quand des options existent, le client doit en choisir une et c’est leur stock qui compte.</p>
        </section>

        <section class="panel form-stack">
            <div class="panel-head"><h2>Référencement (SEO)</h2></div>
            <div class="field">
                <label for="slug">Adresse de la page</label>
                <div class="input-prefix"><span><?= e(preg_replace('#^https?://#', '', abs_url('/produit/'))) ?></span><input id="slug" name="slug" value="<?= e($v('slug')) ?>" placeholder="généré automatiquement" data-slug-target></div>
            </div>
            <div class="field">
                <label for="meta_title">Titre pour Google</label>
                <input id="meta_title" name="meta_title" maxlength="190" value="<?= e($v('meta_title')) ?>" placeholder="Par défaut : nom du produit">
            </div>
            <div class="field">
                <label for="meta_description">Description pour Google</label>
                <textarea id="meta_description" name="meta_description" rows="2" maxlength="300" placeholder="Par défaut : l’accroche"><?= e($v('meta_description')) ?></textarea>
            </div>
        </section>
    </div>

    <div>
        <section class="panel form-stack sticky-panel">
            <label class="switch"><input type="checkbox" name="is_active" value="1" <?= $v('is_active', 1) ? 'checked' : '' ?>><span>Publié sur la boutique</span></label>
            <label class="switch"><input type="checkbox" name="is_featured" value="1" <?= $v('is_featured', 0) ? 'checked' : '' ?>><span>Mis en avant sur l’accueil</span></label>
            <div class="field <?= isset($errors['price']) ? 'has-error' : '' ?>">
                <label for="price">Prix de vente * <span class="muted">(<?= e(setting('currency_symbol')) ?>)</span></label>
                <input id="price" name="price" inputmode="decimal" required value="<?= e(old('price', $product ? money_input((int) $product['price']) : '')) ?>">
                <?= $err('price') ?>
            </div>
            <div class="field">
                <label for="compare_price">Prix barré <span class="muted">(avant remise)</span></label>
                <input id="compare_price" name="compare_price" inputmode="decimal" value="<?= e(old('compare_price', $product && $product['compare_price'] ? money_input((int) $product['compare_price']) : '')) ?>">
            </div>
            <div class="field">
                <label for="stock">Stock</label>
                <input id="stock" name="stock" inputmode="numeric" placeholder="Vide = non suivi" value="<?= e($v('stock')) ?>">
            </div>
            <div class="field">
                <label for="sku">Référence (SKU)</label>
                <input id="sku" name="sku" value="<?= e($v('sku')) ?>">
            </div>
            <div class="field">
                <label for="category_id">Catégorie</label>
                <select id="category_id" name="category_id">
                    <option value="">— Aucune —</option>
                    <?php foreach ($categories as $c): ?>
                        <option value="<?= (int) $c['id'] ?>" <?= (int) $v('category_id') === (int) $c['id'] ? 'selected' : '' ?>><?= $c['parent_id'] ? '— ' : '' ?><?= e($c['name']) ?></option>
                    <?php endforeach ?>
                </select>
            </div>
            <button class="btn btn-primary btn-block" type="submit"><?= $product ? 'Enregistrer' : 'Créer le produit' ?></button>
        </section>
        <?php if ($product): ?>
            <section class="panel danger-zone">
                <h2>Zone sensible</h2>
                <p class="muted small">Supprimer le produit efface ses photos. Les commandes passées gardent leur historique. Pour le retirer temporairement, décochez plutôt « Publié ».</p>
                <button class="btn btn-danger btn-block" type="submit" form="delete-form" data-confirm="Supprimer définitivement ce produit ?">Supprimer le produit</button>
            </section>
        <?php endif ?>
    </div>
</form>
<?php if ($product): ?>
    <form id="delete-form" method="post" action="<?= e(url('/admin/produits/' . $product['id'] . '/supprimer')) ?>"><?= csrf_field() ?></form>
<?php endif ?>
