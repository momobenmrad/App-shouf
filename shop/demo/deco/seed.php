<?php
declare(strict_types=1);
// Sector demo "Déco & art de table" of the Flownova demos page: fictional shop "Dar Zina" (Luxe theme, Sidi Bou Saïd blue).
require __DIR__ . '/../lib.php';

demo_settings([
    'theme' => 'luxe',
    'brand_color' => '#1d4e89',
    'shop_tagline' => 'Poterie de Nabeul, céramique de Sejnane et artisanat tunisien pour la maison.',
    'announcement' => 'Emballage anti-casse offert · Paiement à la livraison',
    'hero_title' => 'L’artisanat tunisien, chez vous.',
    'hero_subtitle' => 'Assiettes peintes à la main, vases de Sejnane, plateaux en cuivre : des pièces uniques, livrées avec soin.',
    'hero_cta' => 'Découvrir les pièces',
    'shop_tagline_ar' => 'فخار نابل، خزف سجنان و صناعات تقليدية تونسية للدار.',
    'announcement_ar' => 'تغليف ضد الكسر مجانًا · الخلاص عند الاستلام',
    'hero_title_ar' => 'الصناعة التقليدية التونسية في دارك',
    'hero_subtitle_ar' => 'صحون مرسومة باليد، مزهريات سجنان، صواني نحاس : قطع فريدة توصلك بكل عناية.',
    'hero_cta_ar' => 'اكتشف القطع',
    'free_shipping_threshold' => '250000',
    'shipping_fee' => '9000',
    'shop_email' => 'contact@dar-zina.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '2',
    'order_prefix' => 'DZI',
]);

demo_catalog('deco', [
    'table' => ['Art de table', 'Assiettes, plats et bols.'],
    'vases' => ['Vases', 'Sejnane, Sidi Bou Saïd.'],
    'bougies' => ['Bougies & senteurs', 'Jasmin, fleur d’oranger.'],
    'textile' => ['Textile & plateaux', 'Kilim, cuivre.'],
], [
    ['assiettes-nabeul', 'Assiettes de Nabeul (lot de 6)', 'table', 120, 145, 9, true, 'Peintes à la main, motif fleur bleue.', "- Céramique émaillée\n- Ø 26 cm\n- Passent au lave-vaisselle", 'Couleur', [['Bleu', null, 9], ['Vert', null, 4], ['Jaune', null, 0]], 37],
    ['plat-service-terracotta', 'Plat de service terracotta', 'table', 75, null, 6, false, 'Grand plat pour couscous et salades.', "- Ø 38 cm\n- Fait main à Nabeul", null, [], 21],
    ['vase-sejnane', 'Vase de Sejnane', 'vases', 95, null, 4, true, 'Poterie berbère modelée à la main, patrimoine UNESCO.', "- Pièce unique\n- Hauteur 30 cm", null, [], 18],
    ['vase-bleu-sidi-bou', 'Vase bleu Sidi Bou Saïd', 'vases', 85, 99, 7, true, 'Le bleu de Sidi Bou Saïd, frise blanche.', "- Céramique émaillée\n- Hauteur 28 cm", null, [], 26],
    ['bougie-jasmin', 'Bougie parfumée jasmin', 'bougies', 39, null, 30, false, 'Cire végétale, 40 h de combustion.', "- Verre réutilisable\n- 200 g", 'Parfum', [['Jasmin', null, 30], ['Fleur d’oranger', null, 18], ['Figue', null, 9]], 55],
    ['plateau-the-cuivre', 'Plateau à thé en cuivre ciselé', 'textile', 140, null, 3, true, 'Ciselé à la main dans la médina de Tunis.', "- Cuivre massif\n- Ø 45 cm\n- 3 verres offerts", null, [], 14],
    ['coussin-kilim', 'Housse de coussin kilim', 'textile', 49, null, 15, false, 'Tissée à la main, motif losange berbère.', "- 45 × 45 cm\n- Laine et coton", null, [], 33],
    ['bols-poterie', 'Bols en poterie (lot de 3)', 'table', 59, null, 11, false, 'Trois tailles, liseré bleu.', "- Céramique émaillée\n- Ø 12, 16 et 20 cm", null, [], 29],
]);

insert('coupons', ['code' => 'DARZINA10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
demo_orders('DZI', [
    [9, 'Mariem Ben Ali', 'Tunis', 'assiettes-nabeul', 1, 'delivered', 'cod', 'paid'],
    [7, 'Karim Trabelsi', 'Sfax', 'plateau-the-cuivre', 1, 'delivered', 'konnect', 'paid'],
    [5, 'Nour Chaabane', 'Sousse', 'vase-sejnane', 1, 'shipped', 'cod', 'unpaid'],
    [3, 'Amira Jlassi', 'Monastir', 'bougie-jasmin', 3, 'confirmed', 'flouci', 'paid'],
    [1, 'Sarra Gharbi', 'Bizerte', 'coussin-kilim', 2, 'pending', 'cod', 'unpaid'],
    [0, 'Ines Ayari', 'Ariana', 'vase-bleu-sidi-bou', 1, 'pending', 'cod', 'unpaid'],
], 250000, 9000);
echo "Dar Zina demo seeded\n";
