<?php
declare(strict_types=1);
// Sector demo "Beauté & cosmétique" of the Flownova demos page: fictional brand "Nour Cosmetics" (Luxe theme, rose).
require __DIR__ . '/../lib.php';

demo_settings([
    'theme' => 'luxe',
    'brand_color' => '#b45372',
    'shop_tagline' => 'Soins naturels fabriqués en Tunisie : figue de Barbarie, jasmin, argile.',
    'announcement' => 'Livraison offerte dès 120 DT · Paiement à la livraison',
    'hero_title' => 'Votre peau, au naturel.',
    'hero_subtitle' => 'Sérums, crèmes et rituels de hammam aux ingrédients tunisiens, sans paraben.',
    'hero_cta' => 'Découvrir les soins',
    'shop_tagline_ar' => 'منتوجات عناية طبيعية مصنوعة في تونس : هندي، ياسمين، طفل.',
    'announcement_ar' => 'توصيل مجاني بداية من 120 د · الخلاص عند الاستلام',
    'hero_title_ar' => 'بشرتك على طبيعتها',
    'hero_subtitle_ar' => 'سيروم، كريمات و روتين الحمّام بمكونات تونسية، بلا بارابين.',
    'hero_cta_ar' => 'اكتشفي المنتوجات',
    'free_shipping_threshold' => '120000',
    'shipping_fee' => '7000',
    'shop_email' => 'contact@nour-cosmetics.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '5',
    'order_prefix' => 'NOU',
]);

demo_catalog('beaute', [
    'visage' => ['Soins visage', 'Sérums, crèmes, masques.'],
    'corps' => ['Corps & hammam', 'Gommages, laits, savons.'],
    'huiles' => ['Huiles précieuses', 'Pressées à froid.'],
    'coffrets' => ['Coffrets', 'Routines prêtes à offrir.'],
], [
    ['serum-vitamine-c', 'Sérum éclat vitamine C', 'visage', 59, 69, 40, true, 'Teint lumineux en 2 semaines.', "- Vitamine C stabilisée 15 %\n- Flacon 30 ml\n- Tous types de peau", null, [], 86],
    ['creme-hydratante-rose', 'Crème hydratante à la rose', 'visage', 45, null, 35, true, 'Hydratation 24 h, eau de rose de Kairouan.', "- Pot 50 ml\n- Sans paraben", null, [], 64],
    ['huile-figue-barbarie', 'Huile de pépins de figue de Barbarie', 'huiles', 89, 110, 12, true, 'L’or anti-âge, 100 % pure, pressée à froid.', "- 100 % pure, bio\n- Flacon 15 ml", 'Contenance', [['15 ml', null, 12], ['30 ml', 159000, 6]], 51],
    ['gommage-cafe', 'Gommage au café', 'corps', 35, null, 25, false, 'Peau douce et lissée dès la première utilisation.', "- Café, sucre et huile d’olive\n- Pot 200 g", null, [], 39],
    ['savon-nila', 'Savon nila du hammam', 'corps', 18, null, 60, false, 'Le savon bleu traditionnel, purifiant.', "- Fabriqué à la main\n- 120 g", null, [], 97],
    ['lait-corps-jasmin', 'Lait corps au jasmin', 'corps', 39, null, 22, false, 'Parfum délicat de jasmin tunisien.', "- Flacon pompe 250 ml", null, [], 33],
    ['masque-argile-verte', 'Masque à l’argile verte', 'visage', 29, null, 3, false, 'Pores resserrés, peau purifiée.', "- Tube 75 ml\n- Peaux mixtes à grasses", null, [], 28],
    ['coffret-glow', 'Coffret « Glow »', 'coffrets', 129, 162, 8, false, 'Sérum + crème + huile de figue de Barbarie.', "La routine complète, dans une boîte cadeau.\n\n- 3 soins\n- Carte message offerte", null, [], 24],
]);

insert('coupons', ['code' => 'NOUR10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
demo_orders('NOU', [
    [9, 'Mariem Ben Ali', 'Tunis', 'coffret-glow', 1, 'delivered', 'cod', 'paid'],
    [7, 'Rim Trabelsi', 'Sfax', 'serum-vitamine-c', 2, 'delivered', 'konnect', 'paid'],
    [5, 'Nour Chaabane', 'Sousse', 'huile-figue-barbarie', 1, 'shipped', 'cod', 'unpaid'],
    [3, 'Amira Jlassi', 'Monastir', 'savon-nila', 4, 'confirmed', 'flouci', 'paid'],
    [1, 'Sarra Gharbi', 'Bizerte', 'creme-hydratante-rose', 1, 'pending', 'cod', 'unpaid'],
    [0, 'Ines Ayari', 'Ariana', 'gommage-cafe', 2, 'pending', 'cod', 'unpaid'],
], 120000, 7000);
echo "Nour Cosmetics demo seeded\n";
