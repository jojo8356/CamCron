# CamCron — Todolist complète

> Chaque tâche indique ses **dépendances** (tâches qui doivent être terminées avant).
> Format : `[x.y.z]` = Phase.Groupe.Étape

---

## Phase 0 — Initialisation du projet

### 0.1 Mise en place du dépôt

| # | Tâche | Dépendances |
|---|---|---|
| 0.1.1 | Initialiser le dépôt Git (`git init`) | Aucune |
| 0.1.2 | Créer le `.gitignore` (node_modules, dist, .env, data/) | 0.1.1 |
| 0.1.3 | Créer le `README.md` avec description du projet | 0.1.1 |

### 0.2 Initialisation Node.js / TypeScript

| # | Tâche | Dépendances |
|---|---|---|
| 0.2.1 | `npm init` — créer le `package.json` | 0.1.1 |
| 0.2.2 | Installer TypeScript et ts-node comme devDependencies | 0.2.1 |
| 0.2.3 | Créer le `tsconfig.json` (target ES2022, module NodeNext, strict) | 0.2.2 |
| 0.2.4 | Créer la structure de dossiers : `src/`, `src/core/`, `src/api/`, `src/web/`, `tests/` | 0.2.1 |
| 0.2.5 | Configurer les scripts npm (`dev`, `build`, `start`, `test`) | 0.2.3 |

### 0.3 Outillage de développement

| # | Tâche | Dépendances |
|---|---|---|
| 0.3.1 | Installer et configurer ESLint pour TypeScript | 0.2.3 |
| 0.3.2 | Installer et configurer Prettier | 0.2.1 |
| 0.3.3 | Installer un framework de test (Vitest ou Jest) | 0.2.3 |
| 0.3.4 | Écrire un premier test trivial pour valider le pipeline | 0.3.3 |
| 0.3.5 | Créer un `Dockerfile` de base (Node 20 + ffmpeg) | 0.2.5 |
| 0.3.6 | Créer un `docker-compose.yml` de développement | 0.3.5 |

---

## Phase 1 — Fondations (MVP backend)

### 1.1 Modèles de données (types TypeScript)

| # | Tâche | Dépendances |
|---|---|---|
| 1.1.1 | Définir l'interface `CameraConfig` (id, name, streams, protocol, tags, enabled...) | 0.2.3 |
| 1.1.2 | Définir l'interface `JobConfig` (id, name, cameraId, action, schedule, output, processConfig...) | 1.1.1 |
| 1.1.3 | Définir l'interface `Schedule` (cron, cronStop, triggerType, period) | 1.1.2 |
| 1.1.4 | Définir l'interface `CalendarPeriod` (startDate, endDate, recurrent) | 1.1.3 |
| 1.1.5 | Définir l'interface `OutputConfig` (directory, filenamePattern, format, segmentDuration, retention) | 1.1.2 |
| 1.1.6 | Définir l'interface `ProcessConfig` (codec, resolution, quality, extraArgs, command, timeout) | 1.1.2 |
| 1.1.7 | Définir l'enum `ActionType` (record, snapshot, timelapse, detect_motion, test_connection, custom_command) | 1.1.2 |
| 1.1.8 | Définir l'enum `TriggerType` (continuous, oneshot, fixed_duration) | 1.1.3 |
| 1.1.9 | Définir l'interface `AppConfig` (server, storage, ffmpeg, notifications, auth, logging) | 0.2.3 |
| 1.1.10 | Définir les interfaces d'état runtime : `JobState` (running, stopped, error, lastRun, pid...) | 1.1.2 |
| 1.1.11 | Écrire les tests unitaires de validation des types (données valides et invalides) | 1.1.1 à 1.1.10, 0.3.3 |

### 1.2 Couche de persistance (ConfigStore)

