# Phase 2 — API REST + WebSocket

## Résumé

La Phase 2 expose tous les services backend via une API REST et ajoute un WebSocket temps réel pour la supervision.

## Dépendances ajoutées

- `@nestjs/websockets` — décorateurs WebSocket NestJS
- `@nestjs/platform-socket.io` — adapter Socket.IO
- `socket.io` — runtime Socket.IO

## Endpoints REST

### Cameras (`/api/cameras`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/cameras` | Liste toutes les caméras |
| POST | `/api/cameras` | Crée une caméra |
| GET | `/api/cameras/:id` | Détails d'une caméra |
| PATCH | `/api/cameras/:id` | Modifie une caméra |
| DELETE | `/api/cameras/:id` | Supprime une caméra |
| POST | `/api/cameras/:id/test` | Teste la connectivité (ffprobe) |

### Jobs (`/api/jobs`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/jobs` | Liste les jobs (filtres: cameraId, action, enabled) |
| POST | `/api/jobs` | Crée un job |
| GET | `/api/jobs/:id` | Détails + statut runtime + prochaine exécution |
| PATCH | `/api/jobs/:id` | Modifie un job |
| DELETE | `/api/jobs/:id` | Supprime (+ arrête si actif) |
| POST | `/api/jobs/:id/start` | Démarrage manuel |
| POST | `/api/jobs/:id/stop` | Arrêt manuel |
| GET | `/api/jobs/:id/logs` | Dernières lignes de logs (query: limit) |
| GET | `/api/jobs/:id/history` | Historique d'exécution (query: limit) |

### Système (`/api/`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Health check (uptime, status) |
| GET | `/api/status` | Statut global (caméras, jobs, processus actifs, ffmpeg) |
| GET | `/api/settings` | Paramètres applicatifs |
| PATCH | `/api/settings` | Modifier paramètres |

## WebSocket (Socket.IO)

### Événements broadcast

| Événement | Données |
|-----------|---------|
| `job:started` | `{ jobId, jobName, pid }` |
| `job:stopped` | `{ jobId, jobName, status, code, signal }` |
| `job:retry` | `{ jobId, jobName, retry, maxRetries }` |
| `status:update` | `{ type, ...payload }` — à chaque start/stop |

### Événements room (logs)

| Événement | Room | Données |
|-----------|------|---------|
| `job:log` | `logs:{jobId}` | `{ jobId, line }` |

### Commandes client

- `subscribe:logs` (jobId) — rejoint la room de logs d'un job
- `unsubscribe:logs` (jobId) — quitte la room

## Architecture des modules

```
AppModule
├── PrismaModule (Global)
├── TemplateModule (Global)
├── CameraModule        ← CameraController + CameraService
├── JobModule           ← JobController + JobService
├── ProcessModule       ← ProcessSupervisorService + CommandBuilderService
├── SchedulerModule     ← SchedulerService + SchedulerEngineService
├── SystemModule        ← SystemController + SystemService      [NOUVEAU]
└── EventsModule        ← EventsGateway (Socket.IO)             [NOUVEAU]
```

## Fichiers créés

- `src/camera/camera.controller.ts` — Controller REST caméras
- `src/job/job.controller.ts` — Controller REST jobs
- `src/system/system.module.ts` — Module système
- `src/system/system.service.ts` — Service système
- `src/system/system.controller.ts` — Controller système
- `src/events/events.module.ts` — Module WebSocket
- `src/events/events.gateway.ts` — Gateway Socket.IO

## Fichiers modifiés

- `src/app.module.ts` — ajout SystemModule + EventsModule
- `src/camera/camera.module.ts` — ajout CameraController
- `src/job/job.module.ts` — ajout JobController + imports ProcessModule/SchedulerModule
- `src/process/process.module.ts` — forwardRef pour dépendance circulaire
- `src/scheduler/scheduler.module.ts` — forwardRef pour dépendance circulaire

## Tests

| Fichier | Tests |
|---------|-------|
| `camera.controller.spec.ts` | 7 tests — CRUD + test connectivité |
| `job.controller.spec.ts` | 12 tests — CRUD + start/stop/logs/history |
| `system.controller.spec.ts` | 4 tests — health/status/settings |
| `events.gateway.spec.ts` | 7 tests — connection, subscribe, event forwarding |

**Total : 67 tests, tous passent.**
