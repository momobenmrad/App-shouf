# Kit démo Chouf

Une démo complète de Chouf sur votre ordinateur, avec une seule commande : catalogue, lecture vidéo,
profils (dont un profil enfant), chaînes en direct avec bascule sur la source de secours, événement live
avec chat, guide des programmes et back-office.

Tout est fictif : comptes de démonstration, vidéo de test (mire + son), chaînes simulées. Rien n'est
envoyé sur internet et aucun flux réel n'est utilisé.

## 1. Installer Docker (une seule fois)

- **Windows / Mac** : installez [Docker Desktop](https://www.docker.com/products/docker-desktop/) et lancez-le
  (l'icône de la baleine doit être visible). Sous Windows, acceptez l'installation de WSL 2 si elle est proposée.
- **Linux** : `curl -fsSL https://get.docker.com | sh`

Il faut environ 4 Go d'espace disque et 4 Go de mémoire libres.

## 2. Récupérer le projet

Avec git : `git clone https://github.com/momobenmrad/App-shouf.git`
Sans git : sur GitHub, bouton **Code → Download ZIP**, puis décompressez l'archive.

## 3. Lancer la démo

Ouvrez un terminal (PowerShell sous Windows) dans le dossier du projet, puis :

```bash
docker compose -f docker-compose.demo.yml up --build
```

La première fois, la construction prend 5 à 10 minutes. Quand le message
`Chouf démo : http://localhost:3000` apparaît, ouvrez **http://localhost:3000** dans votre navigateur.

| Compte | Mot de passe | Rôle |
| --- | --- | --- |
| `samir@demo.tn` | `demo1234` | Abonné, avec un profil enfant « Yasmine » |
| `leila@demo.tn` | `demo1234` | Sans abonnement : seuls les contenus gratuits sont lisibles |
| `admin@demo.tn` | `demo1234` | Administrateur (menu « Administration ») |

## À essayer

- **Accueil** : mise en avant, « Continuer à regarder », tendances, recommandations.
- **Lecture** : ouvrez un titre puis « Regarder » ; changement de qualité 360p / 720p dans le lecteur.
- **Profils** : avec Samir, choisissez « Yasmine » : seuls les contenus jeunesse restent visibles.
- **Langues** : sélecteur en haut à droite (العربية affiche l'interface de droite à gauche).
- **Direct** : chaînes Watania 1, Hannibal TV (sa source principale est en panne : la lecture passe sur
  le secours), guide des programmes, finale en direct avec chat.
- **Administration** (compte admin) : catalogue, médias, chaînes et sources avec licences, incidents,
  événements live, import de playlist M3U.

## Arrêter, relancer, remettre à zéro

- Arrêter : `Ctrl+C` dans le terminal, ou `docker compose -f docker-compose.demo.yml down`.
- Relancer : `docker compose -f docker-compose.demo.yml up` (les données sont conservées).
- Remettre les données de démo à zéro : `docker compose -f docker-compose.demo.yml down -v`, puis relancer.
  Le guide des programmes est daté au moment de la création de la base : remettez à zéro pour le recaler.
- Après une mise à jour du projet : relancez avec `--build`.

## Ouvrir la démo depuis un autre appareil (téléphone, TV)

Remplacez `localhost` par l'adresse IP de l'ordinateur sur votre réseau, par exemple `192.168.1.20` :

```bash
DEMO_HOST=192.168.1.20 docker compose -f docker-compose.demo.yml up
```

Sous Windows (PowerShell) : `$env:DEMO_HOST="192.168.1.20"; docker compose -f docker-compose.demo.yml up`.
Ouvrez ensuite `http://192.168.1.20:3000` sur l'appareil.

## Limites de la démo

- Pas d'inscription ni d'e-mails : utilisez les comptes ci-dessus.
- Pas d'envoi de vidéos ni de transcodage (pas de stockage S3 ni de worker) ; toutes les vidéos jouent la même mire.
- Paiement Konnect non configuré : le bouton de paiement affiche une erreur, c'est normal.
- Chat et tableaux de bord sans mise à jour en temps réel (rechargez la page).
- Les ports 3000, 8787, 8788 et 54321 doivent être libres.

## Ce que contient le kit

`docker-compose.demo.yml` démarre quatre conteneurs :

- `db` : PostgreSQL avec exactement les migrations de production, plus le contenu de démo (`demo/db/seed-demo.sql`) ;
- `postgrest` : l'API REST, comme dans Supabase ;
- `redis` : compteurs de lecture simultanée et de spectateurs ;
- `app` : le site (Next.js), la passerelle live, et des remplaçants de démonstration pour l'authentification
  Supabase et le CDN vidéo (`demo/mock/server.mjs`). La vidéo de test est générée pendant la construction
  (`demo/media/make.sh`).

Les secrets de ce kit sont publics et fixes : **ne l'utilisez jamais en production**.
Pour la mise en ligne, voir `docs/operations.md`.
