<?php
declare(strict_types=1);

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function config(string $key, mixed $default = null): mixed
{
    $value = $GLOBALS['config'] ?? [];
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['SERVER_PORT'] ?? '') === '443'
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

/** Path of the shop root relative to the domain, without trailing slash ("" or "/boutique"). */
function base_path(): string
{
    static $base = null;
    if ($base === null) {
        $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
        $dir = rtrim(dirname($script), '/');
        // The installer lives one level below the shop root.
        if (str_ends_with($dir, '/install')) {
            $dir = substr($dir, 0, -strlen('/install'));
        }
        $base = $dir === '.' ? '' : $dir;
    }
    return $base;
}

function url(string $path = '/', array $query = []): string
{
    $path = '/' . ltrim($path, '/');
    if (config('pretty_urls', true)) {
        $u = base_path() . $path;
    } else {
        $u = base_path() . '/index.php';
        $query = ['r' => $path] + $query;
    }
    $query = array_filter($query, fn($v) => $v !== null && $v !== '');
    return $u . ($query ? '?' . http_build_query($query) : '');
}

/** Scheme + host + base path of the shop, from the configured base_url when set. */
function site_root(): string
{
    $origin = rtrim((string) config('base_url', ''), '/');
    if ($origin === '') {
        $origin = (is_https() ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . base_path();
    }
    return $origin;
}

/** Absolute URL, used for payment callbacks, e-mails and SEO tags. */
function abs_url(string $path = '/', array $query = []): string
{
    return site_root() . substr(url($path, $query), strlen(base_path()));
}

/** Absolute URL of a stored image (for e-mails and social previews). */
function abs_media(?string $path): string
{
    if ($path && preg_match('#^https?://#', $path)) {
        return $path;
    }
    return site_root() . '/' . ltrim($path ?: 'assets/img/placeholder.svg', '/');
}

function asset(string $path): string
{
    $file = ROOT_DIR . '/' . ltrim($path, '/');
    $v = is_file($file) ? '?v=' . filemtime($file) : '';
    return base_path() . '/' . ltrim($path, '/') . $v;
}

/** Public URL of a stored image (upload or bundled demo asset). */
function media(?string $path): string
{
    if (!$path) {
        return base_path() . '/assets/img/placeholder.svg';
    }
    if (preg_match('#^https?://#', $path)) {
        return $path;
    }
    return base_path() . '/' . ltrim($path, '/');
}

function redirect(string $to, int $status = 302): never
{
    header('Location: ' . $to, true, $status);
    exit;
}

function back(string $fallback = '/'): never
{
    $ref = $_SERVER['HTTP_REFERER'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($ref && parse_url($ref, PHP_URL_HOST) === $host) {
        redirect($ref);
    }
    redirect(url($fallback));
}

function abort(int $status = 404): never
{
    http_response_code($status);
    if (str_starts_with(current_path(), '/admin')) {
        exit($status === 404 ? 'Page introuvable' : 'Accès refusé');
    }
    render('shop/404', ['title' => __('not_found.title')]);
    exit;
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function wants_json(): bool
{
    return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
        || ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function is_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function input(string $key, mixed $default = ''): mixed
{
    $v = $_POST[$key] ?? $_GET[$key] ?? $default;
    return is_string($v) ? trim($v) : $v;
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function random_token(int $bytes = 16): string
{
    return bin2hex(random_bytes($bytes));
}

// ---------------------------------------------------------------- CSRF / flash

function csrf_token(): string
{
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = random_token(32);
    }
    return $_SESSION['_csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function csrf_check(): void
{
    $sent = $_POST['_csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($sent) || !hash_equals(csrf_token(), $sent)) {
        http_response_code(419);
        if (wants_json()) {
            json_response(['ok' => false, 'error' => __('errors.session_expired')], 419);
        }
        flash('error', __('errors.session_expired'));
        back();
    }
}

function flash(string $type, string $message): void
{
    $_SESSION['_flash'][] = ['type' => $type, 'message' => $message];
}

function take_flashes(): array
{
    $f = $_SESSION['_flash'] ?? [];
    unset($_SESSION['_flash']);
    return $f;
}

function remember_input(array $data): void
{
    unset($data['_csrf'], $data['password'], $data['password_confirm']);
    $_SESSION['_old'] = $data;
}

function old(string $key, mixed $default = ''): mixed
{
    return $_SESSION['_old'][$key] ?? $default;
}

function forget_input(): void
{
    unset($_SESSION['_old']);
}

// ---------------------------------------------------------------- views

function view_path(string $view): string
{
    return APP_DIR . '/views/' . $view . '.php';
}

function partial(string $view, array $data = []): void
{
    extract($data, EXTR_SKIP);
    require view_path($view);
}

/** Renders a view inside its section layout (shop or admin). */
function render(string $view, array $data = [], ?string $layout = null): void
{
    $layout ??= str_starts_with($view, 'admin/') ? 'admin/layout' : 'shop/layout';
    extract($data, EXTR_SKIP);
    ob_start();
    require view_path($view);
    $content = ob_get_clean();
    require view_path($layout);
    forget_input();
}

// ---------------------------------------------------------------- money

function currency_decimals(): int
{
    return (int) setting('currency_decimals', 3);
}

function format_money(int|float|null $minor): string
{
    $dec = currency_decimals();
    $amount = ((int) $minor) / (10 ** $dec);
    $num = number_format($amount, $dec, ',', "\u{202F}");
    $sym = setting('currency_symbol', 'DT');
    return setting('currency_position', 'after') === 'before' ? $sym . "\u{00A0}" . $num : $num . "\u{00A0}" . $sym;
}

/** "49,900" / "49.9" / "1 200" → integer amount in minor units. */
function parse_money(string|int|float|null $value): int
{
    $s = str_replace([' ', "\u{202F}", "\u{00A0}"], '', (string) $value);
    $s = str_replace(',', '.', $s);
    if ($s === '' || !is_numeric($s)) {
        return 0;
    }
    return (int) round(((float) $s) * (10 ** currency_decimals()));
}

/** Integer minor units → plain decimal string for form inputs. */
function money_input(int|null $minor): string
{
    if ($minor === null) {
        return '';
    }
    $dec = currency_decimals();
    return number_format($minor / (10 ** $dec), $dec, '.', '');
}

// ---------------------------------------------------------------- strings

function slugify(string $text): string
{
    $map = ['à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a', 'ç' => 'c', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'î' => 'i', 'ï' => 'i', 'í' => 'i', 'ô' => 'o', 'ö' => 'o', 'ó' => 'o', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ú' => 'u', 'ÿ' => 'y', 'ñ' => 'n', 'œ' => 'oe', 'æ' => 'ae', 'ß' => 'ss'];
    $text = strtr(mb_strtolower($text), $map);
    if (function_exists('transliterator_transliterate')) {
        $t = transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $text);
        if (is_string($t)) {
            $text = $t;
        }
    }
    $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
    $text = trim($text, '-');
    return $text !== '' ? substr($text, 0, 120) : 'item-' . substr(random_token(3), 0, 6);
}

function str_limit(string $text, int $length = 160): string
{
    $text = trim(preg_replace('/\s+/u', ' ', strip_tags($text)) ?? '');
    return mb_strlen($text) > $length ? rtrim(mb_substr($text, 0, $length - 1)) . '…' : $text;
}

/**
 * Minimal, safe text formatting for descriptions and pages (everything is escaped first):
 * blank line = new paragraph, "## Titre", "### Sous-titre", "- élément de liste", **gras**, [lien](https://…).
 */
function rich_text(string $text): string
{
    $inline = function (string $line): string {
        $line = e($line);
        $line = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $line) ?? $line;
        return preg_replace_callback(
            '/\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:|tel:)[^\s)]+)\)/u',
            fn($m) => '<a href="' . $m[2] . '"' . (str_starts_with($m[2], 'http') ? ' rel="noopener" target="_blank"' : '') . '>' . $m[1] . '</a>',
            $line
        ) ?? $line;
    };
    $out = '';
    foreach (preg_split('/\n\s*\n/', trim(str_replace("\r", '', $text))) ?: [] as $block) {
        $lines = explode("\n", $block);
        if (preg_match('/^(#{2,3})\s+(.*)$/', $lines[0], $m)) {
            $tag = strlen($m[1]) === 2 ? 'h2' : 'h3';
            $out .= "<$tag>" . $inline($m[2]) . "</$tag>";
            array_shift($lines);
            if (!$lines) {
                continue;
            }
        }
        $isList = count(array_filter($lines, fn($l) => preg_match('/^\s*[-•*]\s+/', $l))) === count($lines);
        if ($isList) {
            $out .= '<ul>' . implode('', array_map(fn($l) => '<li>' . $inline((string) preg_replace('/^\s*[-•*]\s+/', '', $l)) . '</li>', $lines)) . '</ul>';
        } else {
            $out .= '<p>' . implode('<br>', array_map($inline, $lines)) . '</p>';
        }
    }
    return $out;
}

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function valid_phone(string $phone): bool
{
    return (bool) preg_match('/^\+?[0-9 .\-()]{8,20}$/', $phone);
}

// ---------------------------------------------------------------- pagination

function paginate(int $total, int $perPage, int $page): array
{
    $pages = max(1, (int) ceil($total / max(1, $perPage)));
    $page = min(max(1, $page), $pages);
    return ['total' => $total, 'per_page' => $perPage, 'page' => $page, 'pages' => $pages, 'offset' => ($page - 1) * $perPage];
}

function page_url(int $page): string
{
    $q = $_GET;
    unset($q['r']);
    $q['page'] = $page > 1 ? $page : null;
    return url(current_path(), $q);
}

// ---------------------------------------------------------------- uploads

/**
 * Stores an uploaded image under uploads/YYYY/MM, resizing large pictures when GD is available.
 * Returns the relative path, or null when nothing was uploaded. Throws on invalid files.
 */
function store_upload(array $file, int $maxWidth = 1600): ?string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('Envoi du fichier impossible (code ' . $file['error'] . ').');
    }
    if ($file['size'] > 8 * 1024 * 1024) {
        throw new RuntimeException('Image trop lourde (8 Mo maximum).');
    }
    $info = @getimagesize($file['tmp_name']);
    $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'];
    if (!$info || !isset($types[$info[2]])) {
        throw new RuntimeException('Format non pris en charge (JPG, PNG, WebP ou GIF).');
    }
    $ext = $types[$info[2]];
    $dir = date('Y/m');
    if (!is_dir(UPLOAD_DIR . '/' . $dir) && !mkdir(UPLOAD_DIR . '/' . $dir, 0755, true)) {
        throw new RuntimeException('Le dossier uploads/ n’est pas accessible en écriture.');
    }
    $rel = 'uploads/' . $dir . '/' . random_token(8) . '.' . $ext;
    $dest = ROOT_DIR . '/' . $rel;

    if ($info[0] > $maxWidth && $ext !== 'gif' && function_exists('imagecreatetruecolor')) {
        $src = match ($ext) {
            'jpg' => @imagecreatefromjpeg($file['tmp_name']),
            'png' => @imagecreatefrompng($file['tmp_name']),
            'webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file['tmp_name']) : false,
        };
        if ($src) {
            $h = (int) round($info[1] * $maxWidth / $info[0]);
            $dst = imagecreatetruecolor($maxWidth, $h);
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $maxWidth, $h, $info[0], $info[1]);
            $ok = match ($ext) {
                'jpg' => imagejpeg($dst, $dest, 85),
                'png' => imagepng($dst, $dest, 8),
                'webp' => imagewebp($dst, $dest, 85),
            };
            if ($ok) {
                return $rel;
            }
        }
    }
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('Impossible d’enregistrer le fichier.');
    }
    return $rel;
}

/** Normalises the $_FILES structure of a multiple upload field into a list of files. */
function uploaded_files(string $field): array
{
    $f = $_FILES[$field] ?? null;
    if (!$f) {
        return [];
    }
    if (!is_array($f['name'])) {
        return [$f];
    }
    $out = [];
    foreach ($f['name'] as $i => $name) {
        $out[] = ['name' => $name, 'type' => $f['type'][$i], 'tmp_name' => $f['tmp_name'][$i], 'error' => $f['error'][$i], 'size' => $f['size'][$i]];
    }
    return $out;
}

function delete_upload(?string $path): void
{
    if ($path && str_starts_with($path, 'uploads/') && !str_contains($path, '..')) {
        @unlink(ROOT_DIR . '/' . $path);
    }
}

// ---------------------------------------------------------------- color

/** Returns black or white, whichever reads best on the given hex background (WCAG relative luminance). */
function contrast_text(string $hex): string
{
    [$r, $g, $b] = hex_rgb($hex);
    $lin = fn($c) => ($c /= 255) <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
    $l = 0.2126 * $lin($r) + 0.7152 * $lin($g) + 0.0722 * $lin($b);
    return $l > 0.179 ? '#111111' : '#ffffff';
}

function hex_rgb(string $hex): array
{
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    if (!preg_match('/^[0-9a-f]{6}$/i', $hex)) {
        $hex = '0f766e';
    }
    return [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
}

/** Mixes a hex color with black (amount < 0) or white (amount > 0). */
function shade(string $hex, float $amount): string
{
    [$r, $g, $b] = hex_rgb($hex);
    $t = $amount < 0 ? 0 : 255;
    $p = abs($amount);
    $mix = fn($c) => (int) round(($t - $c) * $p + $c);
    return sprintf('#%02x%02x%02x', $mix($r), $mix($g), $mix($b));
}
