# Tawa · توّا

Application de taxi pour la Tunisie : le client écrit sa destination **comme il parle** (derja, arabe, français ou arabizi), l'app comprend le lieu, calcule l'itinéraire réel, la durée selon le trafic et le **prix avant de monter**, puis suit le chauffeur en direct avec **alerte de détour**. Un back-office gère les courses, les chauffeurs, les tarifs par ville et la **marque blanche** (nom, couleurs).

## Ce qui marche aujourd'hui

| Fonction | Détail |
|---|---|
| Adresses en derja | « حذا مونوبري المنار », « 9odem el bardo », « près de l'hôpital Charles Nicolle ». 1) dictionnaire de lieux tunisiens intégré (`src/lib/geocode/gazetteer.ts`), 2) Claude extrait repère / quartier / ville si `ANTHROPIC_API_KEY` est défini, 3) OpenStreetMap (Nominatim) |
| Distance et durée | Itinéraire routier réel via OSRM + OpenStreetMap, durée corrigée par un profil de trafic (heures de pointe à Tunis) |
| Prix | Prise en charge + km + minutes, tarif de nuit (21 h–5 h), minimum, arrondi à 100 millimes, commission plateforme. Tarifs modifiables par ville dans le back-office |
| Course | Recherche du chauffeur, acceptation, arrivée, course, fin, note. Suivi sur carte toutes les 2 s |
| Anti-fraude | Écart à l'itinéraire > 250 m détecté et enregistré (affiché au client et au back-office) |
| Paiement | Espèces ; Konnect / Flouci / D17 sélectionnables et enregistrés (encaissement en ligne : à brancher) |
| Chauffeurs | Inscription, passage en ligne, position GPS (ou clic sur la carte sans GPS), courses proches, gain affiché |
| Back-office `/admin` | Indicateurs du jour, courses par heure, dernières courses, chauffeurs, tarifs par ville, marque blanche |
| Mode démo | `DEMO_MODE=true` : 10 chauffeurs simulés (Tunis, Sousse, Sfax) acceptent et roulent tout seuls, avec un détour volontaire pour montrer l'alerte. Un vrai chauffeur en ligne à moins de 6 km reste prioritaire 20 s |
| Langues | Interface en derja (arabe, RTL) et français |

## Pile technique

Next.js 16 (App Router, TypeScript) · Postgres · Leaflet + tuiles OpenStreetMap · OSRM · Nominatim · Claude (`@anthropic-ai/sdk`) · Vitest.

```
src/lib/geo.ts            distances, point ↔ itinéraire
src/lib/pricing.ts        calcul du prix
src/lib/traffic.ts        profil de trafic
src/lib/routing.ts        OSRM (+ estimation si indisponible)
src/lib/geocode/          derja → lieu (dictionnaire, Claude, OSM)
src/lib/simulation.ts     chauffeurs de démo
src/lib/rides.ts          courses, chauffeurs, détours
src/lib/db.ts             schéma Postgres (créé au démarrage)
src/app/rider|driver|admin  écrans
src/app/api/              API JSON
```

## Lancer en local

```bash
npm install
cp .env.example .env.local   # renseigner DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
npm test                     # tests unitaires
```

Le schéma de base de données est créé automatiquement au premier appel.

## Déploiement sur Render

`render.yaml` décrit une base Postgres et le service web (région Francfort). Variables à renseigner : `ADMIN_PASSWORD`, et `ANTHROPIC_API_KEY` (optionnelle).

## Avant une vraie mise en service

- **OSRM et Nominatim** : les serveurs publics sont limités (usage de démonstration). Héberger OSRM avec l'extrait OpenStreetMap de la Tunisie (`tunisia-latest.osm.pbf`) et une instance Nominatim, puis renseigner `OSRM_URL` / `NOMINATIM_URL`.
- **Tuiles de carte** : `tile.openstreetmap.org` n'est pas fait pour la production ; utiliser un fournisseur ou ses propres tuiles (`NEXT_PUBLIC_TILE_URL`).
- **Connexion** : ajouter la vérification du téléphone par SMS (OTP).
- **Paiement en ligne** : brancher Konnect / Flouci (webhooks de confirmation).
- **Temps réel** : le suivi est en interrogation toutes les 2–3 s ; passer à WebSocket / SSE au-delà de quelques centaines de courses simultanées.
- **Trafic** : remplacer le profil manuel par des facteurs appris sur les durées réelles des courses.
- **Réglementation** : vérifier le cadre légal (taxis licenciés) auprès du ministère du Transport.
- **Tarifs** : les tarifs par défaut sont des valeurs de démonstration, pas le tarif officiel.
