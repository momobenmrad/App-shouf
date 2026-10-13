# Chouf · شوف

Plateforme de streaming VOD et live pour le Maghreb : films, séries et chaînes sous licence. Interface en arabe (RTL), en français et en anglais.

- **Architecture et coûts** : [`docs/architecture.md`](docs/architecture.md)
- **Phase 1 (VOD), tâches et état** : [`docs/phase-1-tasks.md`](docs/phase-1-tasks.md)
- **Phase 2 (live), tâches et état** : [`docs/phase-2-tasks.md`](docs/phase-2-tasks.md)
- **Phase 3 (profils, EPG, recommandations, protection), tâches et état** : [`docs/phase-3-tasks.md`](docs/phase-3-tasks.md)
- **Exploitation** (R2, Cloudflare, Konnect, mise en production) : [`docs/operations.md`](docs/operations.md)

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `apps/web` | Next.js 16 : site viewer, back-office `/admin`, API (lecture signée, paiements, uploads) |
| `apps/worker` | Workers BullMQ : transcodage FFmpeg → HLS, supervision des sources (bascule, incidents, alertes), live-to-VOD, tâches planifiées |
| `apps/edge` | Passerelle VOD signée : Cloudflare Worker devant R2 en prod, serveur Node en dev |
| `apps/gateway` | Passerelle live : proxy HLS signé des chaînes sous licence et des événements MediaMTX, hooks d'ingestion |
| `packages/shared` | Types DB, schémas zod, signature des URLs, droits, échelle d'encodage, réécriture HLS, règles de supervision et de bascule |
| `supabase` | Migrations SQL + RLS (source de vérité), seed, tests SQL |

## Prérequis

Node 22, pnpm 10, Docker, FFmpeg (pour les tests du worker) et la [Supabase CLI](https://supabase.com/docs/guides/cli).

## Démarrage local

```bash
pnpm install
cp .env.example apps/web/.env.local     # puis compléter les clés Supabase (voir `supabase status`)

supabase start                           # Postgres + Auth + Realtime, applique migrations et seed
export SUPABASE_SERVICE_ROLE_KEY=…       # depuis `supabase status`
docker compose -f docker-compose.dev.yml up -d --build   # Redis, SeaweedFS (S3), edge :8787, worker, gateway :8788, MediaMTX

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
# sur le serveur, en root : Docker, pare-feu, clone dans /opt/chouf, .env avec secrets générés
curl -fsSL https://raw.githubusercontent.com/momobenmrad/App-shouf/main/scripts/bootstrap-server.sh | bash -s -- chouf.tn
$EDITOR /opt/chouf/.env                   # clés Supabase, R2, Konnect
cd /opt/chouf && docker compose build
docker compose run --rm worker node dist/preflight.js   # contrôle de la configuration
docker compose up -d
pnpm --filter @chouf/edge deploy          # wrangler, après `wrangler secret put SIGNING_SECRET`
```

Les détails sont dans [`docs/operations.md`](docs/operations.md).
