# Chouf · شوف

Plateforme de streaming VOD et live pour le Maghreb : films, séries et chaînes sous licence. Interface en arabe (RTL), en français et en anglais.

- **Architecture et coûts** : [`docs/architecture.md`](docs/architecture.md)
- **Phase 1, tâches et état** : [`docs/phase-1-tasks.md`](docs/phase-1-tasks.md)
- **Exploitation** (R2, Cloudflare, Konnect, mise en production) : [`docs/operations.md`](docs/operations.md)

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `apps/web` | Next.js 16 : site viewer, back-office `/admin`, API (lecture signée, paiements, uploads) |
| `apps/worker` | Workers BullMQ : transcodage FFmpeg → HLS, tâches planifiées (abonnements, sessions, licences) |
| `apps/edge` | Passerelle VOD signée : Cloudflare Worker devant R2 en prod, serveur Node en dev |
| `packages/shared` | Types DB, schémas zod, signature des URLs, droits, échelle d'encodage, bascule des sources |
| `supabase` | Migrations SQL + RLS (source de vérité), seed, tests SQL |

## Prérequis

Node 22, pnpm 10, Docker, FFmpeg (pour les tests du worker) et la [Supabase CLI](https://supabase.com/docs/guides/cli).

## Démarrage local

```bash
pnpm install
cp .env.example apps/web/.env.local     # puis compléter les clés Supabase (voir `supabase status`)

supabase start                           # Postgres + Auth + Realtime, applique migrations et seed
export SUPABASE_SERVICE_ROLE_KEY=…       # depuis `supabase status`
docker compose -f docker-compose.dev.yml up -d --build   # Redis, SeaweedFS (S3), edge :8787, worker

pnpm --filter @chouf/web dev             # http://localhost:3000 → /ar
```

Pour devenir administrateur, créez un compte puis exécutez dans Supabase Studio (http://localhost:54323) :

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'vous@exemple.tn');
```

## Vérifications

```bash
pnpm typecheck && pnpm lint && pnpm test   # TypeScript, ESLint, Vitest (dont l'intégration FFmpeg)
pnpm test:db                               # migrations + tests RLS sur un Postgres jetable
```

## Production

Un serveur (Hetzner) avec Docker, Supabase Cloud, Cloudflare R2 et Workers :

```bash
cp .env.example .env && $EDITOR .env
docker compose up -d --build
pnpm --filter @chouf/edge deploy          # wrangler, après `wrangler secret put SIGNING_SECRET`
```

Les détails sont dans [`docs/operations.md`](docs/operations.md).
