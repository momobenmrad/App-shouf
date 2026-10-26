<?php
$tabs = [
    'general' => 'Identité',
    'apparence' => 'Apparence',
    'vente' => 'Vente & livraison',
    'paiement' => 'Paiements',
    'emails' => 'E-mails',
    'seo' => 'SEO & suivi',
];
$tab = isset($tabs[$tab]) ? $tab : 'general';
$fields = [];

/** Renders one setting input and registers it in the submitted field list. */
$input = function (string $key, string $label, array $o = []) use (&$fields): void {
    $fields[] = $key;
    $type = $o['type'] ?? 'text';
    $id = 's-' . $key;
    $value = in_array($key, secret_settings(), true) ? '' : (string) setting($key, '');
    if (!empty($o['money'])) {
        $value = money_input((int) $value);
    }
    echo '<div class="field ' . e($o['class'] ?? '') . '">';
    if ($type === 'checkbox') {
        echo '<label class="switch"><input type="checkbox" name="' . e($key) . '" value="1" ' . (setting($key) ? 'checked' : '') . '><span>' . e($label) . '</span></label>';
    } else {
        echo '<label for="' . e($id) . '">' . e($label) . '</label>';
        if ($type === 'textarea') {
            echo '<textarea id="' . e($id) . '" name="' . e($key) . '" rows="' . (int) ($o['rows'] ?? 3) . '">' . e($value) . '</textarea>';
        } elseif ($type === 'select') {
            echo '<select id="' . e($id) . '" name="' . e($key) . '">';
            foreach ($o['options'] as $v => $l) {
                echo '<option value="' . e($v) . '" ' . ((string) setting($key) === (string) $v ? 'selected' : '') . '>' . e($l) . '</option>';
            }
            echo '</select>';
        } else {
            $ph = in_array($key, secret_settings(), true) && setting($key) ? '•••••••• (enregistré — laisser vide pour conserver)' : ($o['placeholder'] ?? '');
            echo '<input id="' . e($id) . '" type="' . e($type) . '" name="' . e($key) . '" value="' . e($value) . '" placeholder="' . e($ph) . '" ' . ($o['attrs'] ?? '') . '>';
        }
    }
    if (!empty($o['hint'])) {
        echo '<p class="hint">' . $o['hint'] . '</p>';
    }
    echo '</div>';
};

$image = function (string $key, string $label, string $hint) {
    echo '<div class="field"><label for="s-' . e($key) . '">' . e($label) . '</label>';
    if (setting($key)) {
        echo '<div class="image-setting"><img src="' . e(media(setting($key))) . '" alt=""><label class="check"><input type="checkbox" name="remove_' . e($key) . '" value="1"> Retirer</label></div>';
    }
    echo '<input id="s-' . e($key) . '" type="file" name="' . e($key) . '" accept="image/*"><p class="hint">' . e($hint) . '</p></div>';
};
?>
<nav class="tabs" aria-label="Sections des paramètres">
    <?php foreach ($tabs as $k => $label): ?>
        <a href="<?= e(url('/admin/parametres', ['tab' => $k])) ?>" <?= $k === $tab ? 'aria-current="page"' : '' ?>><?= e($label) ?></a>
    <?php endforeach ?>
</nav>

