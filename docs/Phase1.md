# Phase 1 — MVP Backend (Services + Scheduler + Processus)

> **Statut** : Terminée
> **Date** : 2026-02-16
> **Résultat** : Build OK, 35/35 tests passed
> **Stack** : NestJS 11 + Prisma 7 (SQLite) + Luxon + cron-parser 5

---

## Changement de stack

La Phase 1 a commencé par une refonte complète de la stack initialisée en Phase 0 :

| Avant (Phase 0) | Après (Phase 1) |
|---|---|
| TypeScript pur + Express prévu | **NestJS 11** (modules, DI, decorators, lifecycle hooks) |
| Interfaces TS manuelles | **Prisma 7** ORM + SQLite (schema-first, migrations) |
| `Date` natif | **Luxon** (DateTime immutable, formatting, diff) |
| Vitest | **Jest** (intégré à NestJS via ts-jest) |
| Structure `src/core/`, `src/api/` | Structure NestJS par modules |

Ajouts :
- **Ky** — client HTTP (pour usage futur)
- **class-validator** + **class-transformer** — validation DTO par decorators
- **@nestjs/event-emitter** — événements du cycle de vie des jobs
- **@nestjs/config** — configuration globale via `.env`
- **@nestjs/mapped-types** — `PartialType()` pour les Update DTOs

---

## 1.1 Base de données — Prisma Schema

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.1.1 | Installer Prisma | Done | prisma 7.4, @prisma/client 7.4, SQLite |
| 1.1.2 | Définir le schéma | Done | 4 modèles dans `prisma/schema.prisma` |
| 1.1.3 | Migration initiale | Done | `20260216102916_init` |
| 1.1.4 | PrismaService global | Done | `src/prisma/prisma.service.ts` + module |

### Modèles (4)

| Modèle | Champs | Rôle |
|---|---|---|
| **Camera** | 12 champs | Caméra IP avec streams JSON, protocole, credentials |
| **Job** | 27 champs | Job complet : action, trigger, cron, période, sortie, rétention |
| **JobExecution** | 8 champs | Historique d'exécution : status, code sortie, erreur |
| **AppSetting** | 2 champs | Paramètres applicatifs clé/valeur |

Relations :
- `Camera` 1→N `Job` (cascade delete)
- `Job` 1→N `JobExecution` (cascade delete)

### Fichiers créés
- `prisma/schema.prisma` (81 lignes)
- `prisma/migrations/20260216102916_init/migration.sql`
- `prisma.config.ts`
- `src/prisma/prisma.service.ts` (13 lignes)
- `src/prisma/prisma.module.ts` (9 lignes)

---

## 1.2 Enums et interfaces

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.2.1 | Enums applicatifs | Done | ActionType, TriggerType, JobStatus, Protocol |
| 1.2.2 | Interfaces runtime | Done | ProcessEntry, ProcessStatus, LogBuffer, SchedulerTickResult |

### Enums (`src/common/enums.ts` — 30 lignes)

| Enum | Valeurs |
|---|---|
| `ActionType` | record, snapshot, timelapse, detect_motion, test_connection, custom_command |
| `TriggerType` | continuous, oneshot, fixed_duration |
| `JobStatus` | running, stopped, error, completed, killed |
| `Protocol` | rtsp, rtmp, http, onvif |

### Interfaces (`src/common/interfaces.ts` — 32 lignes)

| Interface | Rôle |
|---|---|
| `ProcessEntry` | Processus actif en mémoire (pid, retries, executionId) |
| `ProcessStatus` | Statut exposable d'un processus (uptime, running, etc.) |
| `LogBuffer` | Buffer circulaire de logs par job |
| `SchedulerTickResult` | Résultat d'un tick du scheduler |

---

## 1.3 Module Camera

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.3.1 | CreateCameraDto | Done | 9 champs validés avec class-validator |
| 1.3.2 | UpdateCameraDto | Done | PartialType de CreateCameraDto |
| 1.3.3 | CameraService | Done | CRUD complet avec sérialisation JSON streams/tags |
| 1.3.4 | CameraModule | Done | Providers + exports |

### CameraService (`src/camera/camera.service.ts` — 77 lignes)

Méthodes : `create()`, `findAll()`, `findOne()`, `update()`, `remove()`

Particularité : les champs `streams` et `tags` sont stockés en JSON string dans SQLite et désérialisés à la lecture via `deserialize()`.

