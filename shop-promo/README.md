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

---

# Vidéo 2 — « Boutique premium » (avant / après + commandes)

Composition `BoutiquePremium` (`src/premium/`), 25 s, 1080×1920. Concept tiré de la recherche sur les formats qui marchent :
les **refontes « premium »** (vidéos à plusieurs millions de vues selon Creative Bloq) et le **son de commande e-commerce**
(page TikTok « Shopify Order Sounds » : ~893 000 publications), appliqués à une boutique. Le « ka-ching » est synthétisé
(pas le son de Shopify).

| Temps | Scène |
|---|---|
| 0–2 s | Le résultat flashé ½ s → rembobinage → l'**AVANT** (vieux site fictif, `public/shots/before.png`) + tampon « AVANT » |
| 2–6 s | Curseur avant / après qui révèle la nouvelle boutique, flash sur le temps fort |
| 6–11 s | 3 preuves : design premium, panier en 1 tap, paiement à la livraison |
| 11–17 s | Écran verrouillé : notifications « Nouvelle commande » en rafale, total qui grimpe (mention « commandes simulées ») |
| 17–21 s | Plateforme à abonnement vs site sur mesure |
| 21–25 s | « Commente SITE et je fais l'avant / après de TA boutique gratuitement » |

```bash
python3 audio/make_audio_premium.py
npx remotion render BoutiquePremium out/boutique-premium.mp4 --codec=h264 --crf=16
npx remotion still BoutiquePremium out/couverture-premium.jpg --frame=40
```

Timings partagés : `src/premium/timeline.ts` ↔ `audio/make_audio_premium.py`.

**Légende proposée** :
> Boutique en ligne : avant / après 😳 De « envoyez-nous un message » à un vrai site qui encaisse. Commente « SITE » pour l'avant/après de ta boutique 👇
> #siteweb #ecommerce #boutiqueenligne #webdesign #avantapres

**Honnêteté publicitaire** : les commandes affichées sont une démo, d'où la mention « commandes simulées ». Ne pas la retirer ni présenter ces montants comme des résultats réels.

---

# Vidéo 2b — « Boutique premium » 15 s avec voix off

Composition `BoutiquePremium15` (`src/premium15/`), 15 s, refaite après l'analyse TikTok de la vidéo 1
(décrochage à 0:02, 12 % de visionnage moyen) :

- **Image 0 complète** : accroche lisible tout de suite (« Si ta boutique ressemble à ÇA… ») + téléphone coupé AVANT | APRÈS.
- **Accroche orientée commerçant** et **voix off française** ElevenLabs (voix « Raphael — Publicité, shorts, social media »,
  modèle `eleven_v4`, prise 1 : `public/audio/voice/take1.mp3`). Les scènes sont calées sur les pauses mesurées de cette prise.
- **Boucle** : la dernière seconde revient exactement à l'image 0.

```bash
python3 audio/make_audio_premium15.py   # mixe voix + beat (atténué sous la voix) + bruitages
npx remotion render BoutiquePremium15 out/boutique-premium-15s.mp4 --codec=h264 --crf=16
```

Pour changer de prise ou de texte : régénérer la voix, remplacer `take1.mp3`, puis réajuster les numéros d'images dans
`src/premium15/timeline.ts` et `audio/make_audio_premium15.py` (repérer les pauses avec
`ffmpeg -i take1.mp3 -af silencedetect=noise=-30dB:d=0.07 -f null -`).

---

# Vidéo 3 — « Épisode 1 » : boutique + appli, sans abonnement, dès 690 DT

Composition `Episode1` (`src/episode1/`), 14 s, voix off ElevenLabs (même voix « Raphael ») `public/audio/voice/episode1.mp3`.
Corrections issues des statistiques TikTok : mouvement dès l'image 0 (le téléphone défile déjà), format **série** (badge
« ÉPISODE 1 », teaser « Épisode 2 »), **mots-clés de recherche écrits à l'écran** (« Création site e-commerce · Tunisie »,
ligne en arabe à la fin), boucle parfaite, offre concrète (prix réel « dès 690 DT » au lieu d'un superlatif invérifiable).
L'appli montrée est la PWA réellement intégrée à la boutique (`shop/app/controllers/pwa.php`).

```bash
python3 audio/make_audio_episode1.py
npx remotion render Episode1 out/episode1-boutique-appli.mp4 --codec=h264 --crf=16
```

**Légende proposée** :
> Épisode 1 : je crée des boutiques en ligne en Tunisie 🇹🇳 Site + appli, clé en main, sans abonnement, dès 690 DT. Paiement à la livraison, Konnect, Flouci inclus. Commente « BOUTIQUE » pour la démo 👇
> #creationsiteweb #ecommercetunisie #boutiqueenligne #tunisie #entrepreneur
