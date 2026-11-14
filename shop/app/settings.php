<?php
declare(strict_types=1);

/** Storefront texts the merchant writes; each can be overridden per language (hero_title_ar, …). */
const TRANSLATABLE_SETTINGS = ['shop_tagline', 'announcement', 'hero_title', 'hero_subtitle', 'hero_cta'];

/** Storefront themes: key => label shown in the admin. */
const SHOP_THEMES = ['classic' => 'Classique', 'luxe' => 'Luxe (premium)'];

function setting_defaults(): array
{
    $perLanguage = [];
    foreach (TRANSLATABLE_SETTINGS as $key) {
        foreach (['fr', 'ar', 'en'] as $l) {
            $perLanguage[$key . '_' . $l] = '';
        }
    }
    return $perLanguage + [
        // Identité
        'shop_name' => 'Ma Boutique',
        'shop_tagline' => 'Des produits choisis avec soin, livrés chez vous.',
        'shop_email' => '',
        'shop_phone' => '',
        'shop_address' => '',
        'whatsapp' => '',
        'logo' => '',
        'favicon' => '',
        'facebook' => '',
        'instagram' => '',
        'tiktok' => '',
        'footer_text' => '',
        'legal_name' => '',
        'tax_id' => '',

        // Apparence
        'theme' => 'classic',
        'brand_color' => '#0f766e',
        'announcement' => 'Livraison offerte dès 150 DT d’achat',
        'hero_title' => 'La qualité, sans compromis.',
        'hero_subtitle' => 'Découvrez notre sélection de produits, livrés rapidement partout dans le pays.',
        'hero_cta' => 'Découvrir la boutique',
        'hero_image' => '',
        'products_per_page' => '12',

        // Langue & devise
        'default_locale' => 'fr',
        'locales' => 'fr,ar,en',
        'currency_code' => 'TND',
        'currency_symbol' => 'DT',
        'currency_decimals' => '3',
        'currency_position' => 'after',
        'default_country' => 'Tunisie',

        // Livraison & commandes
        'shipping_fee' => '7000',
        'free_shipping_threshold' => '150000',
        'delivery_delay' => '24 à 72 h',
        'order_prefix' => 'CMD',
        'low_stock_threshold' => '3',
        'require_postal_code' => '0',

        // Paiements
        'cod_enabled' => '1',
        'cod_fee' => '0',
        'stripe_enabled' => '0',
        'stripe_secret_key' => '',
        'stripe_webhook_secret' => '',
        'stripe_currency' => 'eur',
        'stripe_rate' => '1',
        'konnect_enabled' => '0',
        'konnect_api_key' => '',
        'konnect_wallet_id' => '',
        'konnect_sandbox' => '1',
        'flouci_enabled' => '0',
        'flouci_app_token' => '',
        'flouci_app_secret' => '',

        // E-mails
        'mail_from' => '',
        'notify_email' => '',
        'smtp_host' => '',
        'smtp_port' => '587',
        'smtp_user' => '',
        'smtp_pass' => '',
        'smtp_secure' => 'tls',

        // SEO
        'meta_title' => '',
        'meta_description' => '',
        'google_analytics' => '',
        'facebook_pixel' => '',
    ];
}

/** Settings that are never echoed back into admin forms. */
function secret_settings(): array
{
    return ['stripe_secret_key', 'stripe_webhook_secret', 'konnect_api_key', 'flouci_app_secret', 'smtp_pass'];
}

function settings(): array
{
    if (!isset($GLOBALS['_settings'])) {
        $rows = [];
        try {
            foreach (all('SELECT name, value FROM settings') as $r) {
                $rows[$r['name']] = $r['value'];
            }
        } catch (PDOException) {
            // Database not reachable yet (installer) — defaults only.
        }
        $GLOBALS['_settings'] = $rows + setting_defaults();
    }
    return $GLOBALS['_settings'];
}

function setting(string $key, mixed $default = null): mixed
{
    $s = settings();
    return array_key_exists($key, $s) && $s[$key] !== null ? $s[$key] : $default;
}

function save_settings(array $values): void
{
    $existing = array_column(all('SELECT name FROM settings'), 'name', 'name');
    foreach ($values as $k => $v) {
        $v = is_bool($v) ? (string) (int) $v : (string) $v;
        if (isset($existing[$k])) {
            q('UPDATE settings SET value = :v WHERE name = :k', ['v' => $v, 'k' => $k]);
        } else {
            q('INSERT INTO settings (name, value) VALUES (:k, :v)', ['k' => $k, 'v' => $v]);
        }
    }
    unset($GLOBALS['_settings']);
}

/**
 * A merchant text in the visitor's language: the per-language override when set, otherwise the
 * translated built-in default while the merchant has not changed it, otherwise the text as written.
 */
function shop_text(string $key): string
{
    $loc = locale();
    if (($override = trim((string) setting($key . '_' . $loc, ''))) !== '') {
        return $override;
    }
    $value = (string) setting($key, '');
    $untouched = $value === (setting_defaults()[$key] ?? null)
        || ($key === 'announcement' && preg_match('/^Livraison offerte dès /u', $value));
    if (!$untouched || $loc === 'fr') {
        return $value;
    }
    return __('default.' . $key, ['amount' => format_money((int) setting('free_shipping_threshold', 0), true)]);
}

/** Active storefront theme (falls back to "classic" for unknown values). */
function shop_theme(): string
{
    $t = (string) setting('theme', 'classic');
    return isset(SHOP_THEMES[$t]) ? $t : 'classic';
}
