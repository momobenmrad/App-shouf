# Boutique — site e-commerce clé en main (PHP / MySQL)

Boutique en ligne complète, prête à être livrée à un client et installée **sur n'importe quel hébergement mutualisé** (o2switch, Hostinger, OVH, LWS, Planet Hoster, cPanel, Plesk…) : pas de Node.js, pas de Composer, pas de ligne de commande. On envoie les fichiers par FTP, on ouvre `/install/`, c'est en ligne.

- **Boutique** : accueil, catalogue avec filtres et tri, recherche, fiche produit (galerie, variantes taille/couleur, stock), panier, codes promo, commande en une page, suivi de commande, contact, newsletter, pages légales.
- **Paiements** : paiement à la livraison, **Konnect** et **Flouci** (Tunisie), **Stripe** (international).
- **Langues** : français, arabe (mise en page de droite à gauche) et anglais, au choix.
- **Administration** : tableau de bord (ventes, stock faible, meilleures ventes), commandes (statuts, e-mails au client, facture imprimable, export CSV), produits (photos glisser-déposer, variantes, duplication, actions groupées), catégories, codes promo, pages, clients, messages, paramètres sans toucher au code.
- **Appli installable (PWA)** : les clients ajoutent la boutique à l'écran d'accueil de leur téléphone (Android et iPhone) ; elle s'ouvre en plein écran comme une appli, avec l'icône aux couleurs de la boutique (générée automatiquement depuis le logo ou la couleur principale) et une page « pas de connexion ». Aucune publication sur les stores n'est nécessaire. Nécessite HTTPS.
- **Marque blanche** : nom, logo, couleur principale, textes, bandeau, réseaux sociaux, WhatsApp… tout se règle dans l'admin.

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installation sur un hébergement mutualisé](#2-installation-sur-un-hébergement-mutualisé)
3. [Après l'installation](#3-après-linstallation)
4. [Configurer les paiements](#4-configurer-les-paiements)
5. [E-mails](#5-e-mails)
6. [Personnalisation](#6-personnalisation)
7. [Sécurité, sauvegardes, mises à jour](#7-sécurité-sauvegardes-mises-à-jour)
8. [Développement local](#8-développement-local)
9. [Structure du code](#9-structure-du-code)
10. [Livrer et revendre la boutique](#10-livrer-et-revendre-la-boutique)

## 1. Prérequis

| | Minimum |
|---|---|
| PHP | 8.1 ou plus récent (8.2 / 8.3 conseillés) |
| Base de données | MySQL 5.7+ ou MariaDB 10.3+ (SQLite possible pour un essai) |
| Extensions PHP | `pdo_mysql`, `mbstring`, `curl`, `gd` (presque toujours actives) |
| Serveur web | Apache ou LiteSpeed (fichier `.htaccess` fourni), ou Nginx (voir `nginx.conf.example`) |
| HTTPS | Certificat SSL (Let's Encrypt gratuit chez la plupart des hébergeurs) — **obligatoire** pour les paiements en ligne |

L'installateur vérifie tout cela automatiquement.

## 2. Installation sur un hébergement mutualisé

1. **Créer la base de données** depuis le panneau de l'hébergeur (cPanel → *Bases de données MySQL*, ou équivalent) : une base, un utilisateur, un mot de passe, et donner **tous les privilèges** à l'utilisateur sur la base. Notez les trois informations.
2. **Envoyer les fichiers** : copiez le **contenu** du dossier `shop/` dans `public_html/` (ou `www/`) avec FileZilla ou le gestionnaire de fichiers. Pensez aux fichiers cachés (`.htaccess`). La boutique fonctionne aussi dans un sous-dossier (`public_html/boutique/`).
3. **Droits d'écriture** : les dossiers `storage/` et `uploads/` doivent être accessibles en écriture (755 suffit en général, sinon 775).
4. **Lancer l'installateur** : ouvrez `https://votre-domaine.com/install/`, remplissez le formulaire (nom de la boutique, devise, compte administrateur, accès MySQL) et validez.
5. **C'est en ligne.** Connectez-vous sur `https://votre-domaine.com/admin`.

> L'installateur se verrouille tout seul une fois la boutique installée (présence de `storage/config.php`). Vous pouvez supprimer le dossier `install/` par précaution.

**Si les pages autres que l'accueil renvoient « 404 »** : le module de réécriture d'URL est inactif. Soit décommentez `RewriteBase` dans `.htaccess` (boutique en sous-dossier), soit passez `'pretty_urls' => false` dans `storage/config.php` : les adresses deviennent `index.php?r=/produit/...` et tout fonctionne quand même.

## 3. Après l'installation

Le tableau de bord affiche une liste **« Mise en route »**. Dans l'ordre :

1. **Paramètres → Identité** : logo, e-mail, téléphone, WhatsApp, adresse, réseaux sociaux, raison sociale.
2. **Paramètres → Vente & livraison** : devise (à fixer *avant* de saisir les prix), frais et seuil de livraison offerte, délai affiché, langues.
3. **Paramètres → Paiements** : voir ci-dessous.
4. **Paramètres → E-mails** : SMTP de l'hébergeur (fortement recommandé).
5. **Pages** : compléter les passages entre crochets `[ … ]` des CGV, mentions légales, politique de confidentialité, livraison et retours.
6. **Produits** : supprimer ou modifier les produits de démonstration, ajouter les vrais.
7. Dans `.htaccess`, décommentez les deux lignes **« Forcer HTTPS »** une fois le certificat actif, et vérifiez que l'adresse du site commence par `https://` dans `storage/config.php` (`base_url`).

## 4. Configurer les paiements

Tous les réglages se font dans **Paramètres → Paiements**. Un moyen de paiement n'apparaît au client que s'il est activé **et** complètement configuré.

### Paiement à la livraison
Activé par défaut. Des frais supplémentaires peuvent être ajoutés. Les commandes arrivent « Reçues / Non payées » : passez-les en « Payée » à l'encaissement.

### Konnect (Tunisie — cartes bancaires locales, e-DINAR, wallet)
1. Créez un compte marchand sur [konnect.network](https://konnect.network) et récupérez la **clé API** et l'**identifiant du wallet** (sandbox pour les tests, puis production).
2. Collez-les dans l'admin, laissez « Mode test » coché, passez une commande test, puis décochez le mode test.
3. Le webhook est envoyé automatiquement à chaque paiement (`/webhook/konnect`) ; le statut est toujours revérifié auprès de Konnect avant de marquer la commande payée.

Devise obligatoire : **TND**.

### Flouci (Tunisie — application Flouci, cartes)
1. Créez une application sur l'espace développeur Flouci et récupérez **app token** et **app secret**.
2. Collez-les dans l'admin et activez. Le paiement est vérifié côté serveur au retour du client.

Devise obligatoire : **TND**. *Vérifiez dans la documentation Flouci que les adresses d'API n'ont pas changé avant la mise en production (`app/payments/flouci.php`).*

### Stripe (international — Visa, Mastercard, Apple Pay, Google Pay)
1. Dans le [tableau de bord Stripe](https://dashboard.stripe.com/apikeys), copiez la **clé secrète** (`sk_test_…` pour tester, `sk_live_…` ensuite).
2. *Développeurs → Webhooks → Ajouter un endpoint* : adresse `https://votre-domaine.com/webhook/stripe`, événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. Copiez le **secret de signature** (`whsec_…`).
3. Collez les deux dans l'admin.

Stripe ne gère pas le dinar tunisien : pour une boutique en TND, choisissez la devise Stripe (EUR, USD) et un **taux de conversion** (montant Stripe = montant boutique × taux). Pour une boutique en EUR, MAD, DZD ou USD, laissez le taux à 1 et la même devise.

### Ce qui se passe si un paiement échoue
La commande est conservée (stock réservé) avec le statut « Non payée ». Le client voit un bouton **« Payer maintenant »** sur la page de sa commande et peut changer de moyen de paiement (y compris pour le paiement à la livraison). Annuler une commande depuis l'admin remet les articles en stock.

## 5. E-mails

Envoyés automatiquement :
- au client : confirmation de commande, puis à chaque changement de statut si la case « Prévenir le client » est cochée (confirmée, expédiée avec numéro de suivi, livrée, annulée) ;
- à la boutique : chaque nouvelle commande et chaque message du formulaire de contact.

Sans réglage, la fonction `mail()` de l'hébergeur est utilisée. Pour éviter les spams, créez une adresse sur le domaine (ex. `commandes@votre-domaine.com`) et renseignez son **SMTP** dans *Paramètres → E-mails* (hôte, port 587 + STARTTLS ou 465 + SSL, identifiant, mot de passe).

## 6. Personnalisation

| Besoin | Où |
|---|---|
| Nom, logo, favicon, couleurs, textes d'accueil, bandeau | Admin → Paramètres |
| Menus | Automatiques : catégories principales (en-tête) et pages « pied de page » |
| Textes de l'interface (boutons, messages) | `app/lang/fr.php`, `ar.php`, `en.php` |
| Design | `assets/css/app.css` — les couleurs, rayons, ombres et typographie sont des variables CSS en tête de fichier |
| Gabarits | `app/views/shop/*.php` (boutique), `app/views/admin/*.php`, `app/views/emails/*.php` |
| Google Analytics, pixel Meta | Admin → Paramètres → SEO & suivi |

**Choix d'UI/UX** appliqués : design system à variables (marque injectée depuis l'admin, couleur du texte sur bouton calculée pour rester lisible — contraste WCAG), mobile d'abord (barre d'achat collante sur mobile, zones tactiles ≥ 44 px, champs à 16 px pour éviter le zoom iOS), tunnel de commande en une page avec validation en ligne et autocomplétion, jauge « livraison offerte », éléments de réassurance (livraison, paiement à la livraison, retours, service client), ajout au panier sans rechargement avec notification, accessibilité (lien d'évitement, focus visible, ARIA, `prefers-reduced-motion`), RTL complet via propriétés CSS logiques, et fonctionnement complet **sans JavaScript**.

## 7. Sécurité, sauvegardes, mises à jour

- Requêtes SQL préparées partout, échappement systématique des sorties, jeton CSRF sur tous les formulaires, mots de passe hachés (`password_hash`), limitation des tentatives de connexion admin, cookie de session `HttpOnly` + `SameSite`, en-têtes de sécurité.
- `app/`, `storage/` et `bin/` sont bloqués par `.htaccess` ; aucun script ne peut s'exécuter depuis `uploads/` ; les images envoyées sont vérifiées et renommées.
- Les paiements en ligne sont **toujours revérifiés côté serveur** (API du prestataire ou signature du webhook) : un client ne peut pas valider une commande en manipulant l'URL de retour.
- `storage/config.php` contient les accès à la base : ne le partagez pas.

**Sauvegardes** : la base de données (export MySQL depuis phpMyAdmin, ou sauvegardes automatiques de l'hébergeur) + le dossier `uploads/` (photos). C'est tout.

**Mise à jour du code** : remplacez les fichiers par la nouvelle version **sauf** `storage/` et `uploads/`.

**Journaux** : erreurs PHP dans `storage/error.log`, échanges avec les prestataires de paiement dans `storage/payments.log`. Pour afficher les erreurs à l'écran pendant un dépannage, passez `'debug' => true` dans `storage/config.php` (à remettre à `false` ensuite).

## 8. Développement local

```bash
cd shop
php bin/install.php --sqlite --url=http://localhost:8000 --email=admin@exemple.com --password=motdepasse123
php -S localhost:8000 index.php
```

Puis http://localhost:8000 et http://localhost:8000/admin. Le code promo de démonstration est `BIENVENUE10`. Pour repartir de zéro : supprimez `storage/config.php` et `storage/shop.sqlite`.

Options de `bin/install.php` : `--mysql --db-host=… --db-name=… --db-user=… --db-pass=…`, `--currency=EUR`, `--name="Nom"`, `--locale=ar`, `--no-demo`.

## 9. Structure du code

```
shop/
├── index.php              Point d'entrée unique (routeur)
├── .htaccess              Réécriture d'URL, protections, cache
├── install/               Assistant d'installation web
├── app/                   Code (inaccessible depuis le web)
│   ├── bootstrap.php      Chargement, session, gestion des erreurs
│   ├── routes.php         Table des routes
│   ├── controllers/       Boutique, tunnel de commande, administration
│   ├── payments/          Stripe, Konnect, Flouci
│   ├── views/             Gabarits PHP (shop, admin, emails)
│   ├── lang/              Traductions fr / ar / en
│   ├── schema.php         Tables (MySQL et SQLite)
│   └── seed.php           Pages légales et catalogue de démonstration
├── assets/                CSS, JS, images de démonstration
├── uploads/               Photos envoyées depuis l'admin
├── storage/               Configuration, base SQLite, journaux
└── bin/install.php        Installation en ligne de commande
```

Aucune dépendance externe : PHP natif (PDO, cURL, GD), CSS et JavaScript sans framework. Les montants sont stockés en entiers dans la plus petite unité de la devise (millimes, centimes) pour éviter toute erreur d'arrondi.

## 10. Livrer et revendre la boutique

Checklist de livraison au client :

- [ ] Domaine + HTTPS actifs, `base_url` en `https://`, redirection HTTPS décommentée dans `.htaccess`
- [ ] Logo, couleurs, coordonnées, réseaux sociaux renseignés
- [ ] Pages légales complétées (plus aucun `[ … ]`)
- [ ] Produits de démonstration supprimés, vrais produits en ligne
- [ ] Moyens de paiement testés en mode test, puis passés en production
- [ ] SMTP configuré et e-mail de test reçu (passez une commande test)
- [ ] Compte administrateur au nom du client (*Mon compte → Ajouter un administrateur*), votre accès retiré ou conservé selon le contrat de maintenance
- [ ] Sauvegardes automatiques activées chez l'hébergeur
- [ ] Sitemap déclaré dans Google Search Console (`/sitemap.xml`)
- [ ] Remise du [guide d'utilisation](docs/GUIDE-CLIENT.md) au client

Pour un nouveau client, générez une archive propre (sans configuration, base ni photos locales) avec `bin/package.sh` → `dist/boutique-AAAAMMJJ.zip`, à décompresser dans `public_html/`. Chaque installation est indépendante (sa base, sa configuration, ses photos).

## Démos prospects (Render)

`shop/demo/` génère une démo personnalisée par prospect : `demo/<nom>/seed.php` (réglages, catalogue, commandes d'exemple, via
`demo/lib.php`), `demo/<nom>/shop-name.txt` et `demo/<nom>/assets/` (illustrations, servies sous `assets/demo-<nom>/`).
`demo/Dockerfile` construit n'importe laquelle ; la variable `DEMO` choisit le dossier (par défaut `bluewhale`). Sur Render :
service Docker gratuit, `dockerContext: ./shop`, `dockerfilePath: ./shop/demo/Dockerfile`, variables `DEMO`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`. La base SQLite est recréée à chaque démarrage. Démos : `bluewhale` (bijoux, pierres), `foufaa` (coffrets cadeaux).

Test local d'une démo : copier la boutique dans un dossier vide, puis `sh demo/build.sh && DEMO=foufaa PORT=8051 sh demo/start.sh`.
