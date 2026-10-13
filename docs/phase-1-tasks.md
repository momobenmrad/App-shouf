# Phase 1 (VOD) : tâches ordonnées

Chaque tâche a fait l'objet d'au moins un commit.
- ✅ : livré et vérifié dans le dépôt.
- 🔌 : la recette finale nécessite les comptes externes (Supabase, Cloudflare R2/Workers, Konnect).

| # | Tâche | Critères de validation | État | Preuve |
|---|---|---|---|---|
| T0 | **Socle du monorepo** : pnpm workspaces, TypeScript strict, ESLint, Vitest, `.env.example` | `pnpm install && pnpm typecheck && pnpm lint && pnpm test` passent | ✅ | 64 tests verts |
| T1 | **Schéma DB + RLS** : 5 migrations, `is_admin()`, triggers, fonctions transactionnelles, seed | Migrations appliquées sur un Postgres vierge. Un viewer ne lit ni `channel_sources` ni les brouillons, ne peut pas devenir admin, ne modifie que sa progression, ne peut ni s'octroyer un abonnement ni appeler les fonctions de facturation | ✅ | `pnpm test:db` : 38 assertions |
| T2 | **Package partagé** : types DB, schémas zod, signature HMAC, droits, échelle FFmpeg, bascule des sources, licences | Signature valide, expirée ou falsifiée ; droits free, abonné, expiré, géo (fermé si pays inconnu) ; échelle plafonnée ; hystérésis 3 échecs / 5 succès | ✅ | 35 tests |
| T3 | **Edge VOD** (Hono) : token dans le chemin, R2/S3, cache sur l'objet, CORS | 403 si signature invalide ou expirée ; types MIME corrects ; build Worker (`wrangler --dry-run`) et Node | ✅ | 5 tests + e2e |
| T4 | **Worker de transcodage** : BullMQ, ffprobe, FFmpeg multi-renditions, progression, poster, upload, retries ; tâches planifiées (expiration des abonnements, sessions, licences) | Une mire produit `master.m3u8` et des renditions ≤ source ; un échec repasse en file puis `failed` à la dernière tentative | ✅ | 8 tests avec vrai FFmpeg |
| T5 | **Web : socle** : Next.js 16, Tailwind 4, next-intl ar/fr/en, Supabase SSR, `proxy.ts` | `/ar` en `dir="rtl"`, `/fr` et `/en` en LTR ; `pnpm build` ; image Docker démarrée | ✅ | smoke test du conteneur |
| T6 | **Auth** : inscription, connexion, déconnexion, langue du profil | Profil `viewer` créé par trigger (testé en SQL) ; `/admin`, `/account`, `/watch` redirigent vers la connexion | ✅ 🔌 | |
| T7 | **Catalogue et recherche** : accueil (hero, rails, « continuer »), fiche titre, saisons et épisodes, recherche trigram normalisée (accents, alif, tashkeel) | Seuls les titres publiés s'affichent ; faute de frappe tolérée ; recherche en arabe | ✅ 🔌 | tests SQL |
| T8 | **Lecteur** : hls.js / HLS natif Safari, session signée, reprise, heartbeat + `sendBeacon`, qualité, limite de flux | 401, 402 (abonnement), 451 (géo), 409 (3ᵉ flux), 425 (pas prêt) ; reprise hors générique | ✅ 🔌 | 8 tests + SQL |
| T9 | **Abonnement** : offres, checkout Konnect, webhook revérifié auprès de Konnect, application idempotente | Double webhook = une seule prolongation ; paiement en attente, échoué ou au mauvais montant = aucun droit | ✅ 🔌 | 5 tests + SQL |
| T10 | **Back-office** : tableau de bord, CRUD titres, saisons et épisodes, affiches, upload multipart avec reprise, suivi temps réel, relance | Upload repris sans renvoyer les parts déjà présentes (ListParts) ; progression via Realtime | ✅ 🔌 | 3 tests + e2e upload |
| T11 | **Déploiement** : Dockerfiles, Compose prod et dev, Caddy (accès réservé à Cloudflare), `wrangler.toml`, CI | `docker compose config` valide ; image web construite et lancée ; stack de dev (SeaweedFS + bucket) démarrée | ✅ | |

## Test de bout en bout réalisé (sans comptes externes)

SeaweedFS (S3), worker et edge réels :
1. upload multipart via URLs présignées, comme le navigateur, avec l'ETag exposé en CORS ;
2. transcodage d'un 720p de 8 s en 240p, 360p, 480p et 720p ;
3. lecture du manifeste, d'une variante et d'un segment via l'edge avec URL signée ;
4. 403 pour un token falsifié, un token expiré et un accès anonyme direct au bucket.

Ce test a révélé un vrai bug, corrigé depuis : le SDK AWS ajoutait un checksum CRC32 aux URLs présignées, ce qui cassait les uploads du navigateur.

## Recette finale avec les vrais comptes

1. Créer le projet Supabase, `supabase link` puis `supabase db push`. Renseigner `.env`.
2. Créer le bucket R2 et sa règle CORS, puis déployer l'edge (voir `docs/operations.md`).
3. Sur le serveur : `docker compose up -d --build`.
4. Promouvoir son compte : `update profiles set role = 'admin' where id = '…';`
5. Uploader un film, attendre `ready`, le publier, le regarder depuis un compte viewer en free puis en subscriber.
6. Payer en sandbox Konnect et vérifier la prolongation dans `/account`.
