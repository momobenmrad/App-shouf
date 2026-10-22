<?php if ($edit !== null): ?>
    <div class="page-actions"><a class="btn btn-ghost" href="<?= e(url('/admin/pages')) ?>">← Pages</a>
        <div class="spacer"></div>
        <?php if (!empty($edit['slug'])): ?><a class="btn btn-outline" href="<?= e(url('/page/' . $edit['slug'])) ?>" target="_blank">Voir ↗</a><?php endif ?>
    </div>
    <form method="post" class="grid-main">
        <?= csrf_field() ?>
        <input type="hidden" name="id" value="<?= (int) ($edit['id'] ?? 0) ?>">
        <section class="panel form-stack">
            <div class="field"><label for="p-title">Titre *</label><input id="p-title" name="title" required value="<?= e($edit['title'] ?? '') ?>"></div>
            <div class="field">
                <label for="p-content">Contenu</label>
                <textarea id="p-content" name="content" rows="22"><?= e($edit['content'] ?? '') ?></textarea>
                <p class="hint">Ligne vide = paragraphe · « ## Titre » · « ### Sous-titre » · « - élément » · **gras** · [texte](https://lien). Remplacez les passages entre crochets [ … ] par vos informations.</p>
            </div>
        </section>
        <section class="panel form-stack">
            <div class="field"><label for="p-slug">Adresse (slug)</label><input id="p-slug" name="slug" value="<?= e($edit['slug'] ?? '') ?>" placeholder="automatique"></div>
            <div class="field"><label for="p-pos">Ordre</label><input id="p-pos" type="number" name="position" value="<?= (int) ($edit['position'] ?? 0) ?>"></div>
            <label class="switch"><input type="checkbox" name="is_active" value="1" <?= ($edit['is_active'] ?? 1) ? 'checked' : '' ?>><span>Publiée</span></label>
            <label class="switch"><input type="checkbox" name="in_footer" value="1" <?= ($edit['in_footer'] ?? 1) ? 'checked' : '' ?>><span>Lien dans le pied de page</span></label>
            <button class="btn btn-primary" type="submit">Enregistrer</button>
            <?php if (!empty($edit['slug']) && $edit['slug'] === 'conditions-generales-de-vente'): ?>
                <p class="hint">Tant que cette page est publiée, le client doit accepter les CGV pour commander.</p>
            <?php endif ?>
        </section>
    </form>
    <?php if (!empty($edit['id'])): ?>
        <form method="post" class="panel danger-zone">
            <?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $edit['id'] ?>">
            <button class="btn btn-danger btn-sm" type="submit" data-confirm="Supprimer cette page ?">Supprimer la page</button>
        </form>
    <?php endif ?>
<?php else: ?>
    <div class="page-actions"><div class="spacer"></div><a class="btn btn-primary" href="<?= e(url('/admin/pages', ['edit' => 'new'])) ?>">+ Nouvelle page</a></div>
    <section class="panel">
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Titre</th><th>Adresse</th><th>Pied de page</th><th>État</th><th>Mise à jour</th></tr></thead>
                <tbody>
                <?php foreach ($pages as $p): ?>
                    <tr>
                        <td><a href="<?= e(url('/admin/pages', ['edit' => $p['id']])) ?>"><strong><?= e($p['title']) ?></strong></a>
                            <?php if (str_contains((string) $p['content'], '[')): ?><br><span class="badge badge-warn">À compléter</span><?php endif ?></td>
                        <td class="muted small">/page/<?= e($p['slug']) ?></td>
                        <td><?= (int) $p['in_footer'] ? 'Oui' : 'Non' ?></td>
                        <td><?= (int) $p['is_active'] ? '<span class="badge badge-success">Publiée</span>' : '<span class="badge badge-muted">Brouillon</span>' ?></td>
                        <td class="small"><?= e(date('d/m/Y', strtotime($p['updated_at']))) ?></td>
                    </tr>
                <?php endforeach ?>
                </tbody>
            </table>
        </div>
    </section>
<?php endif ?>
