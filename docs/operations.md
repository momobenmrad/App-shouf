# Exploitation

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

## 4. Konnect

1. Ouvrir un compte marchand sur https://dashboard.konnect.network et récupérer la clé API et l'identifiant de wallet.
2. Tester d'abord en sandbox (`KONNECT_API_URL=https://api.sandbox.konnect.network/api/v2`), puis passer en production (`https://api.konnect.network/api/v2`).
3. Le webhook est `https://chouf.tn/api/payments/konnect/webhook`. L'URL est transmise à chaque paiement : rien à configurer côté Konnect.
4. Le statut est toujours revérifié auprès de Konnect avant d'accorder des droits. Le traitement est idempotent, donc un rejeu du webhook est sans risque.
5. **À vérifier avant la mise en ligne** : les noms de champs de l'API (`init-payment`, `payments/{ref}`) d'après la documentation Konnect en vigueur. Le code les parse de manière défensive (`apps/web/src/server/payments/konnect.ts`).

## 5. Sauvegardes et supervision

- Postgres : sauvegardes quotidiennes Supabase (offre Pro). Exporter aussi `pg_dump` chaque semaine vers un autre fournisseur.
- R2 : les HLS se régénèrent à partir des sources, donc ne supprimez pas `sources/` tant que vous n'avez pas de copie ailleurs.
- Alertes : renseigner `ALERT_WEBHOOK_URL` (Slack, Discord ou pont Telegram). Le worker y signale les transcodages définitivement échoués et les licences expirées.
- Disponibilité : Uptime Kuma (ou équivalent) sur `https://chouf.tn/ar` et `https://vod.chouf.tn/health`.

## 6. Rotation du secret de signature

Mettre à jour `PLAYBACK_SIGNING_SECRET` (web) et `SIGNING_SECRET` (edge) en même temps. Les lectures en cours s'interrompent : leur token devient invalide et le lecteur doit être relancé.
