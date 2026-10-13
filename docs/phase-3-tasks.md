# Phase 3 : tâches et état

- ✅ : livré et vérifié dans le dépôt.
- 📄 : conception documentée, pas de code (dépend d'un prestataire ou d'un projet séparé).

| # | Tâche | Critères de validation | État | Preuve |
|---|---|---|---|---|
| P3-T1 | **Profils multiples** : jusqu'à 5 profils par compte, profil par défaut créé à l'inscription, profils enfants plafonnés à 12+, progression et sessions par profil, sélecteur « Qui regarde ? », gestion (avatar, couleur, classification) | Un 6ᵉ profil est refusé ; un profil enfant ne voit ni les titres au-dessus de 12+, ni les événements live, ni les chaînes hors « jeunesse » ; deux profils gardent une progression distincte ; impossible d'écrire sur le profil d'un autre compte | ✅ | 7 assertions SQL |
| P3-T2 | **Chaînes 24/7 avec EPG** : import XMLTV (parseur sans dépendance), fenêtre 6 h / 8 jours, import nocturne et import immédiat, « en ce moment / à suivre », programme du jour, grille 6 h | Dates XMLTV avec décalage horaire ; titres multilingues ; chevauchements rognés ; un fichier commun à plusieurs chaînes est téléchargé une seule fois ; identifiant inconnu signalé avec les identifiants présents | ✅ | 6 + 3 tests |
| P3-T3 | **Recommandations** : tendances (spectateurs distincts sur 7 j), « Pour vous » (genres pondérés par l'historique), « Parce que vous avez regardé » (co-visionnage puis genres), rail « Dans le même esprit » sur les fiches | Titres déjà vus, brouillons et classifications interdites exclus ; co-visionnage prioritaire ; impossible d'interroger le profil d'un autre compte ; fonctions brutes non exposées | ✅ | 7 assertions SQL |
| P3-T4 | **Protection renforcée** : HLS AES-128 par défaut, clé par vidéo sous le chemin signé, interface `KeyProvider` | Segments chiffrés (plus d'octet de synchronisation TS en clair), `#EXT-X-KEY` relatif, clé de 16 octets envoyée avec les playlists, fichier d'info jamais envoyé | ✅ | test FFmpeg réel |
| P3-T5 | **DRM Widevine / FairPlay** | — | 📄 | `docs/operations.md` § 5 |
| P3-T6 | **Téléchargement hors-ligne** | — | 📄 | ci-dessous |
| P3-T7 | **Apps TV** | — | 📄 | ci-dessous |

## Vérifications effectuées ici

- `pnpm typecheck`, `pnpm lint`, `pnpm test` : 109 tests TypeScript (dont transcodage chiffré avec FFmpeg réel).
- `pnpm test:db` : 68 assertions SQL.
- Build Next.js de production.

## P3-T5 à P3-T7 : ce qui reste et pourquoi

**DRM.** Le chiffrement AES-128 protège les fichiers en transit et au repos, pas contre un lecteur modifié. Un DRM exige un service de licences tiers (EZDRM, PallyCon ou Axinom, à partir de quelques dizaines de dollars par mois) et un empaquetage CMAF/CENC (Shaka Packager). L'emplacement est prêt : un `KeyProvider` `drm` dans le worker, une route de licence côté web, la colonne `media_assets.protection = 'drm'`. La procédure est dans `docs/operations.md`.

**Hors-ligne.** Sans DRM, un téléchargement est une copie du fichier : inutile de le construire avant. Conception prévue : l'app mobile télécharge les segments CMAF chiffrés et une licence hors-ligne à durée limitée (Widevine L1/L3 « persistent license », FairPlay « offline »), la lecture se fait par le lecteur natif, l'expiration est appliquée par la licence. Côté serveur, il faudra : une table `downloads` (profil, asset, appareil, expiration), une limite par abonnement, et la route de licence acceptant le mode hors-ligne.

**Apps TV.** Un projet séparé (Expo / React Native avec `react-native-tvos` pour Android TV et tvOS ; Samsung Tizen et LG webOS acceptent une application web, donc une variante de la PWA actuelle). Il consomme les API déjà en place :
- auth Supabase (e-mail + mot de passe, puis code d'appairage à ajouter : l'utilisateur saisit un code affiché par la TV sur son téléphone) ;
- `POST /api/playback/session` et `/api/playback/heartbeat` pour la lecture signée, la reprise et la limite d'écrans ;
- `GET /api/live/viewers`, le catalogue via Supabase (RLS) ou des routes JSON à ajouter (`/api/catalog/home`, `/api/catalog/title/{slug}`) pour éviter d'embarquer la logique SQL dans l'app.
Le lecteur : ExoPlayer (Android TV) et AVPlayer (tvOS) lisent le HLS AES-128 nativement et supportent Widevine / FairPlay le jour où le DRM arrive.
