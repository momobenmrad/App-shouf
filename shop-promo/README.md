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

**Offre 48 h** : après « dès 690 dinars », 690 est barré et remplacé par **590 DT pendant 48h**, puis un minuteur
48:00:00 défile jusqu'à la fin avec la date de fin écrite en clair. Prix et date : `OFFER` dans `src/episode1/timeline.ts`
— **mettre à jour `endsLabel` (48 h après l'heure réelle de publication) avant chaque rendu**, et respecter cette échéance.

```bash
npx remotion render Episode1 out/episode1-offre-48h.mp4 --codec=h264 --crf=16
```

**Légende proposée** :
> Épisode 1 : je crée des boutiques en ligne en Tunisie 🇹🇳 Site + appli, clé en main, sans abonnement. 🔥 590 DT au lieu de 690 DT pendant 48h (jusqu'au mer. 28 oct. à 23h59). Paiement à la livraison, Konnect, Flouci inclus. Commente « BOUTIQUE » pour la démo 👇
> #creationsiteweb #ecommercetunisie #boutiqueenligne #tunisie #entrepreneur

## FlownovaExplainer (70 s, darija)

Vidéo explicative de la marque Flownova avec la mascotte Nova : histoire d'Amira (vendeuse Instagram), 4 étapes (boutique + appli, commandes + e-mail client, paiements, ventes et stock), FAQ (prix, lien en bio), CTA « اكتب Flownova » et boucle.
Voix off darija ElevenLabs calée mot à mot (`public/audio/flownova/voice.mp3`), sous-titres RTL ; script et minutage dans `flownova-script.md`. Version sans musique : mux de `public/audio/flownova_voice.wav`.

```
python3 audio/make_audio_flownova.py
npx remotion render FlownovaExplainer out/flownova-explainer.mp4 --codec=h264 --crf=18
```

## FlownovaEp2 (26 s, darija) — « من إنستغرام لمتجر حقيقي »

Épisode 2 de la série Flownova (tient la promesse de l'Épisode 1, « je crée TA boutique ? ») : la page Instagram de Maison Nour (DMs sans réponse) devient une boutique + appli, puis une cliente commande en moins d'une minute (lien en bio → produit → taille → commande → confirmation) et la commande arrive. CTA « اكتب Flownova » et teaser de l'épisode 3, boucle.
Voix ElevenLabs `public/audio/flownova/ep2-voice.mp3`, minutage mot à mot dans `src/flownova/ep2.ts`.

```
python3 audio/make_audio_flownova_ep2.py
npx remotion render FlownovaEp2 out/flownova-episode2.mp4 --codec=h264 --crf=18
```

## FlownovaEp2Short (15 s) — version TikTok de l'épisode 2

La douleur du vendeur dès la 1re seconde (DM sans réponse), puis la boutique, une commande en moins d'une minute et
l'appel à l'action ; boucle. Réutilise la voix de l'épisode 2 découpée sur ses timestamps (aucune nouvelle génération).

```
python3 audio/make_audio_flownova_ep2_short.py
npx remotion render FlownovaEp2Short out/flownova-episode2-15s.mp4 --codec=h264 --crf=18
```

## FlownovaSigns (15 s, sans voix) — « 3 signes que ta page Instagram doit devenir une boutique »

Format texte + son tendance (aucun crédit ElevenLabs) : accroche « le n°3 fait mal », 3 signes avec indicateur 1/3, solution
boutique + appli, appel à l'action et boucle. `out/flownova-3-signes-sans-son.mp4` pour poser un son tendance dans TikTok.

```
python3 audio/make_audio_flownova_signs.py
npx remotion render FlownovaSigns out/flownova-3-signes.mp4 --codec=h264 --crf=18
```

## FlownovaStyles & FlownovaVsShopify (15 s, sans voix)

Vidéos texte + son tendance, dans la zone de sécurité TikTok (`src/flownova/safe.tsx`) :
- `FlownovaStyles` : même boutique (démo fictive « Maison Saphir »), thème Classique vs Luxe en curseur avant/après, « 1 ou 2 ? ».
- `FlownovaVsShopify` : comparatif honnête (Shopify garde l'avantage applis & thèmes, tarifs indicatifs en note) + dernier jour de l'offre 590 DT.

```
python3 audio/make_audio_flownova_wed.py
npx remotion render FlownovaStyles out/flownova-1-ou-2.mp4 --codec=h264 --crf=18
npx remotion render FlownovaVsShopify out/flownova-vs-shopify.mp4 --codec=h264 --crf=18
```

## Episode3 (15 s, voix FR) — « 2h du matin, tu dors… ta cliente commande »

Même format que l'Épisode 1 (meilleurs résultats) : voix off française ElevenLabs « Raphael » (`public/audio/voice/episode3.mp3`),
écran verrouillé qui reçoit les commandes la nuit, réveil avec les ventes de la nuit, puis offre du dernier jour (590 DT) et
appel à l'action ; zone de sécurité TikTok.

```
python3 audio/make_audio_episode3.py
npx remotion render Episode3 out/episode3-flownova.mp4 --codec=h264 --crf=18
```

### Épisode 4 — « Combien coûte une boutique en ligne en Tunisie ? » (15 s, FR)

Même format que les Épisodes 1 et 3 : voix « Raphael » (`public/audio/voice/episode4.mp3`), boutique démo Luxe qui défile
(`public/shots/luxe-home-full.png`), prix 690 DT « une seule fois », 0 abonnement, tout inclus, CTA « Commente Flownova ».

```bash
python3 audio/make_audio_episode4.py
npx remotion render Episode4 out/episode4-flownova.mp4 --codec=h264 --crf=18
```

### Épisode 5 — « Prix en inbox ? » (15 s, FR)

Voix « Raphael » (`public/audio/voice/episode5.mp3`) : la boîte de DM qui déborde de « Prix ? », puis la boutique démo Luxe
(fiche produit avec prix affiché → commande en 3 clics, paiement à la livraison → notification « Nouvelle commande »).
Captures `public/shots/e5-*.png` (390 px CSS, ×3).

```bash
python3 audio/make_audio_episode5.py
npx remotion render Episode5 out/episode5-flownova.mp4 --codec=h264 --crf=18
```

### Épisode 6 — « 6 boutiques, laquelle est la tienne ? » (16 s, FR, premium)

Vidéo de la page Démos Flownova (`vitrine/`) : voix « Raphael » (`public/audio/voice/episode6.mp3`, minutage Scribe),
titres serif dorés (Cormorant Garamond, `public/fonts/Cormorant-*.woff2`), téléphones en 3D, balayages de lumière, grain.
Écrans : `public/shots/demo-*.webp` (copiés de `vitrine/img/`) et `public/shots/demos-page.png`.

```bash
python3 audio/make_audio_episode6.py
npx remotion render Episode6 out/episode6-flownova-demos.mp4 --codec=h264 --crf=16
```

### Épisode 7 — « Ta page Insta piratée demain ? » (15,5 s, FR)

Voix « Raphael » (`public/audio/voice/episode7.mp3`) qui commence directement par l'accroche (pas d'« Épisode 7 » parlé) :
compte Insta piraté qui se vide → ta boutique t'appartient (site, clientes, commandes) → Insta en panne, la boutique vend.

```bash
python3 audio/make_audio_episode7.py
npx remotion render Episode7 out/episode7-flownova.mp4 --codec=h264 --crf=18
```
