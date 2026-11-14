<main class="login-wrap">
    <form class="login-card" method="post" action="<?= e(url('/admin/connexion')) ?>">
        <?= csrf_field() ?>
        <input type="hidden" name="next" value="<?= e($_GET['next'] ?? '') ?>">
        <div class="login-brand">
            <span class="brand-mark"><?= e(mb_strtoupper(mb_substr((string) setting('shop_name'), 0, 1))) ?></span>
            <div>
                <strong><?= e(setting('shop_name')) ?></strong>
                <span>Espace administration</span>
            </div>
        </div>
        <?php if ($error): ?><div class="alert alert-error" role="alert"><?= e($error) ?></div><?php endif ?>
        <div class="field">
            <label for="email">E-mail</label>
            <input id="email" type="email" name="email" required autocomplete="username" autofocus value="<?= e($_POST['email'] ?? '') ?>">
        </div>
        <div class="field">
            <label for="password">Mot de passe</label>
            <input id="password" type="password" name="password" required autocomplete="current-password">
        </div>
        <button class="btn btn-primary btn-block" type="submit">Se connecter</button>
        <p class="muted small center"><a href="<?= e(url('/')) ?>">← Retour à la boutique</a></p>
    </form>
</main>