| # | Tâche | Dépendances |
|---|---|---|
| 1.2.1 | Choisir et installer la librairie SQLite (`better-sqlite3`) + ses types | 0.2.3 |
| 1.2.2 | Créer la classe `ConfigStore` avec initialisation de la DB et création des tables | 1.2.1, 1.1.9 |
| 1.2.3 | Implémenter les méthodes CRUD pour les caméras (`addCamera`, `getCamera`, `listCameras`, `updateCamera`, `deleteCamera`) | 1.2.2, 1.1.1 |
| 1.2.4 | Implémenter les méthodes CRUD pour les jobs (`addJob`, `getJob`, `listJobs`, `updateJob`, `deleteJob`) | 1.2.2, 1.1.2 |
| 1.2.5 | Implémenter la lecture/écriture de la configuration globale (`getConfig`, `updateConfig`) | 1.2.2, 1.1.9 |
| 1.2.6 | Implémenter l'écriture atomique (write-ahead logging ou write-then-rename) | 1.2.2 |
| 1.2.7 | Écrire les tests unitaires du ConfigStore (CRUD complet + cas d'erreur) | 1.2.3, 1.2.4, 1.2.5, 0.3.3 |

### 1.3 Moteur de templating des chemins

| # | Tâche | Dépendances |
|---|---|---|
| 1.3.1 | Créer la fonction `resolveTemplate(pattern, variables)` qui remplace `{cameraName}`, `{timestamp}`, etc. | 1.1.5 |
| 1.3.2 | Gérer les variables temporelles (`{date}`, `{year}`, `{month}`, `{day}`, `{hour}`, `{minute}`, `{timestamp}`) | 1.3.1 |
| 1.3.3 | Gérer les variables contextuelles (`{cameraId}`, `{cameraName}`, `{jobId}`, `{jobName}`) | 1.3.1 |
| 1.3.4 | Créer la fonction `ensureOutputDirectory(resolvedPath)` qui crée les dossiers récursivement | 1.3.1 |
| 1.3.5 | Écrire les tests unitaires du templating (substitutions, cas limites, caractères spéciaux) | 1.3.1 à 1.3.4, 0.3.3 |

### 1.4 Évaluateur de périodes calendaires

| # | Tâche | Dépendances |
|---|---|---|
| 1.4.1 | Installer la librairie de parsing cron (`cron-parser`) | 0.2.1 |
| 1.4.2 | Créer la fonction `isWithinPeriod(now, period: CalendarPeriod): boolean` | 1.1.4 |
| 1.4.3 | Gérer les périodes à dates fixes (`2026-03-15` → `2026-04-30`) | 1.4.2 |
| 1.4.4 | Gérer les périodes récurrentes annuelles (`--12-01` → `--02-28`) | 1.4.2 |
| 1.4.5 | Gérer le cas spécial : période récurrente qui chevauche le changement d'année (nov → mars) | 1.4.4 |
| 1.4.6 | Créer la fonction `shouldJobRun(job, now): boolean` qui combine cron match + période calendaire | 1.4.2, 1.4.1, 1.1.3 |
| 1.4.7 | Créer la fonction `getNextOccurrence(job): Date` pour afficher le prochain déclenchement prévu | 1.4.6 |
| 1.4.8 | Écrire les tests unitaires (dates limites, chevauchements d'année, cron + période, récurrence) | 1.4.2 à 1.4.7, 0.3.3 |

### 1.5 Process Supervisor

| # | Tâche | Dépendances |
|---|---|---|
| 1.5.1 | Créer la classe `ProcessSupervisor` avec un registre interne des processus actifs (Map<jobId, ChildProcess>) | 1.1.10 |
| 1.5.2 | Implémenter `spawnProcess(job, camera): ChildProcess` — construire la commande ffmpeg selon l'action et spawner le processus | 1.5.1, 1.1.2, 1.1.1 |
| 1.5.3 | Implémenter le builder de commande ffmpeg pour l'action `record` (flux continu, codec copy/reencode, segmentation) | 1.5.2 |
| 1.5.4 | Implémenter le builder de commande ffmpeg pour l'action `snapshot` (capture 1 frame) | 1.5.2 |
| 1.5.5 | Implémenter le builder de commande ffmpeg pour l'action `test_connection` (ffprobe) | 1.5.2 |
| 1.5.6 | Implémenter le builder pour l'action `custom_command` (commande shell avec variables résolues) | 1.5.2, 1.3.1 |
| 1.5.7 | Implémenter la résolution du chemin de sortie (templating + création de dossier) avant chaque spawn | 1.5.2, 1.3.1, 1.3.4 |
| 1.5.8 | Implémenter `killProcess(jobId)` — arrêt gracieux (SIGTERM) puis forcé (SIGKILL) après timeout | 1.5.1 |
| 1.5.9 | Implémenter la capture des logs stdout/stderr de chaque processus dans un buffer circulaire en mémoire | 1.5.2 |
| 1.5.10 | Implémenter la détection de crash (événement `exit` / `error`) et le mécanisme de retry (maxRetries) | 1.5.2, 1.1.2 |
| 1.5.11 | Implémenter `getProcessStatus(jobId): ProcessStatus` (running, stopped, error, uptime, pid, retries) | 1.5.1, 1.5.10 |
| 1.5.12 | Implémenter `killAll()` — arrêt propre de tous les processus (pour shutdown gracieux) | 1.5.8 |
| 1.5.13 | Écrire les tests unitaires (spawn/kill mock, retry, buffer logs, statut) | 1.5.1 à 1.5.12, 0.3.3 |

### 1.6 Scheduler Engine

| # | Tâche | Dépendances |
|---|---|---|
| 1.6.1 | Créer la classe `Scheduler` avec une boucle de tick (intervalle configurable, défaut 30s) | 1.4.6, 1.5.1 |
| 1.6.2 | À chaque tick : récupérer tous les jobs enabled depuis le ConfigStore | 1.6.1, 1.2.4 |
| 1.6.3 | Pour chaque job `continuous` : si `shouldJobRun()` ET processus non démarré → `spawnProcess()` | 1.6.2, 1.4.6, 1.5.2 |
| 1.6.4 | Pour chaque job `continuous` : si `!shouldJobRun()` ET processus actif → `killProcess()` | 1.6.2, 1.4.6, 1.5.8 |
| 1.6.5 | Pour chaque job `oneshot` : si le cron matche le tick courant ET dans la période → `spawnProcess()` (le processus se termine seul) | 1.6.2, 1.4.6, 1.5.2 |
| 1.6.6 | Pour chaque job `fixed_duration` : spawn + programmer un kill après la durée configurée | 1.6.5, 1.5.8 |
| 1.6.7 | Implémenter `start()` et `stop()` du scheduler (démarrage/arrêt de la boucle de tick) | 1.6.1 |
| 1.6.8 | Gérer le cas de redémarrage : au démarrage, évaluer immédiatement tous les jobs pour rattraper l'état attendu | 1.6.7, 1.6.3, 1.6.4 |
| 1.6.9 | Émettre des événements (EventEmitter) pour chaque action : `job:started`, `job:stopped`, `job:error`, `job:retry` | 1.6.3, 1.6.4 |
| 1.6.10 | Écrire les tests unitaires (tick logic, start/stop continu, oneshot, fixed_duration, combinaison cron+période) | 1.6.1 à 1.6.9, 0.3.3 |

### 1.7 Logging structuré

| # | Tâche | Dépendances |
|---|---|---|
| 1.7.1 | Choisir et installer une librairie de logging (pino ou winston) | 0.2.1 |
| 1.7.2 | Créer le module `logger.ts` avec configuration par niveau (debug, info, warn, error) | 1.7.1, 1.1.9 |
| 1.7.3 | Configurer la sortie console (dev) + fichier JSON (prod) | 1.7.2 |
| 1.7.4 | Intégrer le logger dans le Scheduler (événements de tick, spawn, kill) | 1.7.2, 1.6.9 |
| 1.7.5 | Intégrer le logger dans le ProcessSupervisor (spawn, crash, retry, logs processus) | 1.7.2, 1.5.9 |
| 1.7.6 | Écrire les tests unitaires (niveaux de log, format JSON) | 1.7.2, 0.3.3 |

### 1.8 Point d'entrée et CLI de base

| # | Tâche | Dépendances |
|---|---|---|
| 1.8.1 | Créer `src/index.ts` — point d'entrée principal qui charge la config, initialise les services et démarre le scheduler | 1.2.5, 1.6.7, 1.7.2 |
| 1.8.2 | Gérer les signaux système (SIGTERM, SIGINT) pour un arrêt propre (scheduler.stop + supervisor.killAll) | 1.8.1, 1.6.7, 1.5.12 |
| 1.8.3 | Créer une config par défaut si aucune n'existe au premier lancement | 1.8.1, 1.2.5 |
| 1.8.4 | Valider la présence de ffmpeg au démarrage et afficher sa version | 1.8.1 |
| 1.8.5 | **Test d'intégration** : démarrer CamCron avec une config de test, vérifier que le scheduler tourne et qu'un job oneshot simple s'exécute | 1.8.1 à 1.8.4 |

---

## Phase 2 — API REST

### 2.1 Serveur HTTP

| # | Tâche | Dépendances |
|---|---|---|
| 2.1.1 | Installer Fastify (ou Express) + types | 0.2.3 |
| 2.1.2 | Créer le module `src/api/server.ts` avec initialisation du serveur HTTP | 2.1.1, 1.1.9 |
| 2.1.3 | Configurer le middleware CORS | 2.1.2 |
| 2.1.4 | Configurer le middleware de parsing JSON | 2.1.2 |
| 2.1.5 | Configurer le middleware de logging des requêtes | 2.1.2, 1.7.2 |
| 2.1.6 | Créer le endpoint `/api/health` (health check) | 2.1.2 |
| 2.1.7 | Intégrer le démarrage du serveur HTTP dans `src/index.ts` | 2.1.2, 1.8.1 |
| 2.1.8 | Écrire un test d'intégration (démarrage serveur + GET /api/health) | 2.1.6, 0.3.3 |

### 2.2 Routes caméras

| # | Tâche | Dépendances |
|---|---|---|
| 2.2.1 | Créer le module `src/api/routes/cameras.ts` | 2.1.2 |
| 2.2.2 | Implémenter `GET /api/cameras` — lister toutes les caméras | 2.2.1, 1.2.3 |
| 2.2.3 | Implémenter `POST /api/cameras` — ajouter une caméra (avec validation du body) | 2.2.1, 1.2.3 |
| 2.2.4 | Implémenter `GET /api/cameras/:id` — détails d'une caméra | 2.2.1, 1.2.3 |
| 2.2.5 | Implémenter `PUT /api/cameras/:id` — modifier une caméra | 2.2.1, 1.2.3 |
| 2.2.6 | Implémenter `DELETE /api/cameras/:id` — supprimer une caméra (vérifier qu'aucun job ne la référence) | 2.2.1, 1.2.3, 1.2.4 |
| 2.2.7 | Implémenter `POST /api/cameras/:id/test` — tester la connectivité (ffprobe sur le flux) | 2.2.1, 1.5.5 |
| 2.2.8 | Ajouter la validation des données entrantes (JSON Schema ou Zod) | 2.2.3, 2.2.5 |
| 2.2.9 | Écrire les tests d'intégration (CRUD complet + validation + erreurs 404/400) | 2.2.2 à 2.2.8, 0.3.3 |

### 2.3 Routes jobs

| # | Tâche | Dépendances |
|---|---|---|
| 2.3.1 | Créer le module `src/api/routes/jobs.ts` | 2.1.2 |
| 2.3.2 | Implémenter `GET /api/jobs` — lister tous les jobs (avec filtres optionnels : cameraId, status, action) | 2.3.1, 1.2.4 |
| 2.3.3 | Implémenter `POST /api/jobs` — créer un job (vérifier que la caméra existe) | 2.3.1, 1.2.4, 1.2.3 |
| 2.3.4 | Implémenter `GET /api/jobs/:id` — détails d'un job + statut runtime (running/stopped) | 2.3.1, 1.2.4, 1.5.11 |
| 2.3.5 | Implémenter `PUT /api/jobs/:id` — modifier un job (si le job tourne, le redémarrer avec la nouvelle config) | 2.3.1, 1.2.4, 1.5.8, 1.5.2 |
| 2.3.6 | Implémenter `DELETE /api/jobs/:id` — supprimer un job (arrêter le processus si actif) | 2.3.1, 1.2.4, 1.5.8 |
| 2.3.7 | Implémenter `POST /api/jobs/:id/start` — démarrer manuellement un job (bypass du cron) | 2.3.1, 1.5.2 |
| 2.3.8 | Implémenter `POST /api/jobs/:id/stop` — arrêter manuellement un job | 2.3.1, 1.5.8 |
| 2.3.9 | Implémenter `GET /api/jobs/:id/logs` — retourner les dernières lignes du buffer de logs | 2.3.1, 1.5.9 |
| 2.3.10 | Implémenter `GET /api/jobs/:id/history` — historique d'exécution (démarrages, arrêts, erreurs) | 2.3.1, 1.6.9 |
| 2.3.11 | Ajouter la validation des données entrantes (expression cron valide, cameraId existant, période cohérente) | 2.3.3, 2.3.5 |
| 2.3.12 | Écrire les tests d'intégration (CRUD + start/stop + filtres + logs + validation) | 2.3.2 à 2.3.11, 0.3.3 |

### 2.4 Routes système

| # | Tâche | Dépendances |
|---|---|---|
| 2.4.1 | Implémenter `GET /api/status` — statut global (nb caméras, nb jobs actifs, uptime, version) | 2.1.2, 1.5.11, 1.2.3, 1.2.4 |
| 2.4.2 | Implémenter `GET /api/storage` — utilisation du stockage (total, par caméra, par job) | 2.1.2 |
| 2.4.3 | Implémenter `GET /api/config` — retourner la config globale (sans secrets) | 2.1.2, 1.2.5 |
| 2.4.4 | Implémenter `PUT /api/config` — modifier la config globale (recharger les services impactés) | 2.1.2, 1.2.5 |
| 2.4.5 | Écrire les tests d'intégration | 2.4.1 à 2.4.4, 0.3.3 |

### 2.5 WebSocket temps réel

| # | Tâche | Dépendances |
|---|---|---|
| 2.5.1 | Installer la librairie WebSocket (`ws` ou `socket.io`) | 0.2.1 |
| 2.5.2 | Créer le module `src/api/websocket.ts` et attacher le serveur WS au serveur HTTP | 2.5.1, 2.1.2 |
| 2.5.3 | Implémenter le canal `ws/status` — diffuser les changements d'état des jobs en temps réel | 2.5.2, 1.6.9 |
| 2.5.4 | Implémenter le canal `ws/logs/:jobId` — streamer les logs d'un job spécifique | 2.5.2, 1.5.9 |
| 2.5.5 | Gérer la connexion/déconnexion des clients et le cleanup | 2.5.3 |
| 2.5.6 | Écrire les tests (connexion WS, réception d'événements) | 2.5.3, 2.5.4, 0.3.3 |

---

## Phase 3 — Interface web

### 3.1 Initialisation du frontend

| # | Tâche | Dépendances |
|---|---|---|
| 3.1.1 | Initialiser le projet React + TypeScript avec Vite dans `src/web/` | 0.2.3 |
| 3.1.2 | Installer et configurer un framework UI (Tailwind CSS ou Shadcn/ui) | 3.1.1 |
| 3.1.3 | Créer le layout principal (sidebar navigation + zone de contenu) | 3.1.2 |
| 3.1.4 | Configurer le routage (React Router) : `/`, `/cameras`, `/jobs`, `/monitoring`, `/files`, `/settings` | 3.1.3 |
| 3.1.5 | Créer un module client API (`src/web/api/client.ts`) pour communiquer avec le backend REST | 3.1.1, 2.1.2 |
| 3.1.6 | Créer un hook WebSocket (`useWebSocket`) pour les données temps réel | 3.1.1, 2.5.2 |
| 3.1.7 | Configurer le proxy Vite (dev) pour rediriger `/api` et `/ws` vers le backend | 3.1.1, 2.1.2 |
| 3.1.8 | Configurer le build de production (Vite build → fichiers statiques servis par le backend) | 3.1.7, 2.1.2 |

### 3.2 Page Dashboard

| # | Tâche | Dépendances |
|---|---|---|
| 3.2.1 | Créer le composant `Dashboard` avec les cartes KPI (nb caméras, nb jobs actifs, espace disque) | 3.1.5, 2.4.1, 2.4.2 |
| 3.2.2 | Ajouter la liste des processus actifs avec statut en temps réel (via WebSocket) | 3.2.1, 3.1.6, 2.5.3 |
| 3.2.3 | Ajouter le fil d'activité récente (derniers événements) | 3.2.1, 2.3.10 |
| 3.2.4 | Ajouter les graphiques d'utilisation des ressources (chart.js ou recharts) | 3.2.1 |

### 3.3 Page Caméras

| # | Tâche | Dépendances |
|---|---|---|
| 3.3.1 | Créer le composant `CameraList` — tableau des caméras avec statut | 3.1.5, 2.2.2 |
| 3.3.2 | Créer le composant `CameraForm` — formulaire ajout/modification (champs : nom, URLs flux, protocole, auth, tags) | 3.1.2, 2.2.3 |
| 3.3.3 | Intégrer le bouton "Tester la connexion" dans le formulaire | 3.3.2, 2.2.7 |
| 3.3.4 | Ajouter la confirmation de suppression (modale) | 3.3.1, 2.2.6 |
| 3.3.5 | Créer le composant `CameraDetail` — vue détaillée avec liste des jobs associés | 3.3.1, 2.2.4, 2.3.2 |
| 3.3.6 | Ajouter l'aperçu thumbnail du flux (snapshot via ffmpeg côté backend) | 3.3.5, 1.5.4 |

### 3.4 Page Jobs

| # | Tâche | Dépendances |
|---|---|---|
| 3.4.1 | Créer le composant `JobList` — tableau des jobs avec filtres (par caméra, statut, action) | 3.1.5, 2.3.2 |
| 3.4.2 | Créer le composant `JobForm` — formulaire assisté de création/modification de job | 3.1.2, 2.3.3 |
| 3.4.3 | Intégrer le sélecteur de caméra (dropdown alimenté par `GET /api/cameras`) dans `JobForm` | 3.4.2, 2.2.2 |
| 3.4.4 | Intégrer le sélecteur de type d'action dans `JobForm` | 3.4.2 |
| 3.4.5 | Créer le composant `CronEditor` — éditeur visuel de cron (grille 7j×24h cliquable + champ texte brut) | 3.1.2 |
| 3.4.6 | Intégrer le `CronEditor` dans le `JobForm` | 3.4.2, 3.4.5 |
| 3.4.7 | Créer le sélecteur de période calendaire (date picker début/fin + toggle récurrent) | 3.1.2 |
| 3.4.8 | Intégrer le sélecteur de période dans le `JobForm` | 3.4.2, 3.4.7 |
| 3.4.9 | Ajouter la configuration de sortie dans le `JobForm` (répertoire, format, rétention) | 3.4.2 |
| 3.4.10 | Ajouter les boutons Start/Stop manuels dans `JobList` | 3.4.1, 2.3.7, 2.3.8 |
| 3.4.11 | Ajouter la duplication d'un job (pré-remplir le formulaire depuis un job existant) | 3.4.2, 2.3.4 |
| 3.4.12 | Afficher le prochain déclenchement prévu pour chaque job | 3.4.1, 1.4.7 |

### 3.5 Page Monitoring

| # | Tâche | Dépendances |
|---|---|---|
| 3.5.1 | Créer le composant `MonitoringPage` — liste des processus actifs avec indicateurs temps réel | 3.1.6, 2.5.3 |
| 3.5.2 | Créer le composant `LogViewer` — affichage des logs en streaming (terminal-like, auto-scroll) | 3.1.6, 2.5.4 |
| 3.5.3 | Intégrer le `LogViewer` avec sélection de job | 3.5.2, 3.5.1 |
| 3.5.4 | Ajouter l'historique d'exécution par job (tableau : date, durée, statut, fichiers produits) | 3.5.1, 2.3.10 |
| 3.5.5 | Ajouter les alertes visuelles (badge rouge pour les jobs en erreur, notifications toast) | 3.5.1, 2.5.3 |

### 3.6 Explorateur de fichiers

| # | Tâche | Dépendances |
|---|---|---|
| 3.6.1 | Créer l'endpoint `GET /api/files?path=...` côté backend — lister les fichiers/dossiers d'un répertoire de sortie | 2.1.2 |
| 3.6.2 | Créer l'endpoint `GET /api/files/download?path=...` — télécharger un fichier | 3.6.1 |
| 3.6.3 | Créer l'endpoint `DELETE /api/files?path=...` — supprimer un fichier/dossier | 3.6.1 |
| 3.6.4 | Créer le composant `FileExplorer` — navigation en arborescence (breadcrumb + liste) | 3.1.5, 3.6.1 |
| 3.6.5 | Ajouter l'aperçu des images (lightbox/modal) | 3.6.4 |
| 3.6.6 | Ajouter le lecteur vidéo intégré (video.js ou lecteur HTML5 natif) | 3.6.4 |
| 3.6.7 | Ajouter les boutons télécharger et supprimer (avec confirmation) | 3.6.4, 3.6.2, 3.6.3 |

### 3.7 Page Configuration

| # | Tâche | Dépendances |
|---|---|---|
| 3.7.1 | Créer le composant `SettingsPage` — formulaire pour la config globale (port, stockage, ffmpeg, notifications) | 3.1.5, 2.4.3, 2.4.4 |
| 3.7.2 | Ajouter la section export/import de la config complète (JSON download/upload) | 3.7.1 |
| 3.7.3 | Ajouter l'affichage des infos système (version CamCron, version ffmpeg, uptime, OS) | 3.7.1, 2.4.1 |

---

## Phase 4 — Robustesse et sécurité

### 4.1 Storage Manager (rétention et rotation)

| # | Tâche | Dépendances |
|---|---|---|
| 4.1.1 | Créer la classe `StorageManager` | 1.1.5 |
| 4.1.2 | Implémenter `calculateUsage(directory): { totalSize, fileCount, oldestFile, newestFile }` | 4.1.1 |
| 4.1.3 | Implémenter `applyRetentionByAge(directory, maxDays)` — supprimer les fichiers plus anciens que maxDays | 4.1.1, 4.1.2 |
| 4.1.4 | Implémenter `applyRetentionBySize(directory, maxSizeGB)` — supprimer les plus anciens jusqu'à respecter le quota | 4.1.1, 4.1.2 |
| 4.1.5 | Créer un job interne périodique qui applique les politiques de rétention de tous les jobs (cron interne, ex: toutes les heures) | 4.1.3, 4.1.4, 1.2.4 |
| 4.1.6 | Émettre des événements lors de la suppression automatique (pour notifications) | 4.1.5, 1.6.9 |
| 4.1.7 | Écrire les tests unitaires (calcul taille, suppression par âge, suppression par volume) | 4.1.1 à 4.1.5, 0.3.3 |

### 4.2 Authentification et sécurité

| # | Tâche | Dépendances |
|---|---|---|
| 4.2.1 | Installer les librairies JWT (`jsonwebtoken`) et hashing (`bcrypt`) | 0.2.1 |
| 4.2.2 | Créer le modèle `User` (id, username, passwordHash, role) | 4.2.1 |
| 4.2.3 | Implémenter l'endpoint `POST /api/auth/login` — authentification et retour d'un token JWT | 4.2.1, 4.2.2, 2.1.2 |
| 4.2.4 | Implémenter l'endpoint `POST /api/auth/register` (seulement si aucun utilisateur n'existe → setup initial) | 4.2.3 |
| 4.2.5 | Créer le middleware d'authentification JWT (vérification du token sur chaque requête `/api/*`) | 4.2.3 |
| 4.2.6 | Appliquer le middleware à toutes les routes sauf `/api/health` et `/api/auth/*` | 4.2.5, 2.2.1, 2.3.1, 2.4.1 |
| 4.2.7 | Implémenter le chiffrement des mots de passe caméra au repos (AES-256) | 4.2.1, 1.2.3 |
| 4.2.8 | Ajouter le rate limiting sur les endpoints d'authentification | 4.2.3 |
| 4.2.9 | Ajouter la protection CSRF | 2.1.2 |
| 4.2.10 | Créer la page de login dans le frontend | 3.1.4, 4.2.3 |
| 4.2.11 | Intégrer le token JWT dans le client API du frontend (stockage, refresh, redirect si expiré) | 3.1.5, 4.2.5 |
| 4.2.12 | Écrire les tests (login, token invalide, routes protégées, rate limit) | 4.2.3 à 4.2.9, 0.3.3 |

### 4.3 Notifications

| # | Tâche | Dépendances |
|---|---|---|
| 4.3.1 | Créer le module `src/core/notifications.ts` avec une interface `NotificationChannel` | 1.1.9 |
| 4.3.2 | Implémenter le canal Webhook (HTTP POST avec payload JSON configurable) | 4.3.1 |
| 4.3.3 | Implémenter le canal Email (envoi SMTP via `nodemailer`) | 4.3.1 |
| 4.3.4 | Implémenter le canal In-App (stockage des notifications pour le frontend) | 4.3.1, 2.5.3 |
| 4.3.5 | Connecter les événements du scheduler aux canaux de notification (caméra offline, job error, job retry, disque plein) | 4.3.2, 4.3.3, 4.3.4, 1.6.9, 4.1.6 |
| 4.3.6 | Ajouter la page de configuration des notifications dans le frontend | 3.7.1, 4.3.1 |
| 4.3.7 | Ajouter un bouton "Tester la notification" pour chaque canal | 4.3.6, 4.3.2, 4.3.3 |
| 4.3.8 | Écrire les tests (envoi webhook mock, envoi email mock, notification in-app) | 4.3.2 à 4.3.5, 0.3.3 |

### 4.4 HTTPS

| # | Tâche | Dépendances |
|---|---|---|
| 4.4.1 | Ajouter le support HTTPS au serveur HTTP (lecture certificat + clé privée) | 2.1.2, 1.1.9 |
| 4.4.2 | Documenter la génération de certificats auto-signés et l'intégration Let's Encrypt | 4.4.1 |
| 4.4.3 | Ajouter la redirection automatique HTTP → HTTPS quand HTTPS est activé | 4.4.1 |

### 4.5 Métriques et observabilité

| # | Tâche | Dépendances |
|---|---|---|
| 4.5.1 | Installer la librairie Prometheus client (`prom-client`) | 0.2.1 |
| 4.5.2 | Exposer les métriques de base : jobs actifs, processus en erreur, uptime | 4.5.1, 1.5.11 |
| 4.5.3 | Exposer les métriques de stockage : espace utilisé par job/caméra | 4.5.1, 4.1.2 |
| 4.5.4 | Créer l'endpoint `GET /api/metrics` au format Prometheus | 4.5.2, 4.5.3, 2.1.2 |

---

## Phase 5 — Fonctionnalités avancées

### 5.1 Détection de mouvement

| # | Tâche | Dépendances |
|---|---|---|
| 5.1.1 | Implémenter le builder de commande ffmpeg avec filtre de détection de mouvement (`select='gt(scene,0.01)'` ou lavfi) | 1.5.2 |
| 5.1.2 | Ajouter les paramètres de sensibilité dans `ProcessConfig` (seuil, zone, durée minimale) | 5.1.1, 1.1.6 |
| 5.1.3 | Ajouter l'action `detect_motion` dans le formulaire de job du frontend | 5.1.2, 3.4.4 |
| 5.1.4 | Écrire les tests (commande générée, paramètres) | 5.1.1, 5.1.2, 0.3.3 |

### 5.2 Assemblage automatique de timelapse

| # | Tâche | Dépendances |
|---|---|---|
| 5.2.1 | Créer une action `timelapse_assemble` qui prend un dossier de snapshots et génère une vidéo | 1.5.2 |
| 5.2.2 | Implémenter la commande ffmpeg d'assemblage (`-framerate X -pattern_type glob -i '*.jpg'`) | 5.2.1 |
| 5.2.3 | Permettre de planifier l'assemblage via un job cron (ex: assembler le timelapse de la veille chaque nuit) | 5.2.1, 1.6.5 |
| 5.2.4 | Ajouter l'option dans le frontend | 5.2.3, 3.4.4 |

### 5.3 Import/export de configuration

| # | Tâche | Dépendances |
|---|---|---|
| 5.3.1 | Implémenter `GET /api/config/export` — exporter toute la config (caméras + jobs + config globale) en JSON | 2.4.3, 1.2.3, 1.2.4 |
| 5.3.2 | Implémenter `POST /api/config/import` — importer une config JSON (validation + merge ou replace) | 5.3.1, 1.2.3, 1.2.4 |
| 5.3.3 | Ajouter les boutons export/import dans la page Settings du frontend | 5.3.1, 5.3.2, 3.7.2 |
| 5.3.4 | Gérer les conflits d'import (IDs existants → demander merge ou écrasement) | 5.3.2 |

### 5.4 Templates de jobs

| # | Tâche | Dépendances |
|---|---|---|
| 5.4.1 | Définir l'interface `JobTemplate` (comme un JobConfig mais sans cameraId ni id) | 1.1.2 |
| 5.4.2 | Implémenter les endpoints CRUD pour les templates (`/api/templates`) | 5.4.1, 2.1.2 |
| 5.4.3 | Implémenter `POST /api/templates/:id/apply` — créer un job à partir d'un template (en spécifiant la caméra) | 5.4.2, 2.3.3 |
| 5.4.4 | Ajouter la gestion des templates dans le frontend (liste, création, application) | 5.4.2, 5.4.3, 3.4.2 |
| 5.4.5 | Fournir des templates par défaut (surveillance 24/7, timelapse journalier, snapshot horaire) | 5.4.2 |

### 5.5 Docker et déploiement

| # | Tâche | Dépendances |
|---|---|---|
| 5.5.1 | Finaliser le `Dockerfile` multi-stage (build TypeScript → image de production Node + ffmpeg) | 0.3.5, 3.1.8 |
| 5.5.2 | Finaliser le `docker-compose.yml` (volumes pour data et config, variables d'environnement) | 5.5.1 |
| 5.5.3 | Ajouter le support des variables d'environnement pour surcharger la config JSON | 5.5.2, 1.1.9 |
| 5.5.4 | Tester le build et l'exécution sur Linux x64 | 5.5.2 |
| 5.5.5 | Tester le build et l'exécution sur Linux ARM (Raspberry Pi) | 5.5.2 |
| 5.5.6 | Rédiger la documentation de déploiement (Docker, installation native, configuration) | 5.5.4, 5.5.5 |

---

## Résumé des dépendances critiques (chemin critique)

```
0.2.3 (tsconfig)
  └→ 1.1.* (modèles de données)
       ├→ 1.2.* (persistance)
       ├→ 1.3.* (templating)
       ├→ 1.4.* (périodes calendaires)
       └→ 1.5.* (process supervisor)
            └→ 1.6.* (scheduler engine)
                 └→ 1.8.* (point d'entrée)
                      └→ 2.1.* (serveur HTTP)
                           ├→ 2.2.* (routes caméras)
                           ├→ 2.3.* (routes jobs)
                           ├→ 2.4.* (routes système)
                           └→ 2.5.* (WebSocket)
                                └→ 3.1.* (init frontend)
                                     ├→ 3.2.* (dashboard)
                                     ├→ 3.3.* (page caméras)
                                     ├→ 3.4.* (page jobs)
                                     ├→ 3.5.* (monitoring)
                                     ├→ 3.6.* (fichiers)
                                     └→ 3.7.* (config)
                                          └→ 4.* (robustesse)
                                               └→ 5.* (avancé)
```

> **Note** : Les groupes 1.2, 1.3, 1.4 et 1.5 sont parallélisables entre eux (ils dépendent tous de 1.1 mais pas les uns des autres). De même, 2.2, 2.3, 2.4 sont parallélisables une fois 2.1 en place.
