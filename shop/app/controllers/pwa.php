<?php
declare(strict_types=1);

// Installable app (PWA): web manifest, generated icons and a cautious service worker.
// Customers can add the shop to their home screen; it then opens full screen like a native app.

function pwa_manifest(): void
{
    $name = (string) setting('shop_name');
    $brand = (string) setting('brand_color', '#0f766e');
    $base = base_path();
    header('Content-Type: application/manifest+json; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo json_encode([
        'name' => $name,
        'short_name' => mb_substr($name, 0, 12),
        'description' => shop_text('shop_tagline'),
        'lang' => locale(),
        'dir' => text_dir(),
        'start_url' => $base . '/?source=app',
        'scope' => $base . '/',
        'display' => 'standalone',
        'orientation' => 'portrait',
        'background_color' => '#fbfaf8',
        'theme_color' => $brand,
        'icons' => [
            ['src' => url('/app-icon-192.png'), 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any'],
            ['src' => url('/app-icon-512.png'), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'],
            ['src' => url('/app-icon-512.png', ['maskable' => 1]), 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
        ],
        'shortcuts' => [
            ['name' => __('nav.shop'), 'url' => url('/boutique')],
            ['name' => __('nav.cart'), 'url' => url('/panier')],
            ['name' => __('nav.track'), 'url' => url('/suivi')],
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * App icon generated with GD: the shop logo on white when a raster logo is set, otherwise a white
 * shopping bag on the brand color. Maskable icons keep the artwork inside the central safe zone.
 */
function pwa_icon(string $size): void
{
    $s = (int) $size === 512 ? 512 : 192;
    $maskable = !empty($_GET['maskable']);
    $etag = '"' . md5($s . (int) $maskable . setting('brand_color') . setting('logo') . SHOP_VERSION) . '"';
    header('Cache-Control: public, max-age=86400');
    header('ETag: ' . $etag);
    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
        http_response_code(304);
        return;
    }
    if (!function_exists('imagecreatetruecolor')) {
        redirect(asset('assets/img/favicon.svg'));
    }
    $im = imagecreatetruecolor($s, $s);
    [$r, $g, $b] = hex_rgb((string) setting('brand_color', '#0f766e'));
    $logo = (string) setting('logo');
    $logoFile = $logo !== '' ? ROOT_DIR . '/' . $logo : '';
    $src = null;
    if ($logoFile && is_file($logoFile) && ($info = @getimagesize($logoFile))) {
        $src = match ($info[2]) {
            IMAGETYPE_PNG => @imagecreatefrompng($logoFile),
            IMAGETYPE_JPEG => @imagecreatefromjpeg($logoFile),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($logoFile) : null,
            default => null,
        } ?: null;
    }
    $safe = $maskable ? 0.6 : 0.78; // share of the icon the artwork may use

    if ($src) {
        imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));
        $w = imagesx($src);
        $h = imagesy($src);
        $scale = min($s * $safe / $w, $s * $safe / $h);
        $dw = (int) round($w * $scale);
        $dh = (int) round($h * $scale);
        imagecopyresampled($im, $src, (int) (($s - $dw) / 2), (int) (($s - $dh) / 2), 0, 0, $dw, $dh, $w, $h);
    } else {
        // Drawn 4x larger then downsampled, which anti-aliases the shapes.
        $k = 4;
        $big = imagecreatetruecolor($s * $k, $s * $k);
        $bg = imagecolorallocate($big, $r, $g, $b);
        imagefill($big, 0, 0, $bg);
        $fg = contrast_text(sprintf('#%02x%02x%02x', $r, $g, $b)) === '#ffffff' ? imagecolorallocate($big, 255, 255, 255) : imagecolorallocate($big, 17, 17, 17);
        $u = $s * $k * $safe / 100; // drawing unit: the bag is 68 units wide, 84 tall
        $cx = $s * $k / 2;
        $top = $s * $k / 2 - 42 * $u;
        // Handle: a ring (outer ellipse minus inner ellipse); the body hides its lower half.
        imagefilledellipse($big, (int) $cx, (int) ($top + 24 * $u), (int) (40 * $u), (int) (44 * $u), $fg);
        imagefilledellipse($big, (int) $cx, (int) ($top + 24 * $u), (int) (26 * $u), (int) (30 * $u), $bg);
        imagefilledpolygon($big, [
            (int) ($cx - 34 * $u), (int) ($top + 24 * $u),
            (int) ($cx + 34 * $u), (int) ($top + 24 * $u),
            (int) ($cx + 29 * $u), (int) ($top + 84 * $u),
            (int) ($cx - 29 * $u), (int) ($top + 84 * $u),
        ], $fg);
        imagecopyresampled($im, $big, 0, 0, 0, 0, $s, $s, $s * $k, $s * $k);
    }
    header('Content-Type: image/png');
    imagepng($im, null, 9);
}

function pwa_service_worker(): void
{
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: no-cache');
    header('Service-Worker-Allowed: ' . base_path() . '/');
    $offline = json_encode([
        'title' => __('pwa.offline_title'),
        'text' => __('pwa.offline_text'),
        'retry' => __('pwa.retry'),
        'lang' => locale(),
        'dir' => text_dir(),
        'brand' => setting('brand_color', '#0f766e'),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
    $base = json_encode(base_path());
    $version = json_encode(SHOP_VERSION . '-' . substr(md5((string) filemtime(ROOT_DIR . '/assets/css/app.css') . filemtime(ROOT_DIR . '/assets/js/app.js')), 0, 8));
    echo <<<JS
// Service worker of the shop app. Only static files and images are cached; pages, cart,
// checkout, payments and admin always go to the network so prices and stock stay exact.
const VERSION = $version;
const BASE = $base;
const OFFLINE = $offline;
const STATIC_CACHE = 'shop-static-' + VERSION;

self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shop-static-') && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const offlinePage = () => new Response(
  '<!doctype html><html lang="' + OFFLINE.lang + '" dir="' + OFFLINE.dir + '"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' + OFFLINE.title + '</title>' +
  '<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fbfaf8;color:#1c1917">' +
  '<div style="text-align:center;padding:24px;max-width:340px"><div style="font-size:48px">📶</div><h1 style="font-size:22px">' + OFFLINE.title + '</h1>' +
  '<p style="color:#57534e">' + OFFLINE.text + '</p><button onclick="location.reload()" style="margin-top:8px;padding:12px 20px;border:0;border-radius:10px;background:' +
  OFFLINE.brand + ';color:#fff;font-weight:600;font-size:16px">' + OFFLINE.retry + '</button></div></body></html>',
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname.slice(BASE.length);

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(offlinePage));
    return;
  }
  // Static files and product images: serve from cache, refresh in the background.
  if (path.startsWith('/assets/') || path.startsWith('/uploads/') || path.startsWith('/app-icon-')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          const network = fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || network;
        })
      )
    );
  }
});
JS;
}
