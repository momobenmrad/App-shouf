<?php
declare(strict_types=1);
// Shared helpers for the personalised prospect demos (demo/<name>/seed.php), run from the shop root
// after bin/install.php. Each demo's illustrations live in demo/<name>/assets and are served from
// assets/demo-<name>/ (copied there by demo/Dockerfile or demo/build.sh).
define('ROOT_DIR', getcwd());
define('APP_DIR', ROOT_DIR . '/app');
define('STORAGE_DIR', ROOT_DIR . '/storage');
define('UPLOAD_DIR', ROOT_DIR . '/uploads');
define('SHOP_VERSION', '1.0.0');
$GLOBALS['config'] = require STORAGE_DIR . '/config.php';
require APP_DIR . '/helpers.php';
require APP_DIR . '/db.php';
require APP_DIR . '/settings.php';

/** Writes settings (string values; money in minor units, i.e. millimes for TND). */
function demo_settings(array $values): void
{
    foreach ($values as $k => $v) {
        q('DELETE FROM settings WHERE name = :n', ['n' => $k]);
        insert('settings', ['name' => $k, 'value' => (string) $v]);
    }
}

/**
 * Categories ['slug' => [name, description]] and products, each
 * [slug, name, category slug, price DT, compare price DT|null, stock|null, featured, short, description,
 *  option label|null, variants [[name, price minor|null, stock]], sales count].
 * Every product uses assets/demo-<demo>/<slug>-a.svg and -b.svg.
 */
function demo_catalog(string $demo, array $categories, array $products): void
{
    $catIds = [];
    $pos = 0;
    foreach ($categories as $slug => [$name, $desc]) {
        $catIds[$slug] = insert('categories', ['name' => $name, 'slug' => $slug, 'description' => $desc, 'position' => $pos++, 'is_active' => 1, 'created_at' => now()]);
    }
    $prefix = strtoupper(substr($demo, 0, 3));
    foreach ($products as $i => [$slug, $name, $cat, $price, $compare, $stock, $featured, $short, $desc, $opt, $variants, $sold]) {
        $ts = date('Y-m-d H:i:s', strtotime('-' . (30 - $i * 3) . ' days'));
        $pid = insert('products', [
            'category_id' => $catIds[$cat], 'name' => $name, 'slug' => $slug,
            'sku' => $prefix . '-' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
            'short_description' => $short, 'description' => $desc,
            'price' => (int) round($price * 1000), 'compare_price' => $compare ? (int) round($compare * 1000) : null, 'stock' => $stock,
            'option_label' => $opt, 'is_active' => 1, 'is_featured' => $featured ? 1 : 0, 'sales_count' => $sold,
            'created_at' => $ts, 'updated_at' => $ts,
        ]);
        foreach (['a', 'b'] as $j => $suf) {
            insert('product_images', ['product_id' => $pid, 'path' => "assets/demo-$demo/$slug-$suf.svg", 'alt' => $name, 'position' => $j]);
        }
        foreach ($variants as $vi => [$vname, $vprice, $vstock]) {
            insert('product_variants', ['product_id' => $pid, 'name' => $vname, 'price' => $vprice, 'stock' => $vstock, 'position' => $vi]);
        }
    }
}

/**
 * Sample orders so the dashboard chart and lists are not empty:
 * [days ago, customer, city, product slug, qty, status, payment method, payment status].
 */
function demo_orders(string $prefix, array $samples, int $freeShippingMinor, int $shippingMinor): void
{
    $bySlug = [];
    foreach (all('SELECT id, slug, name, sku, price FROM products') as $p) {
        $bySlug[$p['slug']] = $p;
    }
    foreach ($samples as $i => [$daysAgo, $name, $city, $slug, $qty, $status, $method, $payStatus]) {
        $p = $bySlug[$slug];
        $ts = date('Y-m-d H:i:s', strtotime("-$daysAgo days 10:00") + $i * 1800);
        $subtotal = (int) $p['price'] * $qty;
        $shipping = $subtotal >= $freeShippingMinor ? 0 : $shippingMinor;
        $oid = insert('orders', [
            'number' => $prefix . '-' . (10001 + $i), 'token' => bin2hex(random_bytes(8)), 'status' => $status,
            'payment_method' => $method, 'payment_status' => $payStatus,
            'customer_name' => $name, 'email' => 'client' . ($i + 1) . '@exemple.tn', 'phone' => '+216 2' . $i . ' 123 456',
            'address' => ($i + 3) . ' rue de la République', 'city' => $city, 'country' => 'Tunisie',
            'subtotal' => $subtotal, 'shipping' => $shipping, 'total' => $subtotal + $shipping, 'locale' => 'fr',
            'paid_at' => $payStatus === 'paid' ? $ts : null, 'created_at' => $ts, 'updated_at' => $ts,
        ]);
        insert('order_items', [
            'order_id' => $oid, 'product_id' => $p['id'], 'name' => $p['name'], 'sku' => $p['sku'],
            'unit_price' => (int) $p['price'], 'quantity' => $qty, 'total' => $subtotal,
        ]);
    }
}