### Fichiers créés
- `src/camera/dto/create-camera.dto.ts` (43 lignes)
- `src/camera/dto/update-camera.dto.ts` (5 lignes)
- `src/camera/camera.service.ts` (77 lignes)
- `src/camera/camera.module.ts` (11 lignes)

---

## 1.4 Module Job

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.4.1 | CreateJobDto | Done | 22 champs validés, valeurs par défaut |
| 1.4.2 | UpdateJobDto | Done | PartialType de CreateJobDto |
| 1.4.3 | JobService | Done | CRUD + gestion des exécutions |
| 1.4.4 | JobModule | Done | Imports CameraModule pour vérification |

### JobService (`src/job/job.service.ts` — 157 lignes)

Méthodes :
- `create()` — vérifie l'existence de la caméra, sérialise `extraArgs` en JSON
- `findAll(filters?)` — filtre par cameraId, action, enabled ; inclut la relation camera
- `findOne()`, `update()`, `remove()` — CRUD standard
- `findEnabled()` — jobs actifs avec caméra (utilisé par le scheduler)
- `createExecution()` — crée un enregistrement d'exécution (status: running)
- `completeExecution()` — met à jour avec stoppedAt, status, exitCode, error
- `getExecutionHistory()` — historique des 50 dernières exécutions

### Fichiers créés
- `src/job/dto/create-job.dto.ts` (112 lignes)
- `src/job/dto/update-job.dto.ts` (5 lignes)
- `src/job/job.service.ts` (157 lignes)
- `src/job/job.module.ts` (13 lignes)

---

## 1.5 Module Template

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.5.1 | TemplateService | Done | Résolution de variables + Luxon |
| 1.5.2 | TemplateModule (Global) | Done | Accessible partout sans import |
| 1.5.3 | Tests unitaires | Done | 7 tests |

### TemplateService (`src/template/template.service.ts` — 57 lignes)

Résout les patterns `{variable}` dans les chemins de sortie :

| Variable | Source | Exemple |
|---|---|---|
| `{date}` | Luxon `now.toFormat('yyyy-MM-dd')` | `2026-02-16` |
| `{time}` | Luxon `now.toFormat('HH-mm-ss')` | `14-30-00` |
| `{timestamp}` | Luxon `now.toFormat('yyyyMMdd_HHmmss')` | `20260216_143000` |
| `{year}`, `{month}`, `{day}`, `{hour}`, `{minute}` | Luxon | `2026`, `02`, `16`, `14`, `30` |
| `{cameraId}`, `{cameraName}` | Contexte job | `cam-1`, `Garage` |
| `{jobId}`, `{jobName}` | Contexte job | `job-1`, `Record HD` |

Méthodes : `resolve()`, `resolveForJob()`, `ensureDirectory()`, `ensureOutputDirectory()`, `sanitizePath()`

### Fichiers créés
- `src/template/template.service.ts` (57 lignes)
- `src/template/template.service.spec.ts` (68 lignes — 7 tests)
- `src/template/template.module.ts` (8 lignes)

---

## 1.6 Module Scheduler

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.6.1 | SchedulerService | Done | Logique cron + périodes calendaires |
| 1.6.2 | SchedulerEngineService | Done | Boucle de tick 30s, évaluation des jobs |
| 1.6.3 | SchedulerModule | Done | Providers + imports |
| 1.6.4 | Tests unitaires | Done | 15 tests |

### SchedulerService (`src/scheduler/scheduler.service.ts` — 122 lignes)

Le coeur de la logique de planification :

**`cronMatchesNow(cronExpr, now?)`** — Vérifie si un cron correspond à la minute courante.
Utilise `CronExpressionParser.parse()` (cron-parser v5) avec `prev()` pour trouver la dernière occurrence et compare avec le début de la minute actuelle.

**`isWithinPeriod(now, periodStart, periodEnd, recurrent)`** — Vérifie si la date courante est dans une période calendaire.
- Dates fixes : `"2026-03-15"` → `"2026-04-30"` (comparaison Luxon startOf/endOf)
- Dates récurrentes : `"--11-15"` → `"--03-15"` (mois-jour, supporte le cross-year)

**`shouldJobRun(job, now?)`** — Combinaison période + cron :
1. Vérifie la période calendaire
2. Si `continuous` → compare lastStart vs lastStop via cron
3. Si `oneshot`/`fixed_duration` → vérifie le cron match

