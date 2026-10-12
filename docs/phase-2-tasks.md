# Phase 2 (live) : tâches et état

- ✅ : livré et vérifié dans le dépôt.
- 🔌 : la recette finale nécessite un serveur avec MediaMTX, un encodeur (OBS) et un flux HLS sous licence.

| # | Tâche | Critères de validation | État | Preuve |
|---|---|---|---|---|
| P2-T1 | **Schéma** : `live_events`, clés de stream séparées (`live_event_keys`, accès service uniquement), `chat_messages`, sessions live, état de supervision des sources | Un viewer ne lit ni les clés ni les événements non publiés ; une clé valide autorise la publication, une clé fausse ou un événement terminé la refuse ; chat limité à 5 messages / 10 s, nom d'affichage imposé par trigger, modération admin | ✅ | 15 assertions SQL |
| P2-T2 | **Partagé** : réécriture des playlists HLS, URLs amont scellées (AES-GCM), règles d'interprétation d'un contrôle (lenteur, gel, fin de flux) | Aucune URL amont ne subsiste après réécriture ; un jeton scellé expiré, falsifié ou d'un autre secret est refusé ; gel détecté seulement après 45 s | ✅ | 13 tests |
| P2-T3 | **Gateway live** (Hono) : proxy signé des chaînes (`/c`) et des événements (`/e`), segments scellés cacheables (`/s`), hooks MediaMTX (auth par clé, ready / not-ready avec délai de tolérance), garde anti-SSRF | Master, variante et segment servis sans exposer l'amont ; 403 sur jeton invalide ; 404 chaîne hors ligne ; 503 amont indisponible ; publication refusée sans clé ; fin d'événement différée puis annulée si l'encodeur revient | ✅ | 8 tests |
| P2-T4 | **Worker** : supervision des sources (toutes les 30 s), hystérésis, bascule et retour, incidents, alertes dédupliquées, purge ; live-to-VOD | Panne → `degraded` puis `down` au 3ᵉ échec → bascule + incident + alerte ; retour à la principale après 5 contrôles sains ; chaîne hors service une seule alerte ; playlist figée = panne ; replay concaténé, asset créé, transcodage mis en file | ✅ | 17 tests (dont FFmpeg réel) |
| P2-T5 | **Web viewer** : page `/live`, lecteur live (reconnexion sur bascule), sessions signées avec géo-blocage par licence, compteur de spectateurs (Redis, fenêtre 30 s), chat temps réel | Territoire hors licence → 451 ; événement non diffusé → 409 ; abonnement requis → 402 ; limite de flux → 409 | ✅ 🔌 | 5 tests |
| P2-T6 | **Back-office** : chaînes et sources (licence obligatoire), tableau de santé (latence, débit, historique de 40 contrôles), journal des incidents, événements (clé affichée une fois, rotation, fin manuelle, replay → titre VOD) | Pages rendues, actions protégées par RLS admin, rafraîchissement temps réel | ✅ 🔌 | build Next.js |
| P2-T7 | **Déploiement** : MediaMTX (RTMP, SRT, HLS fMP4, enregistrement), gateway, Caddy (`live-origin`), Compose prod et dev, CI | `docker compose config` valide pour les deux stacks ; YAML MediaMTX valide | ✅ | |

## Vérifications effectuées ici

- `pnpm typecheck`, `pnpm lint`, `pnpm test` : 100 tests TypeScript.
- `pnpm test:db` : 53 assertions SQL (RLS, facturation, sessions, chat, clés de stream).
- Build Next.js de production (34 routes).

## Non vérifié sans infrastructure réelle

- L'ingestion RTMP / SRT depuis OBS vers MediaMTX, et les hooks MediaMTX → gateway (le format des hooks est celui de MediaMTX 1.x ; vérifier la version déployée).
- Le comportement avec un vrai flux HLS sous licence (variantes, DRM éventuel, en-têtes exigés par le fournisseur).
- Bunny CDN devant `live-origin`.

## Recette avec l'infrastructure

1. `docker compose up -d --build` puis vérifier `docker compose logs mediamtx gateway`.
2. Créer un événement dans `/admin/live`, copier la clé, configurer OBS : serveur `rtmp://<serveur>:1935/live/<slug>`, clé = la clé.
3. Démarrer la diffusion : l'événement passe « en direct » dans le back-office, la page `/live/event/<slug>` lit le flux, le compteur de spectateurs et le chat fonctionnent.
4. Arrêter OBS : au bout du délai de tolérance, l'événement passe « terminé », le replay apparaît dans `/admin/media` puis sur la page de l'événement.
5. Ajouter une chaîne avec une source principale et une source de secours ; couper la principale et observer la bascule dans `/admin/channels` et le journal des incidents.
