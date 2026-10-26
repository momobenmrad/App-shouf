<?php
declare(strict_types=1);
// Seeds the personalised "Blue Whale Gems" demo: settings, catalogue (illustrations in
// assets/bwg) and a few sample orders for the dashboard. Run from the shop root after bin/install.php.
define('ROOT_DIR', getcwd());
define('APP_DIR', ROOT_DIR . '/app');
define('STORAGE_DIR', ROOT_DIR . '/storage');
define('UPLOAD_DIR', ROOT_DIR . '/uploads');
define('SHOP_VERSION', '1.0.0');
$GLOBALS['config'] = require STORAGE_DIR . '/config.php';
require APP_DIR . '/helpers.php';
require APP_DIR . '/db.php';
require APP_DIR . '/settings.php';

$set = [
    'brand_color' => '#1d4ed8',
    'shop_tagline' => 'Bijoux et pierres précieuses certifiés, livrés partout en Tunisie.',
    'announcement' => 'Livraison offerte dès 300 DT · Paiement à la livraison',
    'hero_title' => 'L’éclat des pierres, sans compromis.',
    'hero_subtitle' => 'Saphirs, émeraudes, rubis : bijoux en or et argent, pierres certifiées et emballage cadeau.',
    'hero_cta' => 'Découvrir la collection',
    'hero_title_ar' => 'بريق الأحجار الكريمة',
    'hero_subtitle_ar' => 'ياقوت، زمرد، ألماس… مجوهرات ذهب و فضة، أحجار مضمونة و تغليف هدية.',
    'hero_cta_ar' => 'اكتشف المجموعة',
    'announcement_ar' => 'توصيل مجاني بداية من 300 د.ت · الخلاص عند الاستلام',
    'shop_tagline_ar' => 'مجوهرات و أحجار كريمة مضمونة، توصيل لكل تونس.',
    'free_shipping_threshold' => '300000',
    'shipping_fee' => '8000',
    'whatsapp' => '21655733020',
    'instagram' => 'https://www.instagram.com/',
    'shop_email' => 'contact@bluewhalegems.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '2',
    'order_prefix' => 'BWG',
];
foreach ($set as $k => $v) {
    q('DELETE FROM settings WHERE name = :n', ['n' => $k]);
    insert('settings', ['name' => $k, 'value' => $v]);
}

