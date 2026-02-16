# CamCron

Système de gestion multi-processus de caméras IP piloté par cron.

## Concept

CamCron permet d'exécuter **plusieurs processus d'enregistrement simultanés** sur une même caméra, orchestrés par des **expressions cron** et/ou des **périodes calendaires précises**.

Chaque tâche d'enregistrement est un **job indépendant** avec son propre planning, sa propre configuration de sortie et sa propre politique de rétention.

## Stack technique

- **Backend** : Node.js / TypeScript
- **Frontend** : React + Vite
- **Base de données** : SQLite (embarqué)
- **Vidéo** : ffmpeg (processus externe)
- **Conteneurisation** : Docker

## Prérequis

- Node.js >= 20 LTS
- ffmpeg installé et accessible dans le PATH
- npm

## Installation

```bash
npm install
npm run build
npm start
```

## Développement

```bash
npm run dev
```

## Docker

```bash
docker compose up
```

## Documentation

Voir le dossier `docs/` pour le cahier des charges et la todolist.

## Licence

MIT
