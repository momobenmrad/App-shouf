# Phase 1 (VOD) : tâches ordonnées

Chaque tâche se termine par un commit. ✅ = livré dans ce dépôt ; ⏳ = nécessite des comptes externes (Supabase, R2, Konnect) pour la validation de bout en bout.

| # | Tâche | Critères de validation | État |
|---|---|---|---|
| T0 | **Socle du monorepo** : pnpm workspaces, TypeScript strict, ESLint, Vitest, `.env.example` | `pnpm install && pnpm typecheck && pnpm test` passent | ✅ |
| T1 | **Schéma DB + RLS** : migrations (catalogue, médias, lecture, abonnements, chaînes), `is_admin()`, triggers, seed | Les migrations s'appliquent sur un Postgres vierge ; les tests pgTAP RLS passent (un viewer ne lit ni `channel_sources` ni les titres `draft`, ne peut pas devenir admin, ne modifie que sa progression) | ✅ |
| T2 | **Package partagé** : types DB, schémas zod, signature HMAC des URLs, calcul des droits, échelle FFmpeg, logique de bascule des sources | Tests unitaires : signature valide, expirée ou falsifiée ; droits free, abonné, expiré, géo ; échelle plafonnée à la source ; bascule et retour avec hystérésis | ✅ |
| T3 | **Edge VOD** (Hono) : vérification du token dans le chemin, lecture R2/S3, cache, CORS, types MIME | Tests : 403 si signature invalide ou expirée, 200 et bon `Content-Type` sinon ; fonctionne en Node (dev) et en Worker (prod) | ✅ |
| T4 | **Worker de transcodage** : BullMQ, ffprobe, ffmpeg multi-renditions, progression, upload HLS, retries | Test d'intégration : une mire de 4 s produit `master.m3u8` + renditions ≤ source ; un job en échec passe à `failed` avec l'erreur | ✅ |
| T5 | **Web : socle** : Next.js 16, Tailwind 4, next-intl ar/fr/en (RTL), client Supabase SSR, proxy d'auth, layout et navigation | `/ar` en `dir="rtl"`, `/fr` et `/en` en LTR ; `pnpm build` passe | ✅ |
| T6 | **Auth** : inscription, connexion, déconnexion, compte | Création de compte → profil `viewer` créé par trigger ; `/admin` redirige un viewer | ✅ ⏳ |
| T7 | **Catalogue et recherche** : accueil (rails), fiche titre, saisons et épisodes, recherche trigram | Seuls les titres publiés s'affichent ; la recherche trouve un titre malgré une faute de frappe (trigram) en arabe, français ou anglais | ✅ ⏳ |
| T8 | **Lecteur** : hls.js, session de lecture signée, reprise, heartbeat, limite de flux, sélection de qualité | Reprise à ±5 s ; 3ᵉ flux simultané refusé (409) ; contenu abonné refusé sans abonnement (402) ; hors territoire (451) | ✅ ⏳ |
| T9 | **Abonnement** : offres, checkout Konnect, webhook vérifié, application idempotente, expiration | Deux webhooks identiques prolongent une seule fois ; un paiement non `completed` chez Konnect ne donne aucun droit | ✅ ⏳ |
| T10 | **Back-office** : tableau de bord, CRUD titres, saisons et épisodes, upload multipart avec reprise, suivi temps réel du transcodage, relance | Upload d'1 Go interrompu puis repris sans renvoyer les parts déjà envoyées ; la progression du transcodage s'affiche en direct | ✅ ⏳ |
| T11 | **Déploiement** : Dockerfiles, `docker-compose.yml` (prod), `docker-compose.dev.yml` (MinIO + edge), Caddy, `wrangler.toml`, CI GitHub Actions | `docker compose config` valide ; la CI exécute lint, typecheck, tests et pgTAP | ✅ |

## Recette de bout en bout (à faire avec les vrais comptes)

1. Créer le projet Supabase, lancer `supabase db push`, renseigner `.env`.
2. Créer le bucket R2 + CORS (voir `docs/operations.md`), déployer l'edge (`pnpm --filter @chouf/edge deploy`).
3. Sur le serveur : `docker compose up -d --build`.
4. Promouvoir son compte : `update profiles set role = 'admin' where id = '…';`
5. Uploader un film, attendre `ready`, le publier, le regarder depuis un compte viewer en mode free puis subscriber.
6. Payer en sandbox Konnect, vérifier la prolongation de l'abonnement.
