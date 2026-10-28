<?php
declare(strict_types=1);
// Sector demo "Épicerie fine & terroir" of the Flownova demos page: fictional shop "Zitouna Terroir" (Luxe theme, olive).
require __DIR__ . '/../lib.php';

demo_settings([
    'theme' => 'luxe',
    'brand_color' => '#4d7c0f',
    'shop_tagline' => 'Huile d’olive, dattes et produits du terroir tunisien, direct producteur.',
    'announcement' => 'Livraison partout en Tunisie · Paiement à la livraison',
    'hero_title' => 'Le meilleur du terroir tunisien.',
    'hero_subtitle' => 'Huile d’olive extra vierge de Sfax, Deglet Nour de Tozeur, miel de thym : récolte 2026.',
    'hero_cta' => 'Découvrir les produits',
    'shop_tagline_ar' => 'زيت زيتون، تمر و منتوجات تونسية من المنتج للمستهلك.',
    'announcement_ar' => 'توصيل لكامل تونس · الخلاص عند الاستلام',
    'hero_title_ar' => 'أحسن ما في الأرض التونسية',
    'hero_subtitle_ar' => 'زيت زيتون بكر ممتاز من صفاقس، دقلة نور من توزر، عسل زعتر : صابة 2026.',
    'hero_cta_ar' => 'اكتشف المنتوجات',
    'free_shipping_threshold' => '150000',
    'shipping_fee' => '8000',
    'shop_email' => 'contact@zitouna-terroir.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '5',
    'order_prefix' => 'ZIT',
]);

demo_catalog('terroir', [
    'huiles' => ['Huile d’olive', 'Extra vierge, première pression à froid.'],
    'dattes' => ['Dattes', 'Deglet Nour de Tozeur.'],
    'epicerie' => ['Miel, harissa & bsissa', 'Recettes de nos grands-mères.'],
    'coffrets' => ['Coffrets', 'À offrir.'],
], [
    ['huile-olive-chemlali', 'Huile d’olive Chemlali 75 cl', 'huiles', 32, null, 80, true, 'Extra vierge, fruitée et douce, récolte 2026.', "- Variété Chemlali, Sfax\n- Première pression à froid\n- Acidité < 0,3 %", 'Contenance', [['75 cl', null, 80], ['1 L', 39000, 50]], 128],
    ['huile-olive-bidon-5l', 'Huile d’olive extra vierge 5 L', 'huiles', 125, 140, 25, true, 'Le format famille, direct du moulin.', "- Bidon 5 L\n- Récolte 2026", null, [], 74],
    ['dattes-deglet-nour', 'Dattes Deglet Nour 1 kg', 'dattes', 18, null, 120, true, 'Branchées, moelleuses, de Tozeur.', "- Calibre extra\n- Barquette 1 kg", null, [], 156],
    ['dattes-fourrees', 'Dattes fourrées (boîte de 24)', 'dattes', 45, null, 18, false, 'Fourrées amande, pistache et noix.', "- Boîte cadeau\n- 24 pièces", null, [], 41],
    ['miel-thym', 'Miel de thym 500 g', 'epicerie', 55, null, 4, false, 'Miel pur de Zaghouan.', "- 100 % naturel\n- Pot verre 500 g", null, [], 37],
    ['harissa-artisanale', 'Harissa artisanale', 'epicerie', 12, null, 60, false, 'Piments séchés au soleil du Cap Bon.', "- Pot 350 g\n- Recette traditionnelle", null, [], 89],
    ['bsissa-tradition', 'Bsissa tradition 1 kg', 'epicerie', 22, null, 30, false, 'Orge, pois chiches et épices torréfiés.', "- Sachet 1 kg", null, [], 46],
    ['coffret-terroir', 'Coffret « Terroir »', 'coffrets', 89, 105, 10, false, 'Huile 75 cl, dattes, miel et harissa.', "Le cadeau 100 % tunisien.\n\n- 4 produits\n- Boîte en kraft", null, [], 33],
]);

insert('coupons', ['code' => 'ZITOUNA10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
demo_orders('ZIT', [
    [9, 'Hédi Ben Ali', 'Tunis', 'huile-olive-bidon-5l', 2, 'delivered', 'cod', 'paid'],
    [7, 'Rim Trabelsi', 'Sfax', 'coffret-terroir', 1, 'delivered', 'konnect', 'paid'],
    [5, 'Nour Chaabane', 'Sousse', 'dattes-deglet-nour', 3, 'shipped', 'cod', 'unpaid'],
    [3, 'Amira Jlassi', 'Monastir', 'miel-thym', 1, 'confirmed', 'flouci', 'paid'],
    [1, 'Sami Gharbi', 'Bizerte', 'harissa-artisanale', 4, 'pending', 'cod', 'unpaid'],
    [0, 'Ines Ayari', 'Ariana', 'huile-olive-chemlali', 2, 'pending', 'cod', 'unpaid'],
], 150000, 8000);
echo "Zitouna Terroir demo seeded\n";
