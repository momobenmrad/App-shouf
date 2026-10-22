# Vidéo TikTok de démonstration — Boutique

Vidéo verticale 1080×1920, 29 s, 30 i/s, codée avec [Remotion](https://www.remotion.dev) en suivant les [agent skills officiels Remotion](https://github.com/remotion-dev/skills) (`npx skills add remotion-dev/skills`). Les captures d'écran sont celles de la vraie boutique (`../shop`). La musique et les bruitages sont générés par `audio/make_audio.py` : aucun droit d'auteur.

## Fichiers produits (`out/`, non versionnés)

| Fichier | Usage |
|---|---|
| `boutique-tiktok.mp4` | Version complète : beat 120 BPM calé sur les coupes + bruitages |
| `boutique-tiktok-sans-musique.mp4` | Bruitages seuls : à publier avec un **son tendance** ajouté dans TikTok |
| `couverture.jpg` | Image de couverture (frame 60) |

## Déroulé (une coupe tous les 2 à 4 temps)

| Temps | Scène | Message |
|---|---|---|
| 0–3 s | Accroche | « J'ai codé une boutique en ligne COMPLÈTE — Pas Shopify. Pas WordPress. 0 abonnement. » |
| 3–7 s | Accueil | Défilement de la page d'accueil mobile |
| 7–12 s | Produit | Choix de taille → ajout au panier → notification |
| 12–16 s | Commande | Paiement à la livraison, Konnect, Flouci, Stripe → « Merci Sana ! » |
| 16–19 s | Langues | Français → العربية → English |
| 19–23 s | Admin | Tableau de bord et produits |
| 23–25,5 s | Fonctionnalités | Rafale de 8 atouts |
| 25,5–29 s | Appel à l'action | « Commente BOUTIQUE » |

## Refaire / modifier la vidéo

```bash
npm i
python3 audio/make_audio.py            # régénère la bande-son (numpy requis)
npx remotion studio                     # aperçu interactif
npx remotion render BoutiqueTikTok out/boutique-tiktok.mp4 --codec=h264 --crf=16
```

- Textes et timings : `src/Scenes.tsx` (les mots entre `*astérisques*` sont surlignés, `_` = espace) ; durée des scènes : `src/theme.ts` ; positions des bruitages : `audio/make_audio.py` (mêmes numéros d'images).
- Nouvelles captures : lancer la boutique (`php -S localhost:8000 index.php` dans `../shop`), refaire des captures mobiles 390×844 et remplacer `public/shots/*`.
- Réseau restreint : si Remotion ne peut pas télécharger son Chrome, indiquez un Chromium local avec `REMOTION_CHROME=/chemin/vers/chrome`. Les polices (Inter, Cairo) sont incluses dans `public/fonts`.
- Licence Remotion : gratuite pour les particuliers et les entreprises jusqu'à 3 personnes ; au-delà, voir remotion.pro/license.

## Kit de publication TikTok

**Légende** (≤ 150 caractères visibles) :
> Ta boutique en ligne sans abonnement Shopify 🛍️ Paiement à la livraison, Konnect, Flouci… Commente « BOUTIQUE » pour la démo 👇

**Hashtags** : `#ecommerce #boutiqueenligne #siteweb #developpeurweb #entrepreneur #tunisie #maroc #algerie #businessenligne #pourtoi`

**Conseils** :
1. Publier la version **sans musique** et ajouter un son tendance depuis la bibliothèque TikTok (volume du son ≈ 20–30 %, bruitages à 100 %) : TikTok favorise les sons de sa bibliothèque.
2. Épingler un commentaire « Commente BOUTIQUE et je t'envoie la démo » et répondre aux commentaires **en vidéo** (format qui relance la portée).
3. Créneau conseillé : 12 h–14 h ou 19 h–22 h, heure locale de la cible.
4. Décliner la même vidéo avec d'autres accroches (même montage, première phrase différente) et garder celle qui retient le mieux à 3 s dans TikTok Analytics :
   - « POV : ton client veut une boutique en ligne mais refuse de payer Shopify tous les mois »
   - « Combien coûte un site e-commerce en 2026 ? Moins que tu crois. »
   - « J'ai livré cette boutique en 3 minutes d'installation »
