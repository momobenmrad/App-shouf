<div class="grid-main">
    <section class="panel">
        <div class="panel-head"><h2>Codes promo</h2></div>
        <?php if ($coupons): ?>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Code</th><th>Remise</th><th>Conditions</th><th class="num">Utilisations</th><th>État</th><th></th></tr></thead>
                    <tbody>
                    <?php foreach ($coupons as $c):
                        $expired = $c['expires_at'] && $c['expires_at'] < now(); ?>
                        <tr>
                            <td><code><?= e($c['code']) ?></code></td>
                            <td><?= $c['type'] === 'percent' ? (int) $c['value'] . ' %' : e(format_money((int) $c['value'])) ?></td>
                            <td class="small"><?= (int) $c['min_total'] ? 'Dès ' . e(format_money((int) $c['min_total'])) : 'Sans minimum' ?><?= $c['expires_at'] ? '<br>Jusqu’au ' . e(date('d/m/Y', strtotime($c['expires_at']))) : '' ?></td>
                            <td class="num"><?= (int) $c['used_count'] ?><?= $c['max_uses'] !== null ? ' / ' . (int) $c['max_uses'] : '' ?></td>
                            <td><?= !(int) $c['is_active'] ? '<span class="badge badge-muted">Inactif</span>' : ($expired ? '<span class="badge badge-warn">Expiré</span>' : '<span class="badge badge-success">Actif</span>') ?></td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="<?= e(url('/admin/coupons', ['edit' => $c['id']])) ?>">Modifier</a>
                                <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $c['id'] ?>">
                                    <button class="btn btn-ghost btn-sm text-danger" type="submit" data-confirm="Supprimer ce code ?">Supprimer</button></form>
                            </td>
                        </tr>
                    <?php endforeach ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <p class="empty">Aucun code promo. Créez-en un pour vos campagnes (réseaux sociaux, influenceurs, fidélité…).</p>
        <?php endif ?>
    </section>
    <section class="panel">
        <div class="panel-head"><h2><?= $edit ? 'Modifier le code' : 'Nouveau code' ?></h2><?php if ($edit): ?><a href="<?= e(url('/admin/coupons')) ?>">Annuler</a><?php endif ?></div>
        <form method="post" class="form-stack">
            <?= csrf_field() ?>
            <input type="hidden" name="id" value="<?= (int) ($edit['id'] ?? 0) ?>">
            <div class="field"><label for="cp-code">Code *</label><input id="cp-code" name="code" required value="<?= e($edit['code'] ?? '') ?>" placeholder="BIENVENUE10" style="text-transform:uppercase"></div>
            <div class="field-row">
                <div class="field"><label for="cp-type">Type</label>
                    <select id="cp-type" name="type">
                        <option value="percent" <?= ($edit['type'] ?? '') === 'percent' ? 'selected' : '' ?>>Pourcentage</option>
                        <option value="fixed" <?= ($edit['type'] ?? '') === 'fixed' ? 'selected' : '' ?>>Montant fixe</option>
                    </select></div>
                <div class="field"><label for="cp-value">Valeur *</label><input id="cp-value" name="value" required inputmode="decimal" value="<?= e($edit ? ($edit['type'] === 'percent' ? $edit['value'] : money_input((int) $edit['value'])) : '') ?>"></div>
            </div>
            <div class="field"><label for="cp-min">Montant minimum du panier</label><input id="cp-min" name="min_total" inputmode="decimal" value="<?= e($edit && (int) $edit['min_total'] ? money_input((int) $edit['min_total']) : '') ?>"></div>
            <div class="field-row">
                <div class="field"><label for="cp-max">Utilisations max.</label><input id="cp-max" name="max_uses" inputmode="numeric" placeholder="Illimité" value="<?= e($edit['max_uses'] ?? '') ?>"></div>
                <div class="field"><label for="cp-exp">Expire le</label><input id="cp-exp" type="date" name="expires_at" value="<?= e(!empty($edit['expires_at']) ? substr($edit['expires_at'], 0, 10) : '') ?>"></div>
            </div>
            <label class="switch"><input type="checkbox" name="is_active" value="1" <?= ($edit['is_active'] ?? 1) ? 'checked' : '' ?>><span>Actif</span></label>
            <button class="btn btn-primary" type="submit">Enregistrer</button>
        </form>
    </section>
</div>