**`isContinuousJobActive(job, now)`** — Pour les jobs continus avec cronStop : compare `prev()` du cron start vs `prev()` du cron stop. Si le dernier start > dernier stop → le job est actif.

**`getNextOccurrence(job)`** — Retourne le prochain DateTime via `CronExpressionParser.parse().next()`.

### SchedulerEngineService (`src/scheduler/scheduler-engine.service.ts` — 102 lignes)

Boucle principale du scheduler :

| Aspect | Détail |
|---|---|
| Intervalle | 30 secondes |
| Démarrage | `onModuleInit()` → `start()` + `tick()` immédiat |
| Arrêt | `onModuleDestroy()` → `stop()` |
| Tick | Fetch tous les jobs enabled → `evaluateJob()` pour chacun |

Évaluation par type de trigger :
- **continuous** : start si shouldRun && !isRunning, stop si !shouldRun && isRunning
- **oneshot** : start si shouldRun && !isRunning (le process se termine seul)
- **fixed_duration** : start si shouldRun && !isRunning + `setTimeout` pour kill après `duration` secondes

### Fichiers créés
- `src/scheduler/scheduler.service.ts` (122 lignes)
- `src/scheduler/scheduler.service.spec.ts` (173 lignes — 15 tests)
- `src/scheduler/scheduler-engine.service.ts` (102 lignes)
- `src/scheduler/scheduler.module.ts` (13 lignes)

---

## 1.7 Module Process

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.7.1 | CommandBuilderService | Done | Construction des commandes ffmpeg/ffprobe |
| 1.7.2 | ProcessSupervisorService | Done | Gestion multi-processus (spawn/kill/logs/retry) |
| 1.7.3 | ProcessModule | Done | Providers + imports + exports |
| 1.7.4 | Tests unitaires | Done | 13 tests |

### CommandBuilderService (`src/process/command-builder.service.ts` — 134 lignes)

Construit les `CommandSpec` (command + args) selon le type d'action :

| Action | Commande | Détails |
|---|---|---|
| `record` | `ffmpeg` | Codec, résolution, qualité, segmentation optionnelle |
| `snapshot` | `ffmpeg` | `-frames:v 1`, format jpg/png, qualité JPEG |
| `timelapse` | `ffmpeg` | Même que snapshot (capture frame unique) |
| `detect_motion` | `ffmpeg` | Même que record (traitement post-hoc) |
| `test_connection` | `ffprobe` | `-show_streams`, timeout 10s |
| `custom_command` | variable | Parsing + remplacement `{streamUrl}` |

Segmentation : si `segmentDuration` est défini, utilise `-f segment -segment_time N -strftime 1` pour découper automatiquement l'enregistrement.

### ProcessSupervisorService (`src/process/process-supervisor.service.ts` — 230 lignes)

Superviseur central des processus enfants :

| Fonctionnalité | Détail |
|---|---|
| **Spawn** | `child_process.spawn()`, stdio pipe, capture stdout/stderr |
| **Kill** | SIGTERM → attente 10s → SIGKILL |
| **Kill all** | `onModuleDestroy()` pour arrêt propre |
| **Auto-retry** | Retry après 5s sur erreur (max `maxRetries`), sauf oneshot |
| **Log buffer** | Circulaire, 500 lignes max, timestamps Luxon ISO |
| **Exécutions** | Crée/complète les `JobExecution` en BDD via JobService |
| **Événements** | Émet via EventEmitter2 : `job:started`, `job:stopped`, `job:retry`, `job:log` |
| **Statuts** | `getStatus()`, `getAllStatuses()`, `getActiveCount()`, `getLogs()` |

### Fichiers créés
- `src/process/command-builder.service.ts` (134 lignes)
- `src/process/command-builder.service.spec.ts` (135 lignes — 13 tests)
- `src/process/process-supervisor.service.ts` (230 lignes)
- `src/process/process.module.ts` (15 lignes)

---

## 1.8 Bootstrap & App Module

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 1.8.1 | AppModule | Done | Import de tous les modules |
| 1.8.2 | main.ts | Done | Bootstrap NestJS avec validation |

### AppModule (`src/app.module.ts` — 23 lignes)

Imports :
1. `ConfigModule.forRoot({ isGlobal: true })` — variables d'environnement
2. `EventEmitterModule.forRoot()` — bus d'événements
3. `PrismaModule` (Global) — accès BDD
4. `TemplateModule` (Global) — résolution de templates
5. `CameraModule` — gestion des caméras
6. `JobModule` — gestion des jobs
7. `ProcessModule` — supervision des processus
8. `SchedulerModule` — moteur de planification

