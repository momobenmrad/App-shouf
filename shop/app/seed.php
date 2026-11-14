<?php
declare(strict_types=1);

/** Legal and help pages. Bracketed passages [ … ] must be completed by the merchant. */
function seed_pages(string $shopName): void
{
    $pages = [
        ['a-propos', 'À propos', 0, <<<TXT
## Notre histoire

{$shopName} est née d’une idée simple : proposer des produits de qualité, sélectionnés avec soin, à des prix justes.

[Racontez ici l’histoire de votre marque : qui vous êtes, pourquoi vous avez créé la boutique, ce qui vous rend différent.]

## Nos engagements

- Des produits contrôlés avant chaque expédition
- Une livraison rapide partout dans le pays
- Un service client disponible et à l’écoute
TXT],
        ['livraison-et-retours', 'Livraison et retours', 1, <<<TXT
## Livraison

Les commandes sont préparées sous 24 h ouvrées puis confiées à notre transporteur. Le délai de livraison est généralement de 24 à 72 h selon votre ville.

Les frais de livraison sont indiqués dans le panier avant validation de la commande. La livraison est offerte au-delà du montant indiqué sur le site.

## Paiement à la livraison

Lorsque vous choisissez le paiement à la livraison, vous réglez le montant exact au livreur à la réception du colis. Merci de vérifier votre colis en présence du livreur.

## Retours et échanges

Vous disposez de [14] jours à compter de la réception pour nous retourner un article qui ne vous convient pas, dans son état d’origine et dans son emballage.

Pour demander un retour, contactez-nous via la page Contact en indiquant votre numéro de commande. [Précisez qui prend en charge les frais de retour.]

Le remboursement est effectué sous [7] jours après réception et contrôle de l’article.
TXT],
        ['conditions-generales-de-vente', 'Conditions générales de vente', 2, <<<TXT
## Article 1 — Objet

Les présentes conditions générales de vente régissent les ventes conclues sur le site {$shopName}, exploité par [RAISON SOCIALE], [forme juridique] au capital de [montant], immatriculée sous le numéro [RNE / RCS / SIRET], dont le siège est situé [ADRESSE].

## Article 2 — Produits

Les produits proposés sont décrits et présentés avec la plus grande exactitude possible. Les photographies n’ont pas de valeur contractuelle.

## Article 3 — Prix

Les prix sont indiqués toutes taxes comprises, hors frais de livraison. Les frais de livraison sont indiqués avant la validation de la commande. {$shopName} se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés au prix en vigueur lors de la validation de la commande.

## Article 4 — Commande

La validation de la commande vaut acceptation des présentes conditions. Une confirmation est envoyée par e-mail. {$shopName} se réserve le droit d’annuler toute commande en cas de litige existant avec le client ou d’indisponibilité du produit.

## Article 5 — Paiement

Le paiement s’effectue selon les moyens proposés lors de la commande : paiement à la livraison et/ou paiement en ligne sécurisé. Les paiements en ligne sont traités par des prestataires agréés ; {$shopName} n’a jamais accès à vos données bancaires.

## Article 6 — Livraison

Les délais de livraison sont donnés à titre indicatif. Voir la page « Livraison et retours ».

## Article 7 — Droit de rétractation et retours

Le client dispose d’un délai de [14] jours à compter de la réception pour exercer son droit de rétractation, conformément à la législation applicable. Voir la page « Livraison et retours ».

## Article 8 — Données personnelles

Les données collectées sont nécessaires au traitement des commandes. Voir la « Politique de confidentialité ».

## Article 9 — Droit applicable

Les présentes conditions sont soumises au droit [tunisien / français / …]. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
TXT],
        ['mentions-legales', 'Mentions légales', 3, <<<TXT
## Éditeur du site

[RAISON SOCIALE] — [forme juridique]
Adresse : [ADRESSE]
Immatriculation : [RNE / RCS / SIRET] — Matricule fiscal : [NUMÉRO]
Téléphone : [TÉLÉPHONE] — E-mail : [E-MAIL]
Directeur de la publication : [NOM]

## Hébergement

[NOM DE L’HÉBERGEUR] — [ADRESSE DE L’HÉBERGEUR] — [SITE WEB DE L’HÉBERGEUR]

## Propriété intellectuelle

L’ensemble des contenus de ce site (textes, images, logos) est la propriété de {$shopName} ou de ses partenaires. Toute reproduction sans autorisation est interdite.
TXT],
        ['politique-de-confidentialite', 'Politique de confidentialité', 4, <<<TXT
## Données collectées

Lors d’une commande, nous collectons votre nom, votre e-mail, votre téléphone et votre adresse de livraison. Ces informations servent uniquement à traiter et livrer votre commande et à vous contacter à son sujet.

## Paiement

Les paiements en ligne sont traités par nos prestataires de paiement. Nous ne stockons aucune donnée bancaire.

## Cookies

Ce site utilise un cookie technique indispensable au fonctionnement du panier. [Si vous activez Google Analytics ou le pixel Meta, mentionnez-le ici et recueillez le consentement si la loi l’exige.]

## Vos droits

Vous pouvez demander l’accès, la rectification ou la suppression de vos données en nous écrivant à [E-MAIL]. [Mentionnez l’autorité de protection des données compétente, par ex. INPDP en Tunisie ou CNIL en France.]
TXT],
    ];
    foreach ($pages as [$slug, $title, $pos, $content]) {
        insert('pages', ['slug' => $slug, 'title' => $title, 'content' => $content, 'position' => $pos, 'in_footer' => 1, 'is_active' => 1, 'updated_at' => now()]);
    }
}

