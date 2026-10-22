<div class="grid-2">
    <section class="panel">
        <div class="panel-head"><h2>Mon compte</h2></div>
        <form method="post" class="form-stack">
            <?= csrf_field() ?>
            <div class="field"><label for="a-name">Nom</label><input id="a-name" name="name" value="<?= e($admin['name']) ?>"></div>
            <div class="field <?= isset($errors['email']) ? 'has-error' : '' ?>"><label for="a-email">E-mail de connexion</label><input id="a-email" type="email" name="email" required value="<?= e($admin['email']) ?>"><?= isset($errors['email']) ? '<p class="field-error">' . e($errors['email']) . '</p>' : '' ?></div>
            <div class="field <?= isset($errors['password']) ? 'has-error' : '' ?>"><label for="a-pass">Nouveau mot de passe <span class="muted">(laisser vide pour conserver)</span></label><input id="a-pass" type="password" name="password" autocomplete="new-password" minlength="10"><?= isset($errors['password']) ? '<p class="field-error">' . e($errors['password']) . '</p>' : '' ?></div>
            <div class="field"><label for="a-pass2">Confirmer le nouveau mot de passe</label><input id="a-pass2" type="password" name="password_confirm" autocomplete="new-password"></div>
            <div class="field <?= isset($errors['current_password']) ? 'has-error' : '' ?>"><label for="a-cur">Mot de passe actuel *</label><input id="a-cur" type="password" name="current_password" required autocomplete="current-password"><?= isset($errors['current_password']) ? '<p class="field-error">' . e($errors['current_password']) . '</p>' : '' ?></div>
            <button class="btn btn-primary" type="submit">Enregistrer</button>
        </form>
    </section>
    <section class="panel">
        <div class="panel-head"><h2>Administrateurs</h2></div>
        <ul class="list">
            <?php foreach ($admins as $a): ?>
                <li><span><strong><?= e($a['name']) ?></strong><br><span class="muted small"><?= e($a['email']) ?> · dernière connexion <?= $a['last_login_at'] ? e(date('d/m/Y H:i', strtotime($a['last_login_at']))) : 'jamais' ?></span></span>
                    <?php if ((int) $a['id'] !== (int) $admin['id']): ?>
                        <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $a['id'] ?>"><button class="btn btn-ghost btn-sm text-danger" type="submit" data-confirm="Retirer l’accès de <?= e($a['email']) ?> ?">Retirer</button></form>
                    <?php else: ?><span class="badge badge-brand">Vous</span><?php endif ?>
                </li>
            <?php endforeach ?>
        </ul>
        <h3 class="panel-subtitle">Ajouter un administrateur</h3>
        <form method="post" class="form-stack">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="create">
            <div class="field"><label for="n-name">Nom</label><input id="n-name" name="new_name"></div>
            <div class="field"><label for="n-email">E-mail</label><input id="n-email" type="email" name="new_email" required></div>
            <div class="field"><label for="n-pass">Mot de passe (10 caractères min.)</label><input id="n-pass" type="password" name="new_password" required minlength="10" autocomplete="new-password"></div>
            <button class="btn btn-outline" type="submit">Ajouter</button>
        </form>
    </section>
</div>
