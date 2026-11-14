<?php
declare(strict_types=1);
// Personalised demo for the prospect "Charme" (Instagram @charmeaccessoriesdoha: bags, winter hats and
// handmade accessories): Luxe theme in black and ivory like its logo, with its own product photos
// (sac-seau, bob-fourrure) and illustrations for the rest. Prices are placeholders.
require __DIR__ . '/../lib.php';

demo_settings([
    'theme' => 'luxe',
    'brand_color' => '#8a6a3b',
    'logo' => 'assets/demo-charme/logo.png',
    'shop_tagline' => 'Sacs, bijoux et accessoires faits main, choisis avec amour.',
    'announcement' => 'Livraison partout en Tunisie · Paiement à la livraison',
    'hero_title' => 'Des accessoires qui racontent une histoire.',
    'hero_subtitle' => 'Sacs, parures, bracelets et créations faites main : des pièces uniques, emballées avec soin.',
    'hero_cta' => 'Découvrir la collection',
    'shop_tagline_ar' => 'شنط، مجوهرات و إكسسوارات مصنوعة باليد، مختارة بكل حب.',
    'announcement_ar' => 'توصيل لكامل تونس · الخلاص عند الاستلام',
    'hero_title_ar' => 'إكسسوارات تحكي حكايتك',
    'hero_subtitle_ar' => 'شنط، أطقم، أساور و إبداعات مصنوعة باليد : قطع فريدة مغلّفة بعناية.',
    'hero_cta_ar' => 'اكتشفي الكوليكسيون',
    'free_shipping_threshold' => '150000',
    'shipping_fee' => '8000',
    'instagram' => 'https://www.instagram.com/charmeaccessoriesdoha/',
    'shop_email' => 'contact@charme-demo.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '3',
    'order_prefix' => 'CHA',
]);

$colors = fn (array $names, array $stock) => array_map(fn ($n, $s) => [$n, null, $s], $names, $stock);
demo_catalog('charme', [
    'sacs' => ['Sacs', 'Sacs à main, seaux et cabas.'],
    'hiver' => ['Collection hiver', 'Bobs et bonnets tout doux.'],
    'parures' => ['Parures', 'Collier, boucles et bague assortis.'],
    'colliers' => ['Colliers', 'Pendentifs et initiales.'],
    'bracelets' => ['Bracelets', 'Perles et breloques, faits main.'],
    'porte-cles' => ['Porte-clés', 'Créations personnalisées.'],
], [
    ['sac-noeud-foulard', 'Sac à main nœud foulard', 'sacs', 89, 105, 5, true, 'Sac structuré, foulard satiné noué sur l’anse.', "- Simili cuir\n- Foulard satiné amovible\n- Fermoir doré", null, [], 31],
    ['parure-papillon', 'Parure papillon', 'parures', 39, 49, null, true, 'Collier, boucles et bague en acier inoxydable.', "- Acier inoxydable, ne noircit pas\n- Collier + boucles + bague\n- Livrée sur sa carte", 'Couleur', $colors(['Doré', 'Argenté'], [10, 7]), 58],
    ['mini-sac-fleur', 'Mini sac à breloque fleur', 'sacs', 59, null, null, false, 'Petit sac à main avec fleur porte-bonheur.', "- Simili cuir\n- Breloque fleur amovible", 'Couleur', $colors(['Lilas', 'Beige', 'Noir'], [3, 5, 4]), 27],
    ['parure-coeur', 'Parure cœur', 'parures', 45, null, 9, false, 'Collier, boucles et bague cœur.', "- Acier inoxydable\n- Collier + boucles + bague", null, [], 34],
    ['collier-initiale', 'Collier initiale personnalisé', 'colliers', 29, null, 30, true, 'Votre initiale gravée sur un médaillon doré.', "Indiquez la lettre dans les notes de commande.\n\n- Acier doré\n- Chaîne 45 cm", null, [], 62],
    ['collier-coeur', 'Collier cœur doré', 'colliers', 25, null, 14, false, 'Pendentif cœur sur chaîne fine.', "- Acier doré\n- Chaîne 45 cm", null, [], 29],
    ['bracelet-perles', 'Bracelet perles fait main', 'bracelets', 15, null, 25, false, 'Perles nacrées et dorées, monté à la main.', "- Fait main\n- Élastique, taille unique", null, [], 81],
    ['bracelet-trefle', 'Bracelet trèfles', 'bracelets', 19, 25, 2, false, 'Trois trèfles noirs sur chaîne dorée.', "- Acier doré\n- Taille ajustable", null, [], 44],
    ['porte-cle-fleur', 'Porte-clé fleur fait main', 'porte-cles', 12, null, 40, false, 'Fleur en perles, faite main.', "- Fait main\n- Anneau métal", null, [], 95],
    ['porte-cle-prenom', 'Porte-clé prénom personnalisé', 'porte-cles', 15, null, 50, false, 'Votre prénom en lettres, avec pompon.', "Indiquez le prénom dans les notes de commande.\n\n- Jusqu’à 8 lettres", null, [], 67],
    ['cabas-toile', 'Cabas en toile', 'sacs', 45, null, 12, false, 'Grand cabas du quotidien.', "- Toile épaisse\n- Anses renforcées", null, [], 18],
    // The prospect's own photos come last: the newest featured products fill the hero and the top of the lists.
    ['bob-fourrure', 'Bob d’hiver en fausse fourrure', 'hiver', 29, null, null, true, 'La tendance de l’hiver, tout doux, en 7 couleurs.', "La mode de l’hiver à ne pas rater.\n\n- Fausse fourrure douce\n- Taille unique\n- 7 couleurs", 'Couleur', $colors(['Blanc', 'Camel', 'Marron', 'Noir', 'Beige', 'Gris', 'Bordeaux'], [8, 5, 4, 9, 6, 2, 3]), 73],
    ['sac-seau', 'Sac seau en cuir grainé', 'sacs', 95, 115, null, true, 'Sac seau souple, intérieur bordeaux, breloque métal.', "Le sac de la saison, à porter main ou au creux du bras.\n\n- Simili cuir grainé, toucher souple\n- Intérieur contrasté avec pochette\n- Breloque métal argenté", 'Couleur', $colors(['Bordeaux', 'Beige'], [4, 6]), 46],
]);

insert('coupons', ['code' => 'CHARME10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
demo_orders('CHA', [
    [9, 'Mariem Ben Ali', 'Tunis', 'sac-seau', 1, 'delivered', 'cod', 'paid'],
    [7, 'Rim Trabelsi', 'Sfax', 'parure-papillon', 2, 'delivered', 'flouci', 'paid'],
    [6, 'Nour Chaabane', 'Sousse', 'bob-fourrure', 2, 'delivered', 'cod', 'paid'],
    [4, 'Amira Jlassi', 'Monastir', 'sac-noeud-foulard', 1, 'shipped', 'cod', 'unpaid'],
    [3, 'Sarra Gharbi', 'Bizerte', 'collier-initiale', 1, 'confirmed', 'konnect', 'paid'],
    [1, 'Ines Ayari', 'Ariana', 'bob-fourrure', 1, 'pending', 'cod', 'unpaid'],
    [0, 'Yasmine Mansour', 'Nabeul', 'sac-seau', 1, 'pending', 'cod', 'unpaid'],
], 150000, 8000);
echo "Charme demo seeded\n";