<form method="post" enctype="multipart/form-data" action="<?= e(url('/admin/parametres', ['tab' => $tab])) ?>" class="panel form-stack settings-form">
    <?= csrf_field() ?>

    <?php if ($tab === 'general'): ?>
        <div class="field-row">
            <?php $input('shop_name', 'Nom de la boutique') ?>
            <?php $input('shop_tagline', 'Slogan') ?>
        </div>
        <?php $image('logo', 'Logo', 'PNG ou SVG transparent conseillé, hauteur affichée 40 px.') ?>
        <?php $image('favicon', 'Icône d’onglet (favicon)', 'Carré, 64 × 64 px minimum.') ?>
        <div class="field-row">
            <?php $input('shop_email', 'E-mail de contact', ['type' => 'email']) ?>
            <?php $input('shop_phone', 'Téléphone') ?>
        </div>
        <div class="field-row">
            <?php $input('whatsapp', 'Numéro WhatsApp', ['placeholder' => '+216 20 000 000', 'hint' => 'Affiche un bouton WhatsApp flottant sur la boutique. Format international.']) ?>
            <?php $input('shop_address', 'Adresse') ?>
        </div>
        <div class="field-row">
            <?php $input('legal_name', 'Raison sociale', ['hint' => 'Affichée sur les factures et dans le pied de page.']) ?>
            <?php $input('tax_id', 'Matricule fiscal / SIRET') ?>
        </div>
        <div class="field-row">
            <?php $input('facebook', 'Page Facebook', ['type' => 'url', 'placeholder' => 'https://facebook.com/…']) ?>
            <?php $input('instagram', 'Instagram', ['type' => 'url', 'placeholder' => 'https://instagram.com/…']) ?>
        </div>
        <?php $input('tiktok', 'TikTok', ['type' => 'url', 'placeholder' => 'https://tiktok.com/@…']) ?>
        <?php $input('footer_text', 'Texte du pied de page', ['type' => 'textarea', 'rows' => 2]) ?>

    <?php elseif ($tab === 'apparence'): ?>
        <?php $input('theme', 'Thème de la boutique', ['type' => 'select', 'options' => SHOP_THEMES, 'hint' => 'Luxe : typographie à empattements, palette ivoire / nuit / or, bannière immersive. Idéal pour bijoux, beauté et mode haut de gamme.']) ?>
        <?php $input('brand_color', 'Couleur principale', ['type' => 'color', 'hint' => 'Boutons, liens et accents. La couleur du texte posé dessus est calculée automatiquement pour rester lisible.']) ?>
        <?php $input('announcement', 'Bandeau d’annonce (haut de page)', ['placeholder' => 'Vide = masqué']) ?>
        <?php $input('hero_title', 'Titre de la page d’accueil') ?>
        <?php $input('hero_subtitle', 'Sous-titre', ['type' => 'textarea', 'rows' => 2]) ?>
        <?php $input('hero_cta', 'Texte du bouton') ?>
        <?php $image('hero_image', 'Image de la bannière d’accueil', 'Paysage, 2000 × 1000 px conseillé. Sans image, un montage des produits mis en avant est affiché.') ?>
        <?php $input('products_per_page', 'Produits par page', ['type' => 'number', 'attrs' => 'min="4" max="48"']) ?>

        <?php $others = array_diff(enabled_locales(), [setting('default_locale', 'fr')]); ?>
        <?php if ($others): ?>
            <h2 class="form-section">Traductions des textes de la boutique</h2>
            <p class="hint">Facultatif. Laissés vides, les textes d’origine sont traduits automatiquement tant que vous ne les avez pas modifiés ; sinon, votre texte s’affiche tel quel.</p>
            <?php foreach ($others as $l): ?>
                <fieldset class="pay-card">
                    <legend><strong><?= e(SUPPORTED_LOCALES[$l]['name']) ?></strong></legend>
                    <?php foreach (['announcement' => 'Bandeau d’annonce', 'hero_title' => 'Titre de l’accueil', 'hero_subtitle' => 'Sous-titre', 'hero_cta' => 'Texte du bouton', 'shop_tagline' => 'Slogan'] as $k => $label): ?>
                        <?php $input($k . '_' . $l, $label, ['attrs' => 'dir="' . SUPPORTED_LOCALES[$l]['dir'] . '" lang="' . $l . '"']) ?>
                    <?php endforeach ?>
                </fieldset>
            <?php endforeach ?>
        <?php endif ?>

    <?php elseif ($tab === 'vente'): ?>
        <h2 class="form-section">Langues et devise</h2>
        <?php $fields[] = 'locales'; $enabled = enabled_locales(); ?>
        <fieldset class="field">
            <legend>Langues proposées</legend>
            <div class="checks">
                <?php foreach (SUPPORTED_LOCALES as $code => $l): ?>
                    <label class="check"><input type="checkbox" name="locales[]" value="<?= e($code) ?>" <?= in_array($code, $enabled, true) ? 'checked' : '' ?>> <?= e($l['name']) ?></label>
                <?php endforeach ?>
            </div>
        </fieldset>
        <div class="field-row">
            <?php $input('default_locale', 'Langue par défaut', ['type' => 'select', 'options' => array_map(fn($l) => $l['name'], SUPPORTED_LOCALES)]) ?>
            <?php $input('default_country', 'Pays de livraison par défaut') ?>
        </div>
        <div class="field-row">
            <?php $input('currency_code', 'Code devise (ISO)', ['placeholder' => 'TND, EUR, MAD, DZD…', 'attrs' => 'maxlength="3" style="text-transform:uppercase"']) ?>
            <?php $input('currency_symbol', 'Symbole affiché', ['placeholder' => 'DT, €, DH…']) ?>
        </div>
        <div class="field-row">
            <?php $input('currency_decimals', 'Décimales', ['type' => 'select', 'options' => ['0' => '0', '2' => '2 (EUR, MAD, DZD…)', '3' => '3 (TND)'], 'hint' => '⚠️ À choisir avant de saisir les prix : les montants enregistrés ne sont pas convertis.']) ?>
            <?php $input('currency_position', 'Position du symbole', ['type' => 'select', 'options' => ['after' => 'Après : 49,900 DT', 'before' => 'Avant : € 49,90']]) ?>
        </div>

        <h2 class="form-section">Livraison</h2>
        <div class="field-row">
            <?php $input('shipping_fee', 'Frais de livraison', ['money' => true, 'attrs' => 'inputmode="decimal"']) ?>
            <?php $input('free_shipping_threshold', 'Livraison offerte dès', ['money' => true, 'attrs' => 'inputmode="decimal"', 'hint' => '0 = jamais offerte.']) ?>
        </div>
        <div class="field-row">
            <?php $input('delivery_delay', 'Délai de livraison affiché', ['placeholder' => '24 à 72 h']) ?>
            <?php $input('order_prefix', 'Préfixe des numéros de commande', ['attrs' => 'maxlength="10"']) ?>
        </div>
        <div class="field-row">
            <?php $input('low_stock_threshold', 'Alerte stock faible à partir de', ['type' => 'number', 'attrs' => 'min="0"']) ?>
            <?php $input('require_postal_code', 'Code postal obligatoire', ['type' => 'checkbox']) ?>
        </div>

    <?php elseif ($tab === 'paiement'): ?>
        <?php $tnd = strtoupper((string) setting('currency_code')) === 'TND'; ?>
        <section class="pay-card">
            <h2>Paiement à la livraison</h2>
            <?php $input('cod_enabled', 'Activer le paiement à la livraison', ['type' => 'checkbox']) ?>
            <?php $input('cod_fee', 'Frais supplémentaires (facultatif)', ['money' => true, 'attrs' => 'inputmode="decimal"']) ?>
        </section>

        <section class="pay-card">
            <h2>Konnect <span class="badge badge-muted">Tunisie · cartes, e-DINAR, wallet</span></h2>
            <?php if (!$tnd): ?><p class="alert alert-info">Konnect encaisse uniquement en dinars (TND) : passez la devise en TND pour l’activer.</p><?php endif ?>
            <?php $input('konnect_enabled', 'Activer Konnect', ['type' => 'checkbox']) ?>
            <?php $input('konnect_sandbox', 'Mode test (sandbox)', ['type' => 'checkbox', 'hint' => 'Décochez une fois les tests validés pour encaisser réellement.']) ?>
            <div class="field-row">
                <?php $input('konnect_api_key', 'Clé API (x-api-key)', ['type' => 'password', 'attrs' => 'autocomplete="off"']) ?>
                <?php $input('konnect_wallet_id', 'Identifiant du wallet marchand') ?>
            </div>
            <p class="hint">Webhook à déclarer si demandé : <code><?= e(abs_url('/webhook/konnect')) ?></code></p>
        </section>

        <section class="pay-card">
            <h2>Flouci <span class="badge badge-muted">Tunisie · wallet et cartes</span></h2>
            <?php if (!$tnd): ?><p class="alert alert-info">Flouci encaisse uniquement en dinars (TND).</p><?php endif ?>
            <?php $input('flouci_enabled', 'Activer Flouci', ['type' => 'checkbox']) ?>
            <div class="field-row">
                <?php $input('flouci_app_token', 'App token (public)') ?>
                <?php $input('flouci_app_secret', 'App secret', ['type' => 'password', 'attrs' => 'autocomplete="off"']) ?>
            </div>
        </section>

        <section class="pay-card">
            <h2>Stripe <span class="badge badge-muted">International · Visa, Mastercard, Apple Pay…</span></h2>
            <?php $input('stripe_enabled', 'Activer Stripe', ['type' => 'checkbox']) ?>
            <div class="field-row">
                <?php $input('stripe_secret_key', 'Clé secrète (sk_live_… ou sk_test_…)', ['type' => 'password', 'attrs' => 'autocomplete="off"']) ?>
                <?php $input('stripe_webhook_secret', 'Secret du webhook (whsec_…)', ['type' => 'password', 'attrs' => 'autocomplete="off"']) ?>
            </div>
            <div class="field-row">
                <?php $input('stripe_currency', 'Devise d’encaissement Stripe', ['placeholder' => 'eur', 'hint' => 'Stripe ne prend pas en charge le dinar tunisien : utilisez EUR ou USD avec un taux de conversion.']) ?>
                <?php $input('stripe_rate', 'Taux de conversion', ['placeholder' => '1', 'hint' => 'Montant Stripe = montant boutique × taux. Ex. TND → EUR : 0.29. Laissez 1 si la devise est la même.']) ?>
            </div>
            <p class="hint">Webhook Stripe (événements <code>checkout.session.completed</code>, <code>checkout.session.async_payment_succeeded</code>, <code>checkout.session.async_payment_failed</code>) : <code><?= e(abs_url('/webhook/stripe')) ?></code></p>
        </section>

    <?php elseif ($tab === 'emails'): ?>
        <p class="alert alert-info">Les e-mails partent par la fonction mail() de l’hébergeur tant qu’aucun serveur SMTP n’est renseigné. Pour éviter les spams, utilisez de préférence le SMTP de votre hébergeur (adresse e-mail du domaine).</p>
        <div class="field-row">
            <?php $input('mail_from', 'Adresse d’expédition', ['type' => 'email', 'placeholder' => 'commandes@votre-domaine.com']) ?>
            <?php $input('notify_email', 'Recevoir les nouvelles commandes sur', ['type' => 'email', 'placeholder' => 'Par défaut : e-mail de contact']) ?>
        </div>
        <div class="field-row">
            <?php $input('smtp_host', 'Serveur SMTP', ['placeholder' => 'mail.votre-domaine.com']) ?>
            <?php $input('smtp_port', 'Port', ['type' => 'number', 'placeholder' => '587']) ?>
        </div>
        <div class="field-row">
            <?php $input('smtp_user', 'Utilisateur SMTP', ['attrs' => 'autocomplete="off"']) ?>
            <?php $input('smtp_pass', 'Mot de passe SMTP', ['type' => 'password', 'attrs' => 'autocomplete="new-password"']) ?>
        </div>
        <?php $input('smtp_secure', 'Chiffrement', ['type' => 'select', 'options' => ['tls' => 'STARTTLS (port 587)', 'ssl' => 'SSL (port 465)', '' => 'Aucun']]) ?>

    <?php elseif ($tab === 'seo'): ?>
        <?php $input('meta_title', 'Titre de la page d’accueil (Google)', ['placeholder' => setting('shop_name') . ' — ' . setting('shop_tagline')]) ?>
        <?php $input('meta_description', 'Description (Google)', ['type' => 'textarea', 'rows' => 2]) ?>
        <div class="field-row">
            <?php $input('google_analytics', 'Google Analytics (ID de mesure)', ['placeholder' => 'G-XXXXXXXXXX']) ?>
            <?php $input('facebook_pixel', 'Pixel Meta (Facebook)', ['placeholder' => '123456789012345']) ?>
        </div>
        <p class="hint">Plan du site à déclarer dans Google Search Console : <code><?= e(abs_url('/sitemap.xml')) ?></code></p>
    <?php endif ?>

    <?php foreach (array_unique($fields) as $f): ?><input type="hidden" name="fields[]" value="<?= e($f) ?>"><?php endforeach ?>
    <div class="form-footer"><button class="btn btn-primary" type="submit">Enregistrer</button></div>
</form>
