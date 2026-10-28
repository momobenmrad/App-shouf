<?php
declare(strict_types=1);
// Sector demo "Coffrets & accessoires" of the Flownova demos page: fictional gift shop "Lina Gifts" (Luxe theme, rose).
require __DIR__ . '/../lib.php';

demo_settings([
    'theme' => 'luxe',
    'brand_color' => '#be185d',
    'default_locale' => 'fr',
    'shop_tagline' => 'Coffrets cadeaux, bijoux faits main et montres, livrés partout en Tunisie.',
    'announcement' => 'Livraison à domicile 8 DT · Paiement à la livraison',
    'hero_title' => 'Des cadeaux qui font battre le cœur.',
    'hero_subtitle' => 'Coffrets, bagues de couple, bracelets et montres : emballage cadeau inclus, livraison partout en Tunisie.',
    'hero_cta' => 'Découvrir les coffrets',
    'shop_tagline_ar' => 'علب هدايا، إكسسوارات مصنوعة يدويًا وساعات، توصيل لكامل تونس.',
    'announcement_ar' => 'توصيل للدار ب 8 د · الخلاص عند الاستلام',
    'hero_title_ar' => 'هدايا تفرّح القلب',
    'hero_subtitle_ar' => 'علب هدايا، خواتم للكوبل، أساور وساعات، مع تغليف هدية وتوصيل لكامل تونس.',
    'hero_cta_ar' => 'اكتشف علب الهدايا',
    'free_shipping_threshold' => '150000',
    'shipping_fee' => '8000',
    'whatsapp' => '',
    'shop_email' => 'contact@lina-gifts.tn',
    'konnect_enabled' => '1', 'konnect_api_key' => 'demo', 'konnect_wallet_id' => 'demo',
    'flouci_enabled' => '1', 'flouci_app_token' => 'demo', 'flouci_app_secret' => 'demo',
    'low_stock_threshold' => '3',
    'order_prefix' => 'LIN',
]);

demo_catalog('coffrets', [
    'coffrets' => ['Coffrets cadeaux', 'Prêts à offrir, avec emballage.'],
    'couple' => ['Bijoux de couple', 'Bagues et bracelets assortis.'],
    'bracelets' => ['Bracelets', 'Cordons, chaînes et aimantés.'],
    'colliers' => ['Colliers', 'Pendentifs cœur et chaînes dorées.'],
    'montres' => ['Montres & parures', 'Montres et sets assortis.'],
], [
    ['coffret-love', 'Coffret « Love »', 'coffrets', 119, 139, 12, true, 'Montre, bracelet et collier cœur dans une boîte rose avec ruban.', "Le cadeau qui fait toujours plaisir.\n\n- Montre dorée + bracelet + collier cœur\n- Boîte cadeau avec ruban\n- Carte message offerte", null, [], 41],
    ['coffret-anniversaire', 'Box surprise « Anniversaire »', 'coffrets', 99, null, 8, true, 'Une box à composer : bijou, mot doux et petites attentions.', "Dis-nous le prénom et l'occasion, on prépare la box.\n\n- Bijou au choix\n- Carte personnalisée\n- Emballage cadeau", null, [], 28],
    ['bagues-couple', 'Bagues de couple « For her / For him »', 'couple', 69, 85, null, true, 'Deux bagues assorties dans leur écrin rouge.', "Une bague pour elle, une pour lui.\n\n- Acier inoxydable, ne noircit pas\n- Écrin rouge inclus", 'Taille', [['52 / 60', null, 6], ['54 / 62', null, 9], ['56 / 64', null, 4], ['58 / 66', null, 0]], 36],
    ['bracelets-aimantes-couple', 'Bracelets aimantés de couple', 'couple', 39, null, 25, false, 'Deux demi-cœurs qui s’attirent.', "- Cordons noir et rouge\n- Fermoirs dorés aimantés\n- Taille ajustable", null, [], 52],
    ['bracelet-cordon-coeur', 'Bracelet cordon cœur', 'bracelets', 25, null, null, false, 'Cordon fin avec cœur doré, fait main.', "- Cordon tressé\n- Cœur doré\n- Taille ajustable", 'Couleur', [['Rouge', null, 14], ['Noir', null, 11], ['Rose', null, 2]], 64],
    ['collier-coeur-dore', 'Collier cœur doré', 'colliers', 35, null, 18, false, 'Pendentif cœur sur chaîne fine dorée.', "- Acier doré\n- Chaîne 45 cm", null, [], 30],
    ['collier-coeur-rouge', 'Collier cœur rouge', 'colliers', 39, 45, 2, false, 'Cœur émaillé rouge sur chaîne dorée.', "- Acier doré\n- Chaîne 45 cm", null, [], 19],
    ['montre-rose-parure', 'Parure montre rose + bracelet + collier', 'montres', 89, 105, 6, true, 'La montre rose et ses bijoux assortis.', "- Montre quartz, bracelet rose\n- Bracelet et collier assortis\n- Boîte cadeau", null, [], 23],
    ['montre-classique-doree', 'Montre classique dorée', 'montres', 75, null, 9, false, 'Cadran ivoire, bracelet cuir brun.', "- Mouvement quartz\n- Bracelet cuir", null, [], 12],
    ['bague-coeur-noir', 'Bague cœur noir', 'couple', 22, null, 3, false, 'Bague dorée avec cœur noir.', "- Acier doré\n- Taille ajustable", null, [], 17],
]);

insert('coupons', ['code' => 'LINA10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);

demo_orders('LIN', [
    [9, 'Mariem Ben Ali', 'Tunis', 'coffret-love', 1, 'delivered', 'cod', 'paid'],
    [7, 'Yassine Trabelsi', 'Sfax', 'bagues-couple', 1, 'delivered', 'cod', 'paid'],
    [6, 'Nour Chaabane', 'Sousse', 'bracelets-aimantes-couple', 2, 'delivered', 'flouci', 'paid'],
    [4, 'Amira Jlassi', 'Monastir', 'montre-rose-parure', 1, 'shipped', 'cod', 'unpaid'],
    [3, 'Khalil Mansour', 'Nabeul', 'coffret-anniversaire', 1, 'confirmed', 'konnect', 'paid'],
    [1, 'Sarra Gharbi', 'Bizerte', 'bracelet-cordon-coeur', 3, 'pending', 'cod', 'unpaid'],
    [0, 'Ines Ayari', 'Ariana', 'collier-coeur-dore', 1, 'pending', 'cod', 'unpaid'],
], 150000, 8000);

echo "Lina Gifts demo seeded\n";
