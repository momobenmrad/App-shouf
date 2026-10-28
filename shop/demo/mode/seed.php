<?php
declare(strict_types=1);
// Sector demo "Mode femme" of the Flownova demos page: fictional boutique "Yasmine Couture" (Luxe theme, bordeaux).
require __DIR__ . '/../lib.php';

demo_settings([
    'theme' => 'luxe',
    'brand_color' => '#9f1239',
    'shop_tagline' => 'Robes, abayas et ensembles choisis avec soin, livrés partout en Tunisie.',
    'announcement' => 'Livraison 7 DT · Échange gratuit sous 7 jours · Paiement à la livraison',
    'hero_title' => 'L’élégance, à votre taille.',
    'hero_subtitle' => 'Nouvelle collection automne : satin, lin et broderies, en tailles S à XL.',
    'hero_cta' => 'Voir la collection',
    'shop_tagline_ar' => 'فساتين، عبايات و أطقم مختارة بعناية، توصيل لكامل تونس.',
    'announcement_ar' => 'توصيل ب 7 د · تبديل مجاني خلال 7 أيام · الخلاص عند الاستلام',
    'hero_title_ar' => 'الأناقة على مقاسك',
    'hero_subtitle_ar' => 'كوليكسيون الخريف الجديدة : ساتان، كتان و تطريز، من S حتى XL.',
    'hero_cta_ar' => 'اكتشفي الكوليكسيون',
    'free_shipping_threshold' => '200000',
    'shipping_fee' => '7000',
    'shop_email' => 'contact@yasmine-couture.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '3',
    'order_prefix' => 'YAS',
]);

$sizes = fn (array $stock) => array_map(fn ($s, $n) => [$s, null, $n], ['S', 'M', 'L', 'XL'], $stock);
demo_catalog('mode', [
    'robes' => ['Robes', 'Satin, fleuries, de soirée.'],
    'abayas' => ['Abayas & kimonos', 'Brodées, fluides, en lin.'],
    'ensembles' => ['Ensembles', 'Tailleurs et sets assortis.'],
    'accessoires' => ['Sacs & foulards', 'Cuir et soie.'],
], [
    ['robe-satin-emeraude', 'Robe satin émeraude', 'robes', 149, 179, null, true, 'Robe longue en satin, ceinture dorée.', "La robe des grandes occasions.\n\n- Satin fluide, doublée\n- Ceinture dorée amovible\n- Longueur 140 cm", 'Taille', $sizes([3, 6, 4, 0]), 38],
    ['robe-longue-fleurie', 'Robe longue fleurie', 'robes', 119, null, null, true, 'Robe légère rose poudré, taille cintrée.', "- Viscose douce\n- Manches courtes\n- Longueur 135 cm", 'Taille', $sizes([5, 8, 6, 2]), 44],
    ['abaya-noire-brodee', 'Abaya noire brodée or', 'abayas', 189, 220, null, true, 'Abaya fluide, broderies dorées aux manches.', "- Crêpe de soie\n- Broderies faites main\n- Coupe ample", 'Taille', $sizes([2, 4, 4, 3]), 27],
    ['kimono-lin-sable', 'Kimono en lin sable', 'abayas', 129, null, null, false, 'Kimono ouvert en lin lavé, se porte sur tout.', "- 100 % lin\n- Taille unique ajustable", 'Taille', $sizes([4, 4, 3, 2]), 19],
    ['ensemble-lin-blanc', 'Ensemble lin blanc', 'ensembles', 139, null, null, false, 'Chemise + pantalon large en lin.', "- 100 % lin\n- Pantalon taille élastique", 'Taille', $sizes([3, 5, 5, 1]), 22],
    ['tailleur-rose-poudre', 'Tailleur rose poudré', 'ensembles', 169, 199, null, true, 'Veste et pantalon assortis, coupe droite.', "- Crêpe stretch\n- Veste doublée", 'Taille', $sizes([1, 3, 2, 0]), 15],
    ['sac-cuir-camel', 'Sac cuir camel', 'accessoires', 159, null, 7, false, 'Sac à main en cuir véritable, fermoir doré.', "- Cuir de vachette\n- Fait main à Tunis", null, [], 31],
    ['foulard-soie-imprime', 'Foulard en soie imprimé', 'accessoires', 59, null, 20, false, 'Carré de soie 90 × 90 cm.', "- Soie naturelle\n- Ourlets roulottés main", null, [], 48],
]);

insert('coupons', ['code' => 'YASMINE10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
demo_orders('YAS', [
    [9, 'Mariem Ben Ali', 'Tunis', 'robe-satin-emeraude', 1, 'delivered', 'cod', 'paid'],
    [7, 'Rim Trabelsi', 'Sfax', 'abaya-noire-brodee', 1, 'delivered', 'konnect', 'paid'],
    [5, 'Nour Chaabane', 'Sousse', 'robe-longue-fleurie', 2, 'shipped', 'cod', 'unpaid'],
    [3, 'Amira Jlassi', 'Monastir', 'tailleur-rose-poudre', 1, 'confirmed', 'flouci', 'paid'],
    [1, 'Sarra Gharbi', 'Bizerte', 'foulard-soie-imprime', 3, 'pending', 'cod', 'unpaid'],
    [0, 'Ines Ayari', 'Ariana', 'sac-cuir-camel', 1, 'pending', 'cod', 'unpaid'],
], 200000, 7000);
echo "Yasmine Couture demo seeded\n";