### main.ts (`src/main.ts` — 39 lignes)

| Étape | Détail |
|---|---|
| Validation ffmpeg | `execSync('ffmpeg -version')` — exit(1) si absent |
| ValidationPipe | whitelist, forbidNonWhitelisted, transform |
| CORS | Activé |
| Prefix API | `/api` |
| Shutdown hooks | Activés pour arrêt gracieux |
| Port | `process.env.PORT` ou 3000 |

---

## Vérifications

| Vérification | Résultat |
|---|---|
| `pnpm run build` (NestJS build) | OK — compilation sans erreur |
| `pnpm test` (35 tests) | OK — 3 suites, 35 passed (2.0s) |

### Détail des tests

| Suite | Fichier | Tests |
|---|---|---|
| TemplateService | `template.service.spec.ts` | 7 (resolve variables, temporels, inconnus, mixtes, job context, sanitize) |
| SchedulerService | `scheduler.service.spec.ts` | 15 (cron match/mismatch, périodes fixes/récurrentes/cross-year, shouldJobRun combiné) |
| CommandBuilderService | `command-builder.service.spec.ts` | 13 (record, segment, extra args, snapshot, test_connection, custom_command, sub stream) |

---

## Dépendances installées

### dependencies

| Package | Version | Rôle |
|---|---|---|
| @nestjs/common | ^11.0.1 | Framework NestJS — core |
| @nestjs/core | ^11.0.1 | Framework NestJS — runtime |
| @nestjs/platform-express | ^11.0.1 | Adaptateur HTTP Express |
| @nestjs/config | ^4.0.3 | Gestion .env / configuration |
| @nestjs/event-emitter | ^3.0.1 | Bus d'événements |
| @nestjs/schedule | ^6.1.1 | Scheduling NestJS (futur usage) |
| @nestjs/mapped-types | ^2.1.0 | PartialType pour Update DTOs |
| @prisma/client | ^7.4.0 | Client Prisma ORM |
| prisma | ^7.4.0 | CLI Prisma (migrations, generate) |
| class-validator | ^0.14.3 | Validation DTO par decorators |
| class-transformer | ^0.5.1 | Transformation DTO |
| cron-parser | ^5.5.0 | Parsing d'expressions cron |
| luxon | ^3.7.2 | Manipulation dates/heures |
| ky | ^1.14.3 | Client HTTP (futur usage) |
| reflect-metadata | ^0.2.2 | Support decorators TypeScript |
| rxjs | ^7.8.1 | Observables (requis par NestJS) |

### devDependencies

| Package | Version | Rôle |
|---|---|---|
| @nestjs/cli | ^11.0.0 | CLI NestJS (build, generate) |
| @nestjs/testing | ^11.0.1 | Utilitaires de test NestJS |
| @nestjs/schematics | ^11.0.0 | Générateurs NestJS |
| typescript | ^5.7.3 | Compilateur TypeScript |
| ts-jest | ^29.2.5 | Transformer Jest pour TypeScript |
| jest | ^30.0.0 | Framework de test |
| @types/jest | ^30.0.0 | Types Jest |
| @types/luxon | ^3.7.1 | Types Luxon |
| @types/node | ^22.10.7 | Types Node.js |
| @types/express | ^5.0.0 | Types Express |
| @types/supertest | ^6.0.2 | Types Supertest |
| eslint | ^9.18.0 | Linter |
| typescript-eslint | ^8.20.0 | Plugin ESLint TypeScript |
| prettier | ^3.4.2 | Formateur de code |
| dotenv | ^17.3.1 | Chargement .env (Prisma config) |
| supertest | ^7.0.0 | Tests HTTP (futur usage) |

---

