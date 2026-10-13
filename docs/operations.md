# Exploitation

## 0. Démarrage rapide

1. Créez les comptes : Supabase (Pro), Cloudflare (domaine, R2, Workers), Konnect, un serveur Ubuntu (Hetzner), un SMTP.
2. Sur le serveur, en root :
   ```bash
   curl -fsSL https://raw.githubusercontent.com/momobenmrad/App-shouf/main/scripts/bootstrap-server.sh | bash -s -- chouf.tn
   ```
   Le script installe Docker, ouvre le pare-feu, clone le dépôt dans `/opt/chouf` et génère `.env` avec des secrets aléatoires.
3. Complétez `/opt/chouf/.env` avec les clés des sections 1, 2 et 6 ci-dessous.
4. Vérifiez la configuration avant le premier démarrage :
   ```bash
   cd /opt/chouf && docker compose build && docker compose run --rm worker node dist/preflight.js
   ```
   Chaque ligne indique ✔, ⚠ (non bloquant) ou ✘ avec la correction à faire : secret de l'edge différent, CORS R2 sans `ETag`, migrations non appliquées, clé Konnect refusée, etc.
5. `docker compose up -d`, puis suivez les recettes de `docs/phase-*-tasks.md`.

## 1. Supabase

1. Créer un projet (région Europe, Francfort ou Paris : la plus proche du Maghreb). Prendre l'offre **Pro**, car l'offre gratuite se met en pause.
2. Appliquer le schéma : `supabase link --project-ref <ref>` puis `supabase db push`.
3. Dans Auth → URL Configuration : *Site URL* = `https://chouf.tn` et redirection `https://chouf.tn/api/auth/callback`.
4. Activer la confirmation d'e-mail et configurer un SMTP (Resend, Brevo…) : le SMTP intégré est limité.
5. Récupérer `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. La clé `service_role` reste côté serveur.
6. Promouvoir l'admin : `update profiles set role = 'admin' where id = '…';`

## 2. Cloudflare R2 et edge VOD

1. Créer le bucket `chouf-media`. **Ne pas** activer l'accès public.
2. Créer un jeton API R2 (lecture et écriture sur ce bucket), puis renseigner `S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`, `S3_ACCESS_KEY_ID` et `S3_SECRET_ACCESS_KEY`.
3. Ajouter cette règle CORS au bucket (uploads directs depuis le back-office) :

   ```json
   [
     {
       "AllowedOrigins": ["https://chouf.tn"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type", "cache-control"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   Sans `ExposeHeaders: ETag`, l'uploader ne peut pas finaliser l'envoi multipart.
4. Déployer l'edge :

   ```bash
   cd apps/edge
   npx wrangler secret put SIGNING_SECRET   # même valeur que PLAYBACK_SIGNING_SECRET
   npx wrangler deploy                      # route vod.chouf.tn (wrangler.toml)
   ```
5. Côté web : `VOD_BASE_URL=https://vod.chouf.tn`.
6. Optionnel : une règle de cycle de vie R2 qui passe `sources/` en *Infrequent Access* après 30 jours.

Pour changer de CDN (Bunny), il suffit d'un nouvel adaptateur qui implémente le même format d'URL signée (`packages/shared/src/signing.ts`). Le lecteur n'est pas touché.

## 3. Serveur applicatif

- Ubuntu LTS avec Docker. Pare-feu : seuls les ports 80 et 443 sont ouverts, SSH par clé uniquement.
- DNS : `chouf.tn` passe par le proxy Cloudflare (nuage orange). Caddy n'accepte **que** les IP Cloudflare (`infra/Caddyfile`), sinon l'en-tête `CF-IPCountry` du géo-blocage pourrait être falsifié. Tenez la liste à jour : https://www.cloudflare.com/ips/
- Avec Cloudflare en mode SSL *Full (strict)*, Caddy obtient lui-même son certificat.
- Déploiement : `git pull && docker compose up -d --build`. Arrêt propre du worker : 60 s (`stop_grace_period`). Un job interrompu est repris par BullMQ.
- Le volume `work` contient les fichiers temporaires de transcodage. Prévoyez environ 3 fois la taille de la plus grosse source.

## 4. Live : MediaMTX, gateway et CDN

### DNS et TLS
- `live-origin.chouf.tn` → IP du serveur, **sans** proxy Cloudflare (nuage gris) : la vidéo ne doit pas transiter par le proxy Cloudflare. Caddy sert ce nom et relaie vers la gateway.
- Petite audience : `LIVE_BASE_URL=https://live-origin.chouf.tn`.
- Au-delà de quelques centaines de spectateurs : créer une *pull zone* Bunny avec `live-origin.chouf.tn` comme origine, hostname `live.chouf.tn`, puis `LIVE_BASE_URL=https://live.chouf.tn`. Désactiver les zones de facturation inutiles (Asie, Afrique du Sud, Amérique du Sud). Les segments portent un chemin identique pour tous les spectateurs (`/s/<jeton scellé>`) : Bunny les met en cache une seule fois. Les playlists sont `no-store`, elles sont propres à chaque spectateur.
- Les `LIVE_ALLOWED_ORIGINS` de la gateway doivent contenir `https://chouf.tn`.

### Ingestion
- Ports à ouvrir : `1935/tcp` (RTMP) et `8890/udp` (SRT). `LIVE_INGEST_RTMP_URL=rtmp://live-origin.chouf.tn:1935`, `LIVE_INGEST_SRT_URL=srt://live-origin.chouf.tn:8890`.
- OBS : *Serveur* = `rtmp://live-origin.chouf.tn:1935/live/<slug>`, *Clé de stream* = la clé affichée à la création de l'événement. En SRT : `srt://live-origin.chouf.tn:8890?streamid=publish:live/<slug>:chouf:<clé>&passphrase=…` (SRT chiffre le transport ; RTMPS n'est pas exposé en Phase 2).
- Réglages encodeur conseillés : H.264, 1080p ou 720p, débit constant 4 à 6 Mb/s, intervalle d'images clés 2 s, AAC 128 kb/s.
- `MEDIAMTX_HOOK_SECRET` : identique dans `.env` (lu par MediaMTX et la gateway). Il authentifie les hooks de MediaMTX vers la gateway.

### Replay et enregistrements
- MediaMTX enregistre chaque événement dans le volume `recordings` (`/recordings/live/<slug>/…mp4`, fichiers d'une heure). À la fin de l'événement (ou au clic « Terminer »), le worker concatène, crée l'asset VOD et lance le transcodage. L'admin crée ensuite un titre depuis la page de l'événement.
- Les enregistrements ne sont jamais supprimés automatiquement. Une fois le replay prêt, nettoyer : `docker compose exec mediamtx rm -rf /recordings/live/<slug>`. Prévoir ~2,5 Go par heure à 5 Mb/s.

### Supervision des sources
- Le worker sonde chaque source activée toutes les 30 s. Panne confirmée après 3 échecs, retour après 5 succès (un seul succès suffit si la chaîne est entièrement hors service). Les alertes partent sur `ALERT_WEBHOOK_URL`.
- Une source dont la licence expire est désactivée à 00 h 05 (heure de Tunis) ; une chaîne sans source sous licence valide passe inactive. Les licences qui expirent dans moins de 30 jours s'affichent en orange dans `/admin/channels/<id>`.
- Le journal `/admin/incidents` garde l'historique ; les contrôles de santé bruts sont purgés après 30 jours.

### Guide des programmes (EPG)
- Sur chaque chaîne (`/admin/channels/<id>`), renseigner l'URL d'un fichier XMLTV et l'identifiant `<channel id="…">` de la chaîne dans ce fichier, puis « Importer le guide maintenant ». Le worker réimporte toutes les chaînes chaque nuit à 3 h 10 (heure de Tunis), sur une fenêtre de 6 h en arrière et 8 jours en avant.
- Le fichier XMLTV doit venir du diffuseur ou d'un fournisseur sous contrat (comme les flux).

## 5. Protection du contenu

- Par défaut, le worker chiffre toutes les nouvelles renditions en **HLS AES-128** (`TRANSCODE_PROTECTION=aes128`). La clé (16 octets) est propre à chaque vidéo et stockée avec les playlists : elle n'est accessible que par le chemin signé et limité dans le temps. Les vidéos déjà transcodées en clair restent en clair ; relancer leur transcodage les chiffre.
- Ce chiffrement empêche la lecture d'un segment récupéré hors de la plateforme, mais pas la capture d'écran ni l'extraction par un lecteur modifié : seul un DRM (Widevine, FairPlay, PlayReady) le fait. Pour l'activer plus tard :
  1. souscrire à un service de licences (EZDRM, PallyCon, Axinom) ;
  2. remplacer l'empaquetage ffmpeg par Shaka Packager (CMAF, CENC multi-clés) dans un `KeyProvider` `drm` (`apps/worker/src/protection.ts`) qui demande les clés au service ;
  3. ajouter une route `/api/drm/license` qui relaie la demande de licence du lecteur au service après avoir vérifié la session de lecture ;
  4. configurer `hls.js` (Widevine) et la lecture native Safari (FairPlay) avec cette route.
  Le téléchargement hors-ligne dépend de cette étape : sans DRM, un fichier téléchargé est un fichier copié.

## 6. Konnect

1. Ouvrir un compte marchand sur https://dashboard.konnect.network et récupérer la clé API et l'identifiant de wallet.
2. Tester d'abord en sandbox (`KONNECT_API_URL=https://api.sandbox.konnect.network/api/v2`), puis passer en production (`https://api.konnect.network/api/v2`).
3. Le webhook est `https://chouf.tn/api/payments/konnect/webhook`. L'URL est transmise à chaque paiement : rien à configurer côté Konnect.
4. Le statut est toujours revérifié auprès de Konnect avant d'accorder des droits. Le traitement est idempotent, donc un rejeu du webhook est sans risque.
5. **À vérifier avant la mise en ligne** : les noms de champs de l'API (`init-payment`, `payments/{ref}`) d'après la documentation Konnect en vigueur. Le code les parse de manière défensive (`apps/web/src/server/payments/konnect.ts`).

## 7. Sauvegardes et supervision

- Postgres : sauvegardes quotidiennes Supabase (offre Pro). Exporter aussi `pg_dump` chaque semaine vers un autre fournisseur.
- R2 : les HLS se régénèrent à partir des sources, donc ne supprimez pas `sources/` tant que vous n'avez pas de copie ailleurs.
- Alertes : renseigner `ALERT_WEBHOOK_URL` (Slack, Discord ou pont Telegram). Le worker y signale les transcodages définitivement échoués et les licences expirées.
- Disponibilité : Uptime Kuma (ou équivalent) sur `https://chouf.tn/ar` et `https://vod.chouf.tn/health`.

## 8. Rotation des secrets

- `PLAYBACK_SIGNING_SECRET` (web, gateway) et `SIGNING_SECRET` (edge) doivent changer en même temps. Les lectures en cours s'interrompent : leur token devient invalide et le lecteur doit être relancé.
- `MEDIAMTX_HOOK_SECRET` : changer la valeur dans `.env` puis `docker compose up -d mediamtx gateway`. Les diffusions en cours sont coupées.
- Clé de stream d'un événement : bouton « Régénérer la clé » dans `/admin/live/<id>`.