$cats = [
    'bagues' => ['Bagues', 'Bagues serties en or et argent.'],
    'colliers' => ['Colliers', 'Pendentifs et colliers en pierres fines.'],
    'boucles' => ['Boucles d’oreilles', 'Puces et pendantes.'],
    'bracelets' => ['Bracelets', 'Joncs et rivières de pierres.'],
    'pierres' => ['Pierres précieuses', 'Pierres sur papier, certifiées.'],
];
$catIds = [];
$pos = 0;
foreach ($cats as $slug => [$name, $desc]) {
    $catIds[$slug] = insert('categories', ['name' => $name, 'slug' => $slug, 'description' => $desc, 'position' => $pos++, 'is_active' => 1, 'created_at' => now()]);
}
$dt = fn(float $v) => (int) round($v * 1000);
$P = [
    ['bague-saphir-royal', 'Bague Saphir Royal', 'bagues', 890, 1050, null, 1, 'Saphir bleu de Ceylan taille brillant, monture or 18 carats.', "Un saphir d’un bleu profond, serti à griffes sur un anneau en or jaune 18 carats.\n\n- Pierre : saphir naturel 1,2 ct\n- Or 18 carats poinçonné\n- Certificat d’authenticité fourni\n- Écrin cadeau offert", 'Taille', [['52', null, 2], ['54', null, 3], ['56', null, 1], ['58', null, 0]], 14],
    ['bague-emeraude', 'Bague Émeraude Argent', 'bagues', 420, null, null, 0, 'Émeraude de Colombie sur argent 925 rhodié.', "Une émeraude d’un vert intense sertie sur argent 925 rhodié.\n\n- Émeraude naturelle 0,8 ct\n- Argent 925\n- Certificat fourni", 'Taille', [['52', null, 4], ['54', null, 5], ['56', null, 3]], 9],
    ['collier-aigue-marine', 'Collier Aigue-marine', 'colliers', 360, 420, 6, 1, 'Pendentif aigue-marine sur chaîne argent 45 cm.', "Le bleu clair de l’aigue-marine, la pierre des océans.\n\n- Aigue-marine naturelle 2 ct\n- Chaîne argent 925, 45 cm\n- Fermoir mousqueton", null, [], 11],
    ['collier-rubis', 'Collier Rubis Or', 'colliers', 1290, null, 2, 1, 'Rubis de Birmanie sur chaîne or 18 carats.', "Un rubis rouge sang sur chaîne fine en or 18 carats.\n\n- Rubis naturel 1 ct\n- Or 18 carats\n- Certificat d’authenticité", null, [], 4],
    ['boucles-amethyste', 'Boucles Améthyste', 'boucles', 240, null, 9, 0, 'Pendantes améthyste, argent 925.', "Deux améthystes violettes montées en pendantes légères.\n\n- Améthystes naturelles 2 × 1 ct\n- Argent 925", null, [], 7],
    ['boucles-topaze', 'Boucles Topaze Impériale', 'boucles', 520, 590, 4, 0, 'Topazes dorées sur or 18 carats.', "La chaleur dorée de la topaze impériale.\n\n- Topazes naturelles 2 × 1,5 ct\n- Or 18 carats", null, [], 5],
    ['bracelet-saphirs', 'Bracelet Rivière de Saphirs', 'bracelets', 1150, null, 3, 1, 'Sept saphirs bleus sur jonc argent.', "Une rivière de sept saphirs bleus sertis sur un jonc en argent 925.\n\n- 7 saphirs naturels, 2,1 ct au total\n- Argent 925 rhodié\n- Taille ajustable", null, [], 6],
    ['saphir-brut-2ct', 'Saphir bleu 2 ct (pierre seule)', 'pierres', 1600, null, 2, 0, 'Saphir naturel non chauffé, certifié laboratoire.', "Pour créer votre bijou sur mesure.\n\n- Saphir naturel 2,03 ct\n- Couleur : bleu royal\n- Certificat de laboratoire", null, [], 2],
    ['emeraude-1ct', 'Émeraude 1 ct (pierre seule)', 'pierres', 980, null, 1, 0, 'Émeraude de Colombie, huilage mineur, certifiée.', "- Émeraude naturelle 1,05 ct\n- Origine : Colombie\n- Certificat de laboratoire", null, [], 3],
];
$day = 0;
foreach ($P as [$slug, $name, $cat, $price, $compare, $stock, $featured, $short, $desc, $opt, $variants, $sold]) {
    $day++;
    $ts = date('Y-m-d H:i:s', strtotime('-' . (30 - $day * 3) . ' days'));
    $pid = insert('products', [
        'category_id' => $catIds[$cat], 'name' => $name, 'slug' => $slug,
        'sku' => 'BWG-' . str_pad((string) $day, 3, '0', STR_PAD_LEFT),
        'short_description' => $short, 'description' => $desc,
        'price' => $dt($price), 'compare_price' => $compare ? $dt($compare) : null, 'stock' => $stock,
        'option_label' => $opt, 'is_active' => 1, 'is_featured' => $featured, 'sales_count' => $sold,
        'created_at' => $ts, 'updated_at' => $ts,
    ]);
    foreach (['a', 'b'] as $i => $suf) {
        insert('product_images', ['product_id' => $pid, 'path' => "assets/bwg/$slug-$suf.svg", 'alt' => $name, 'position' => $i]);
    }
    foreach ($variants as $vi => [$vn, $vp, $vs]) {
        insert('product_variants', ['product_id' => $pid, 'name' => $vn, 'price' => $vp, 'stock' => $vs, 'position' => $vi]);
    }
}
insert('coupons', ['code' => 'BLUEWHALE10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
// Sample orders over the last days so the dashboard chart and lists are not empty.
$byslug = [];
foreach (all('SELECT id, slug, name, sku, price FROM products') as $p) {
    $byslug[$p['slug']] = $p;
}
$samples = [
    [9, 'Yasmine Ben Salah', 'Tunis', 'bague-saphir-royal', 1, 'delivered', 'cod', 'paid'],
    [7, 'Mehdi Trabelsi', 'Sfax', 'collier-aigue-marine', 1, 'delivered', 'konnect', 'paid'],
    [5, 'Sarra Gharbi', 'Sousse', 'boucles-amethyste', 2, 'shipped', 'cod', 'unpaid'],
    [3, 'Amine Jaziri', 'Nabeul', 'bracelet-saphirs', 1, 'confirmed', 'flouci', 'paid'],
    [1, 'Ines Mansour', 'Bizerte', 'boucles-topaze', 1, 'pending', 'cod', 'unpaid'],
    [0, 'Rania Ayari', 'Monastir', 'bague-emeraude', 1, 'pending', 'cod', 'unpaid'],
];
foreach ($samples as $i => [$daysAgo, $name, $city, $slug, $qty, $status, $method, $payStatus]) {
    $p = $byslug[$slug];
    $ts = date('Y-m-d H:i:s', strtotime("-$daysAgo days 10:00") + $i * 1800);
    $subtotal = (int) $p['price'] * $qty;
    $shipping = $subtotal >= 300000 ? 0 : 8000;
    $oid = insert('orders', [
        'number' => 'BWG-' . (10001 + $i), 'token' => bin2hex(random_bytes(8)), 'status' => $status,
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
echo "Blue Whale Gems demo seeded\n";