## Configuration Jest

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "moduleNameMapper": { "^(\\.{1,2}/.*)\\.js$": "$1" },
  "testEnvironment": "node"
}
```

`moduleNameMapper` : résout les imports `.js` (NodeNext) vers les fichiers `.ts` pour Jest.

---

## Arborescence du projet après Phase 1

```
CamCron/
├── docs/
│   ├── cahier-des-charges.md
│   ├── todolist.md
│   ├── Phase0.md
│   └── Phase1.md
├── prisma/
│   ├── schema.prisma                          # 4 modèles (81 lignes)
│   └── migrations/
│       └── 20260216102916_init/
│           └── migration.sql
├── generated/
│   └── prisma/                                # Client Prisma généré
├── src/
│   ├── main.ts                                # Bootstrap NestJS (39 lignes)
│   ├── app.module.ts                          # Module racine (23 lignes)
│   ├── common/
│   │   ├── enums.ts                           # ActionType, TriggerType, JobStatus, Protocol (30 lignes)
│   │   └── interfaces.ts                      # ProcessEntry, ProcessStatus, LogBuffer (32 lignes)
│   ├── prisma/
│   │   ├── prisma.service.ts                  # PrismaClient + lifecycle (13 lignes)
│   │   └── prisma.module.ts                   # Module global (9 lignes)
│   ├── camera/
│   │   ├── camera.service.ts                  # CRUD + JSON serialize (77 lignes)
│   │   ├── camera.module.ts                   # Module (11 lignes)
│   │   └── dto/
│   │       ├── create-camera.dto.ts           # Validated DTO (43 lignes)
│   │       └── update-camera.dto.ts           # PartialType (5 lignes)
│   ├── job/
│   │   ├── job.service.ts                     # CRUD + executions (157 lignes)
│   │   ├── job.module.ts                      # Module (13 lignes)
│   │   └── dto/
│   │       ├── create-job.dto.ts              # Validated DTO (112 lignes)
│   │       └── update-job.dto.ts              # PartialType (5 lignes)
│   ├── template/
│   │   ├── template.service.ts                # Résolution {variables} + Luxon (57 lignes)
│   │   ├── template.service.spec.ts           # 7 tests (68 lignes)
│   │   └── template.module.ts                 # Module global (8 lignes)
│   ├── scheduler/
│   │   ├── scheduler.service.ts               # Logique cron + périodes (122 lignes)
│   │   ├── scheduler.service.spec.ts          # 15 tests (173 lignes)
│   │   ├── scheduler-engine.service.ts        # Tick loop 30s (102 lignes)
│   │   └── scheduler.module.ts                # Module (13 lignes)
│   └── process/
│       ├── command-builder.service.ts         # ffmpeg/ffprobe commands (134 lignes)
│       ├── command-builder.service.spec.ts    # 13 tests (135 lignes)
│       ├── process-supervisor.service.ts      # Spawn/kill/retry/logs (230 lignes)
│       └── process.module.ts                  # Module (15 lignes)
├── test/
│   ├── app.e2e-spec.ts                        # Test E2E placeholder
│   └── jest-e2e.json                          # Config Jest E2E
├── prisma.config.ts
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── pnpm-lock.yaml
├── docker-compose.yml
├── Dockerfile
├── README.md
└── .gitignore
```

**Total** : ~1 580 lignes de code source (hors tests), 376 lignes de tests, 28 fichiers TypeScript.

---

## Problèmes rencontrés et solutions

| Problème | Cause | Solution |
|---|---|---|
| `PartialType` ne fonctionne pas | Import depuis `@nestjs/common` incorrect | Installer `@nestjs/mapped-types`, importer depuis là |
| `parseExpression` introuvable | cron-parser v5 a changé l'API | Utiliser `CronExpressionParser.parse()` |
| Jest ne résout pas les `.js` | Imports NodeNext avec extensions `.js` | `moduleNameMapper: {"^(\\.{1,2}/.*)\\.js$": "$1"}` |
| Test cron `* * * * *` échoue | `prev()` retourne la minute précédente | `startOf('minute').plus({ms:1})` + tolérance < 60s |
| `prisma migrate dev` échoue | `dotenv/config` manquant | `pnpm add -D dotenv` |
| `pnpm approve-builds` interactif | Prompt non supporté en script | `pnpm.onlyBuiltDependencies` dans package.json |

---

## Prêt pour Phase 2

La Phase 1 est complète. Tous les services backend sont fonctionnels :
- Prisma ORM avec 4 modèles et migration initiale
- CRUD complet pour Camera et Job
- Scheduler avec logique cron + périodes calendaires
- Superviseur de processus avec spawn/kill/retry/logs
- Construction de commandes ffmpeg/ffprobe
- 35 tests unitaires passent

Prochaine étape : **Phase 2 — API REST** (contrôleurs NestJS, endpoints CRUD, WebSocket pour monitoring temps réel)
