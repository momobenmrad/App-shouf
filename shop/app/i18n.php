<?php
declare(strict_types=1);

const SUPPORTED_LOCALES = [
    'fr' => ['name' => 'Français', 'dir' => 'ltr', 'short' => 'FR'],
    'ar' => ['name' => 'العربية', 'dir' => 'rtl', 'short' => 'ع'],
    'en' => ['name' => 'English', 'dir' => 'ltr', 'short' => 'EN'],
];

function enabled_locales(): array
{
    $codes = array_filter(array_map('trim', explode(',', (string) setting('locales', 'fr'))));
    $codes = array_values(array_intersect($codes, array_keys(SUPPORTED_LOCALES)));
    return $codes ?: ['fr'];
}

function boot_locale(): void
{
    $enabled = enabled_locales();
    $requested = $_GET['lang'] ?? null;
    if (is_string($requested) && in_array($requested, $enabled, true)) {
        $_SESSION['locale'] = $requested;
    }
    $locale = $_SESSION['locale'] ?? setting('default_locale', 'fr');
    if (!in_array($locale, $enabled, true)) {
        $locale = $enabled[0];
    }
    $GLOBALS['_locale'] = $locale;
}

function locale(): string
{
    return $GLOBALS['_locale'] ?? 'fr';
}

function text_dir(): string
{
    return SUPPORTED_LOCALES[locale()]['dir'] ?? 'ltr';
}

function lang_strings(string $locale): array
{
    static $cache = [];
    if (!isset($cache[$locale])) {
        $file = APP_DIR . '/lang/' . $locale . '.php';
        $cache[$locale] = is_file($file) ? require $file : [];
    }
    return $cache[$locale];
}

/** Translates a key, falling back to French, with ":name" replacements. */
function __(string $key, array $replace = []): string
{
    $text = lang_strings(locale())[$key] ?? lang_strings('fr')[$key] ?? $key;
    foreach ($replace as $k => $v) {
        $text = str_replace(':' . $k, (string) $v, $text);
    }
    return $text;
}

function lang_url(string $locale): string
{
    $q = $_GET;
    unset($q['r']);
    $q['lang'] = $locale;
    return url(current_path(), $q);
}