/** Demo catalog with bundled illustrations (assets/demo), so the shop looks complete right after install. */
function seed_demo_catalog(int $scale): void
{
    $cats = [
        'maison' => ['Maison', 'Des objets qui rendent chaque pièce plus chaleureuse.'],
        'accessoires' => ['Accessoires', 'Les finitions qui font toute la différence.'],
        'beaute' => ['Beauté', 'Des soins simples et efficaces, au quotidien.'],
        'mode' => ['Mode', 'Des essentiels confortables et durables.'],
    ];
    $catIds = [];
    $pos = 0;
    foreach ($cats as $slug => [$name, $desc]) {
        $catIds[$slug] = insert('categories', ['name' => $name, 'slug' => $slug, 'description' => $desc, 'position' => $pos++, 'is_active' => 1, 'created_at' => now()]);
    }

    $m = fn(float $v) => (int) round($v * $scale);
    $products = [
        ['bougie-ambre', 'Bougie parfumée Ambre', 'maison', 39.9, 49.9, 24, true, 'Une bougie en cire végétale aux notes chaudes d’ambre et de vanille, coulée à la main.',
            "Une bougie en cire de soja, coulée à la main dans un verre réutilisable.\n\n## Caractéristiques\n- Durée de combustion : environ 45 heures\n- Mèche en coton sans plomb\n- Poids net : 220 g\n\n## Conseil\nLors du premier allumage, laissez la cire fondre sur toute la surface pour une combustion homogène.", null, []],
        ['plaid-coton', 'Plaid en coton tissé', 'maison', 89.0, null, 12, true, 'Un plaid épais et doux, tissé en coton recyclé, pour les soirées au chaud.',
            "Tissé sur des métiers traditionnels, ce plaid apporte une touche artisanale à votre salon.\n\n- 100 % coton recyclé\n- Dimensions : 130 × 170 cm\n- Lavable en machine à 30 °C", null, []],
        ['vase-ceramique', 'Vase en céramique', 'maison', 54.0, null, 3, false, 'Façonné et émaillé à la main : chaque pièce est unique.',
            "Un vase en grès émaillé, idéal pour les fleurs séchées comme fraîches.\n\n- Hauteur : 24 cm\n- Intérieur étanche\n- Les variations d’émail font le charme de chaque pièce", null, []],
        ['sac-cabas-cuir', 'Sac cabas en cuir', 'accessoires', 149.0, null, null, true, 'Un grand cabas en cuir pleine fleur, assez spacieux pour un ordinateur 14 pouces.',
            "Coupé dans un cuir pleine fleur qui se patine joliment avec le temps.\n\n- Poche intérieure zippée\n- Anses renforcées\n- Dimensions : 38 × 30 × 14 cm", 'Couleur', [['Camel', null, 6], ['Noir', null, 4], ['Cognac', $m(159), 2]]],
        ['montre-minimaliste', 'Montre minimaliste', 'accessoires', 189.0, 229.0, 8, false, 'Boîtier acier de 38 mm, bracelet cuir interchangeable, mouvement quartz japonais.',
            "Une montre épurée qui se porte en toutes occasions.\n\n- Boîtier acier inoxydable 38 mm\n- Verre minéral\n- Étanche 3 ATM\n- Garantie 2 ans", null, []],
        ['lunettes-soleil', 'Lunettes de soleil', 'accessoires', 69.0, null, 15, false, 'Monture en acétate et verres polarisés catégorie 3 pour un confort optimal.',
            "- Verres polarisés UV400\n- Monture en acétate\n- Étui de protection inclus", null, []],
        ['huile-seche', 'Huile sèche nourrissante', 'beaute', 45.5, null, 30, true, 'Une huile légère pour le corps et les cheveux, qui pénètre sans laisser de film gras.',
            "Formulée avec des huiles d’argan, de figue de Barbarie et d’amande douce.\n\n## Utilisation\nAppliquer sur peau sèche ou humide, ou sur les longueurs des cheveux.\n\n- 100 ml\n- Sans silicones", null, []],
        ['coffret-soin', 'Coffret soin visage', 'beaute', 119.0, 139.0, 10, false, 'La routine complète : nettoyant, sérum et crème hydratante, dans un coffret cadeau.',
            "Le coffret idéal pour offrir ou se faire plaisir.\n\n- Gel nettoyant 150 ml\n- Sérum hydratant 30 ml\n- Crème de jour 50 ml", null, []],
        ['t-shirt-coton-bio', 'T-shirt en coton bio', 'mode', 35.0, null, null, false, 'Coupe droite, col rond, coton biologique épais de 180 g/m².',
            "Un basique durable, à porter seul ou sous une veste.\n\n- 100 % coton biologique\n- Coupe droite unisexe\n- Lavage à 30 °C", 'Taille', [['S', null, 10], ['M', null, 14], ['L', null, 8], ['XL', null, 0]]],
        ['sweat-capuche', 'Sweat à capuche', 'mode', 79.0, 95.0, null, true, 'Molleton gratté ultra doux, poche kangourou et capuche doublée.',
            "Le sweat confortable par excellence.\n\n- 80 % coton, 20 % polyester recyclé\n- Molleton gratté 320 g/m²\n- Coupe légèrement oversize", 'Taille', [['S', null, 5], ['M', null, 9], ['L', null, 7], ['XL', null, 3]]],
    ];

    $day = 0;
    foreach ($products as [$slug, $name, $cat, $price, $compare, $stock, $featured, $short, $desc, $optionLabel, $variants]) {
        $ts = date('Y-m-d H:i:s', strtotime('-' . (40 - $day * 4) . ' days'));
        $day++;
        $pid = insert('products', [
            'category_id' => $catIds[$cat],
            'name' => $name,
            'slug' => $slug,
            'sku' => strtoupper(substr(str_replace('-', '', $slug), 0, 6)) . '-' . str_pad((string) $day, 3, '0', STR_PAD_LEFT),
            'short_description' => $short,
            'description' => $desc,
            'price' => $m($price),
            'compare_price' => $compare ? $m($compare) : null,
            'stock' => $stock,
            'option_label' => $optionLabel,
            'is_active' => 1,
            'is_featured' => $featured ? 1 : 0,
            'sales_count' => [7, 4, 2, 9, 3, 1, 12, 5, 6, 8][$day - 1],
            'created_at' => $ts,
            'updated_at' => $ts,
        ]);
        foreach (['a', 'b'] as $i => $suffix) {
            insert('product_images', ['product_id' => $pid, 'path' => "assets/demo/$slug-$suffix.svg", 'alt' => $name, 'position' => $i]);
        }
        foreach ($variants as $vi => [$vname, $vprice, $vstock]) {
            insert('product_variants', ['product_id' => $pid, 'name' => $vname, 'price' => $vprice, 'stock' => $vstock, 'position' => $vi]);
        }
    }

    insert('coupons', ['code' => 'BIENVENUE10', 'type' => 'percent', 'value' => 10, 'min_total' => 0, 'is_active' => 1, 'created_at' => now()]);
}
