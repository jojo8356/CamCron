# CamCron — Cahier des charges

> Système de gestion multi-processus de caméras IP piloté par cron

**Version** : 1.0
**Date** : 2026-02-16
**Statut** : Draft

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Glossaire](#2-glossaire)
3. [Périmètre fonctionnel](#3-périmètre-fonctionnel)
4. [Exigences non-fonctionnelles](#4-exigences-non-fonctionnelles)
5. [Architecture technique](#5-architecture-technique)
6. [Format de configuration](#6-format-de-configuration)
7. [Cas d'utilisation](#7-cas-dutilisation)
8. [Contraintes et limites](#8-contraintes-et-limites)
9. [Roadmap](#9-roadmap)

---

## 1. Présentation du projet

### 1.1 Vision

CamCron est un système de gestion de caméras IP permettant d'exécuter **plusieurs processus d'enregistrement simultanés** sur une même caméra, orchestrés par des **expressions cron** et/ou des **périodes calendaires précises**.

Contrairement aux solutions existantes (Synology Surveillance Station, QNAP QVR Pro, Blue Iris...) qui limitent chaque caméra à un seul profil d'enregistrement actif à la fois, CamCron traite chaque tâche d'enregistrement comme un **job indépendant** pouvant coexister avec d'autres jobs sur la même caméra.

### 1.2 Positionnement vs existant

| Caractéristique | Solutions classiques (NAS/VMS) | CamCron |
|---|---|---|
| Jobs par caméra | 1 profil actif à la fois | N jobs simultanés illimités |
| Planification | Grille hebdomadaire fixe | Expressions cron (minute) + périodes calendaires |
| Sorties | 1 flux → 1 destination | Chaque job → sa propre destination et config |
| Granularité temporelle | Heure | Minute (via cron) |
| Périodes calendaires | Absent ou limité | Natif (dates de début/fin, récurrences annuelles) |
| Multi-usage | Surveillance uniquement | Timelapse, audit, archivage, tests, surveillance... |
| Orchestration | Monolithique | Chaque job = processus indépendant supervisé |

### 1.3 Public cible

- Administrateurs système / DevOps gérant des parcs de caméras
- Passionnés de domotique et auto-hébergement
- PME souhaitant une solution flexible sans licence coûteuse
- Projets de timelapse, monitoring environnemental, recherche

---

## 2. Glossaire

| Terme | Définition |
|---|---|
| **Caméra** | Source vidéo identifiée par une URL de flux (RTSP, HTTP, ONVIF). Une caméra peut fournir plusieurs flux (main stream, sub stream). |
| **Job** | Unité de travail autonome associant une caméra, une action, un planning cron et/ou une période calendaire, et une configuration de sortie. |
| **Processus** | Instance système (ex: ffmpeg) lancée par un job pour exécuter l'action demandée. |
| **Scheduler** | Moteur central qui évalue les expressions cron et les périodes calendaires pour démarrer/arrêter les jobs au bon moment. |
| **Expression cron** | Format standard de planification : `minute heure jour_du_mois mois jour_de_la_semaine` (ex: `0 8-18 * * 1-5` = du lundi au vendredi de 8h à 18h). |
| **Période calendaire** | Intervalle de dates précis (ex: du 15/03 au 30/04) pendant lequel un job est actif, éventuellement récurrent chaque année. |
| **Action** | Type d'opération exécutée par un job : enregistrement continu, snapshot, détection de mouvement, test de connectivité, commande personnalisée. |
| **Rétention** | Durée ou volume maximal de conservation des fichiers produits par un job avant suppression automatique. |

---

## 3. Périmètre fonctionnel

### 3.1 Gestion des caméras

#### 3.1.1 CRUD caméras
- Ajouter, modifier, supprimer, lister des caméras
- Chaque caméra possède :
  - Un identifiant unique
  - Un nom lisible
  - Une ou plusieurs URLs de flux (main stream HD, sub stream SD)
  - Le protocole utilisé (RTSP, RTMP, HTTP/MJPEG, ONVIF)
  - Des identifiants d'authentification (utilisateur/mot de passe)
  - Des métadonnées optionnelles (emplacement, modèle, tags)

#### 3.1.2 Protocoles supportés
- **RTSP** : protocole principal pour les caméras IP
- **RTMP** : flux de streaming
- **HTTP/MJPEG** : caméras basiques / webcams réseau
- **ONVIF** : découverte et contrôle standardisé (PTZ, profils)

#### 3.1.3 Vérification de connectivité
- Test de connexion à la demande ou planifié
- Détection de caméra hors ligne avec alerte

### 3.2 Système de jobs

#### 3.2.1 Définition d'un job
Chaque job est défini par :

| Champ | Type | Description |
|---|---|---|
| `id` | string | Identifiant unique du job |
| `name` | string | Nom lisible |
| `cameraId` | string | Référence à une caméra |
| `streamUrl` | string (optionnel) | URL de flux spécifique (sinon flux par défaut de la caméra) |
| `action` | enum | Type d'action (voir 3.3) |
| `schedule` | object | Planning cron et/ou période calendaire (voir 3.2.2) |
| `output` | object | Configuration de sortie (voir 3.4) |
| `processConfig` | object | Paramètres du processus (codec, résolution, etc.) |
| `enabled` | boolean | Activation/désactivation du job |
| `maxRetries` | number | Nombre de tentatives en cas d'échec |
| `priority` | number | Priorité relative (pour gestion des ressources) |

#### 3.2.2 Planification

**Expressions cron (5 champs standard)**
```
┌───────────── minute (0-59)
│ ┌───────────── heure (0-23)
│ │ ┌───────────── jour du mois (1-31)
│ │ │ ┌───────────── mois (1-12)
│ │ │ │ ┌───────────── jour de la semaine (0-7, 0 et 7 = dimanche)
│ │ │ │ │
* * * * *
```

Exemples :
- `*/5 * * * *` — toutes les 5 minutes
- `0 8-18 * * 1-5` — chaque heure de 8h à 18h, lundi à vendredi
- `0 22 * * *` — chaque soir à 22h
- `0 0 1 * *` — le 1er de chaque mois à minuit

**Périodes calendaires**
```json
{
  "startDate": "2026-03-15",
  "endDate": "2026-04-30",
  "recurrent": false
}
```
```json
{
  "startDate": "--12-01",
  "endDate": "--02-28",
  "recurrent": true
}
```

**Combinaison cron + période** : le job ne s'exécute que si l'expression cron correspond ET que la date courante est dans la période calendaire.

#### 3.2.3 Multi-processus parallèles
- Plusieurs jobs peuvent cibler la même caméra simultanément
- Chaque job spawne son propre processus indépendant
- Pas de limite logicielle au nombre de jobs par caméra (limité uniquement par les ressources système et les capacités de la caméra)
- Le scheduler gère le cycle de vie de chaque processus indépendamment

#### 3.2.4 Types de déclenchement
- **Continu pendant la plage cron** : le processus tourne tant que le cron est actif (ex: enregistrement de 8h à 18h)
- **Ponctuel au tick cron** : le processus s'exécute une fois à chaque déclenchement cron (ex: snapshot toutes les 5 min)
- **Durée fixe** : le processus s'exécute pendant une durée définie à chaque déclenchement (ex: capturer 30 secondes toutes les heures)

### 3.3 Actions disponibles

| Action | Description | Processus typique |
|---|---|---|
| `record` | Enregistrement continu du flux vidéo | ffmpeg (copie ou ré-encodage) |
| `snapshot` | Capture d'une image fixe | ffmpeg -frames:v 1 |
| `timelapse` | Capture périodique d'images pour assemblage | ffmpeg snapshot répété |
| `detect_motion` | Enregistrement déclenché par détection de mouvement | ffmpeg + filtre de mouvement |
| `test_connection` | Vérification que la caméra répond | ffprobe / curl |
| `custom_command` | Commande shell personnalisée | Définie par l'utilisateur |

### 3.4 Gestion du stockage et des sorties

#### 3.4.1 Configuration de sortie par job
```json
{
  "directory": "/data/cameras/{cameraName}/{jobName}/{date}",
  "filenamePattern": "{cameraName}_{timestamp}.{ext}",
  "format": "mp4",
  "segmentDuration": 3600,
  "retention": {
    "maxDays": 30,
    "maxSizeGB": 50
  }
}
```

#### 3.4.2 Variables de templating
- `{cameraId}`, `{cameraName}` — identifiant et nom de la caméra
- `{jobId}`, `{jobName}` — identifiant et nom du job
- `{date}`, `{time}`, `{timestamp}` — date/heure au moment de l'enregistrement
- `{year}`, `{month}`, `{day}`, `{hour}`, `{minute}` — composants individuels

#### 3.4.3 Rétention et rotation
- Suppression automatique des fichiers dépassant la durée de rétention (`maxDays`)
- Suppression automatique si le volume dépasse le quota (`maxSizeGB`)
- Politique de suppression : plus ancien en premier (FIFO)
- Rétention configurable par job (chaque job a sa propre politique)

#### 3.4.4 Formats de sortie supportés
- Vidéo : MP4, MKV, AVI, TS
- Image : JPEG, PNG, WebP
- Segmentation automatique des fichiers vidéo (par durée ou par taille)

### 3.5 Interface web

#### 3.5.1 Dashboard
- Vue d'ensemble : nombre de caméras, jobs actifs, espace disque utilisé
- Statut en temps réel de chaque processus (running, stopped, error)
- Graphiques d'utilisation des ressources (CPU, RAM, disque, bande passante)
- Fil d'activité récente (derniers événements, alertes)

#### 3.5.2 Gestion des caméras
- Liste des caméras avec statut de connectivité
- Formulaire d'ajout/modification de caméra
- Aperçu live du flux (thumbnail ou player intégré)
- Test de connexion depuis l'interface

#### 3.5.3 Gestion des jobs
- Liste de tous les jobs avec filtres (par caméra, par statut, par action)
- Création/modification de job avec formulaire assisté
- Éditeur visuel de planning cron (grille cliquable jour/heure + champ cron brut)
- Sélecteur de période calendaire (date picker)
- Démarrage/arrêt manuel d'un job
- Duplication d'un job existant
- Visualisation du prochain déclenchement prévu

#### 3.5.4 Monitoring
- Logs en temps réel par job (streaming via WebSocket)
- Historique des exécutions avec statut (succès, échec, durée)
- Alertes visuelles pour les processus en erreur
- Métriques par job (nombre d'exécutions, volume produit, erreurs)

#### 3.5.5 Explorateur de fichiers
- Navigation dans les fichiers produits par chaque job
- Aperçu des images et lecture des vidéos depuis le navigateur
- Téléchargement et suppression manuelle

#### 3.5.6 Configuration générale
- Paramètres globaux (chemins par défaut, limites de ressources)
- Gestion des utilisateurs et authentification
- Export/import de la configuration complète (JSON)

### 3.6 API REST

L'interface web communique avec le backend via une API REST. Cette API est aussi utilisable directement par des outils tiers.

#### 3.6.1 Endpoints principaux

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cameras` | Lister les caméras |
| `POST` | `/api/cameras` | Ajouter une caméra |
| `GET` | `/api/cameras/:id` | Détails d'une caméra |
| `PUT` | `/api/cameras/:id` | Modifier une caméra |
| `DELETE` | `/api/cameras/:id` | Supprimer une caméra |
| `POST` | `/api/cameras/:id/test` | Tester la connectivité |
| `GET` | `/api/jobs` | Lister les jobs |
| `POST` | `/api/jobs` | Créer un job |
| `GET` | `/api/jobs/:id` | Détails d'un job |
| `PUT` | `/api/jobs/:id` | Modifier un job |
| `DELETE` | `/api/jobs/:id` | Supprimer un job |
| `POST` | `/api/jobs/:id/start` | Démarrer manuellement un job |
| `POST` | `/api/jobs/:id/stop` | Arrêter manuellement un job |
| `GET` | `/api/jobs/:id/logs` | Logs d'un job |
| `GET` | `/api/jobs/:id/history` | Historique d'exécution |
| `GET` | `/api/status` | Statut global du système |
| `GET` | `/api/storage` | Utilisation du stockage |
| `GET` | `/api/config` | Configuration globale |
| `PUT` | `/api/config` | Modifier la configuration |
| `WS` | `/ws/logs/:jobId` | Flux de logs en temps réel |
| `WS` | `/ws/status` | Statut en temps réel |

#### 3.6.2 Authentification API
- Authentification par token JWT
- Possibilité de générer des tokens API pour l'intégration avec des outils tiers

### 3.7 Notifications et alertes

| Événement | Description |
|---|---|
| Caméra hors ligne | La caméra ne répond plus au flux |
| Job en échec | Le processus a crashé ou s'est terminé avec une erreur |
| Job redémarré | Le processus a été relancé après un crash (retry) |
| Espace disque faible | Le stockage atteint un seuil critique |
| Rétention appliquée | Des fichiers ont été supprimés automatiquement |

Canaux de notification :
- Interface web (notifications in-app)
- Webhook (HTTP POST vers une URL configurable)
- Email (SMTP configurable)

---

## 4. Exigences non-fonctionnelles

### 4.1 Performance
- Le scheduler doit pouvoir gérer **100+ jobs simultanés** sans dégradation
- Latence de démarrage d'un processus < 2 secondes après le tick cron
- L'interface web doit rester réactive même avec de nombreux jobs actifs
- Les logs en streaming ne doivent pas impacter les performances du système

### 4.2 Fiabilité
- Redémarrage automatique des processus en cas de crash (configurable par job)
- Persistance de l'état : après un redémarrage de CamCron, tous les jobs reprennent selon leur planning
- Aucune perte de configuration en cas d'arrêt brutal (écriture atomique)
- Gestion gracieuse de l'arrêt (SIGTERM → arrêt propre de tous les processus)

### 4.3 Sécurité
- Mots de passe des caméras chiffrés au repos dans la configuration
- Authentification obligatoire pour l'interface web et l'API
- HTTPS supporté (certificat configurable ou Let's Encrypt)
- Pas d'exécution de commandes arbitraires sans validation (pour `custom_command`)
- Protection CSRF et rate limiting sur l'API

### 4.4 Portabilité
- Compatible Linux (x64, ARM), Windows, macOS
- Image Docker officielle avec docker-compose
- Dépendance externe unique : **ffmpeg** (installé séparément ou embarqué dans Docker)
- Pas de dépendance à une base de données externe (stockage en fichiers JSON ou SQLite embarqué)

### 4.5 Observabilité
- Logs structurés (JSON) avec niveaux (debug, info, warn, error)
- Métriques exposables au format Prometheus (optionnel)
- Health check endpoint (`/api/health`)

---

## 5. Architecture technique

### 5.1 Stack technologique

| Composant | Technologie |
|---|---|
| Langage | TypeScript (Node.js) |
| Runtime | Node.js >= 20 LTS |
| Framework API | Express ou Fastify |
| Interface web | React (ou Vue.js) avec Vite |
| Communication temps réel | WebSocket (ws / Socket.io) |
| Scheduler cron | node-cron ou cron-parser |
| Gestion de processus | child_process (spawn) natif Node.js |
| Stockage de données | SQLite (via better-sqlite3) ou fichiers JSON |
| Outil vidéo | ffmpeg (invoqué en processus externe) |
| Conteneurisation | Docker + docker-compose |

### 5.2 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Interface Web (React)                     │
│  Dashboard │ Caméras │ Jobs │ Monitoring │ Fichiers │ Config    │
└──────────┬──────────────────────────────────────────────────────┘
           │ HTTP / WebSocket
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Node.js / TypeScript                 │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  API REST    │  │  WebSocket   │  │   Notification Engine  │ │
│  │  Controller  │  │  Server      │  │   (webhook/email)      │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬───────────┘ │
│         │                │                        │              │
│  ┌──────▼────────────────▼────────────────────────▼───────────┐ │
│  │                    Core Services                            │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐ │ │
│  │  │  Camera      │  │  Job         │  │  Storage          │ │ │
│  │  │  Manager     │  │  Manager     │  │  Manager          │ │ │
│  │  └─────────────┘  └──────┬───────┘  └───────────────────┘ │ │
│  │                          │                                  │ │
│  │  ┌───────────────────────▼──────────────────────────────┐  │ │
│  │  │              Scheduler Engine                         │  │ │
│  │  │  ┌────────────────┐  ┌────────────────────────────┐  │  │ │
│  │  │  │  Cron Parser    │  │  Calendar Period Evaluator │  │  │ │
│  │  │  └────────────────┘  └────────────────────────────┘  │  │ │
│  │  └───────────────────────┬──────────────────────────────┘  │ │
│  └──────────────────────────┼─────────────────────────────────┘ │
│                             │ spawn / kill                       │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                  Process Supervisor                          ││
│  │                                                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │ ffmpeg   │  │ ffmpeg   │  │ ffmpeg   │  │ custom   │   ││
│  │  │ cam1/jobA│  │ cam1/jobB│  │ cam2/jobC│  │ cam3/jobD│   ││
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   ││
│  └───────┼──────────────┼──────────────┼──────────────┼────────┘│
└──────────┼──────────────┼──────────────┼──────────────┼─────────┘
           ▼              ▼              ▼              ▼
     /data/cam1/     /data/cam1/     /data/cam2/    /data/cam3/
      timelapse/      work-hd/        nuit/          custom/
```

### 5.3 Composants clés

**Scheduler Engine** : coeur du système. Évalue chaque minute les expressions cron de tous les jobs actifs, vérifie les périodes calendaires, et transmet les ordres de démarrage/arrêt au Process Supervisor.

**Process Supervisor** : gère le cycle de vie des processus enfants (spawn, monitor, restart, kill). Chaque processus est isolé et supervisé indépendamment. Collecte les logs stdout/stderr et les transmet au système de logs.

**Camera Manager** : CRUD des caméras, tests de connectivité, gestion des flux.

**Job Manager** : CRUD des jobs, validation des configurations, gestion de l'état (enabled/disabled, running/stopped).

**Storage Manager** : gestion des fichiers produits, application des politiques de rétention, calcul de l'espace utilisé.

---

## 6. Format de configuration

### 6.1 Configuration globale (`config.json`)

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "https": {
      "enabled": false,
      "certPath": "",
      "keyPath": ""
    }
  },
  "storage": {
    "basePath": "/data/camcron",
    "defaultRetention": {
      "maxDays": 30,
      "maxSizeGB": 100
    }
  },
  "ffmpeg": {
    "path": "/usr/bin/ffmpeg",
    "ffprobePath": "/usr/bin/ffprobe"
  },
  "notifications": {
    "webhook": {
      "enabled": false,
      "url": ""
    },
    "email": {
      "enabled": false,
      "smtp": {
        "host": "",
        "port": 587,
        "user": "",
        "pass": ""
      },
      "to": ""
    }
  },
  "auth": {
    "jwtSecret": "CHANGE_ME",
    "sessionTimeout": 3600
  },
  "logging": {
    "level": "info",
    "file": "/var/log/camcron/camcron.log"
  }
}
```

### 6.2 Exemple de caméra

```json
{
  "id": "cam-garage",
  "name": "Caméra Garage",
  "streams": {
    "main": "rtsp://admin:password@192.168.1.100:554/stream1",
    "sub": "rtsp://admin:password@192.168.1.100:554/stream2"
  },
  "protocol": "rtsp",
  "tags": ["extérieur", "garage"],
  "location": "Garage - angle nord-est",
  "model": "Hikvision DS-2CD2143G2-I",
  "enabled": true
}
```

### 6.3 Exemples de jobs

**Job 1 — Enregistrement continu HD en semaine**
```json
{
  "id": "job-garage-workhours",
  "name": "Garage - Enregistrement heures de travail",
  "cameraId": "cam-garage",
  "streamKey": "main",
  "action": "record",
  "schedule": {
    "cron": "0 8 * * 1-5",
    "cronStop": "0 18 * * 1-5",
    "triggerType": "continuous"
  },
  "output": {
    "directory": "/data/camcron/{cameraName}/work/{year}/{month}/{day}",
    "filenamePattern": "{cameraName}_{timestamp}",
    "format": "mp4",
    "segmentDuration": 3600
  },
  "processConfig": {
    "codec": "copy",
    "extraArgs": ["-rtsp_transport", "tcp"]
  },
  "retention": {
    "maxDays": 14
  },
  "maxRetries": 3,
  "enabled": true
}
```

**Job 2 — Timelapse toutes les 5 minutes, 24/7**
```json
{
  "id": "job-garage-timelapse",
  "name": "Garage - Timelapse",
  "cameraId": "cam-garage",
  "streamKey": "sub",
  "action": "snapshot",
  "schedule": {
    "cron": "*/5 * * * *",
    "triggerType": "oneshot"
  },
  "output": {
    "directory": "/data/camcron/{cameraName}/timelapse/{year}/{month}",
    "filenamePattern": "{cameraName}_{timestamp}",
    "format": "jpg"
  },
  "processConfig": {
    "resolution": "1280x720",
    "quality": 85
  },
  "retention": {
    "maxDays": 90
  },
  "maxRetries": 1,
  "enabled": true
}
```

**Job 3 — Enregistrement saisonnier (période calendaire)**
```json
{
  "id": "job-jardin-oiseaux",
  "name": "Jardin - Mangeoire oiseaux (hiver)",
  "cameraId": "cam-jardin",
  "streamKey": "main",
  "action": "record",
  "schedule": {
    "cron": "0 7 * * *",
    "cronStop": "0 17 * * *",
    "triggerType": "continuous",
    "period": {
      "startDate": "--11-15",
      "endDate": "--03-15",
      "recurrent": true
    }
  },
  "output": {
    "directory": "/data/camcron/{cameraName}/oiseaux/{year}/{month}/{day}",
    "filenamePattern": "{cameraName}_{timestamp}",
    "format": "mkv",
    "segmentDuration": 1800
  },
  "processConfig": {
    "codec": "copy"
  },
  "retention": {
    "maxDays": 365
  },
  "maxRetries": 3,
  "enabled": true
}
```

**Job 4 — Commande personnalisée**
```json
{
  "id": "job-garage-audit",
  "name": "Garage - Audit qualité vidéo",
  "cameraId": "cam-garage",
  "streamKey": "main",
  "action": "custom_command",
  "schedule": {
    "cron": "0 */6 * * *",
    "triggerType": "oneshot"
  },
  "processConfig": {
    "command": "ffprobe -v quiet -print_format json -show_streams {streamUrl}",
    "timeout": 30
  },
  "output": {
    "directory": "/data/camcron/{cameraName}/audit",
    "filenamePattern": "audit_{timestamp}",
    "format": "json"
  },
  "retention": {
    "maxDays": 7
  },
  "enabled": true
}
```

---

## 7. Cas d'utilisation

### CU-01 : Surveillance classique avec double qualité
> **Contexte** : Un commerce veut enregistrer en HD pour la police et en SD pour consultation rapide.

- **Job A** : `cam-boutique` → `record` continu HD → rétention 30 jours
- **Job B** : `cam-boutique` → `record` continu SD (sub stream) → rétention 7 jours

Les deux jobs tournent en parallèle sur la même caméra.

### CU-02 : Timelapse de chantier
> **Contexte** : Suivre l'avancement d'un chantier du 1er mars au 30 septembre.

- **Job** : `cam-chantier` → `snapshot` toutes les 10 min → période `2026-03-01` à `2026-09-30` → rétention 365 jours

### CU-03 : Surveillance renforcée le week-end
> **Contexte** : Un entrepôt veut un enregistrement continu la semaine et un enregistrement + snapshots le week-end.

- **Job A** : `cam-entrepot` → `record` → cron `0 0 * * 1-5` / stop `0 0 * * 6` (continu lun-ven)
- **Job B** : `cam-entrepot` → `record` → cron `0 0 * * 6` / stop `0 0 * * 1` (continu week-end, résolution max)
- **Job C** : `cam-entrepot` → `snapshot` toutes les 2 min → cron `*/2 * * * 0,6` (snapshots week-end uniquement)

### CU-04 : Monitoring de serveur physique
> **Contexte** : Vérifier visuellement l'état des LEDs d'un rack serveur.

- **Job** : `cam-rack` → `snapshot` → cron `0 */1 * * *` → rétention 48h

### CU-05 : Multi-sites avec jobs hétérogènes
> **Contexte** : Gestion de 10 caméras sur 3 sites avec des besoins variés.

- Site A (bureau) : 4 caméras × 1 job record heures ouvrables
- Site B (entrepôt) : 4 caméras × 2 jobs (record 24/7 + snapshot horaire)
- Site C (parking) : 2 caméras × 3 jobs (record nuit, timelapse jour, test connectivité)

Total : 21 jobs simultanés gérés par le même CamCron.

---

## 8. Contraintes et limites

### 8.1 Contraintes techniques
- **Flux simultanés par caméra** : la plupart des caméras IP limitent le nombre de connexions RTSP simultanées (souvent 2 à 4). CamCron doit documenter cette limite et optionnellement permettre de configurer un maximum de connexions par caméra.
- **Ressources système** : chaque processus ffmpeg consomme CPU et RAM. Le système doit pouvoir limiter le nombre total de processus simultanés.
- **Bande passante** : les flux HD consomment beaucoup de bande passante. L'utilisation du sub stream est recommandée pour les jobs secondaires.
- **Dépendance ffmpeg** : ffmpeg doit être installé et accessible. La version minimale requise doit être documentée.

### 8.2 Limites volontaires (v1)
- Pas d'intelligence artificielle embarquée (détection d'objets, reconnaissance faciale)
- Pas de PTZ automatique (pan-tilt-zoom)
- Pas de stockage cloud natif (possible via montage réseau)
- Pas de re-streaming / proxy RTSP intégré
- Pas de clustering multi-serveurs

### 8.3 Réglementation
- L'utilisateur est responsable du respect de la réglementation en vigueur (RGPD, droit à l'image, déclaration CNIL le cas échéant)
- CamCron ne collecte aucune donnée personnelle au-delà de la configuration locale

---

## 9. Roadmap

### Phase 1 — Fondations (MVP)
- Moteur scheduler (cron + périodes calendaires)
- Process supervisor (spawn, monitor, restart, kill ffmpeg)
- CRUD caméras et jobs via API REST
- Stockage de la configuration en JSON/SQLite
- CLI de base pour démarrage et statut
- Logging structuré

### Phase 2 — Interface web
- Dashboard avec statut temps réel
- Gestion des caméras (CRUD + test connectivité)
- Gestion des jobs (CRUD + éditeur visuel cron)
- Monitoring des processus (logs en streaming)
- Explorateur de fichiers (aperçu images/vidéos)

### Phase 3 — Robustesse
- Rétention et rotation automatique du stockage
- Notifications (webhook, email)
- Authentification et gestion des utilisateurs
- HTTPS natif
- Métriques Prometheus

### Phase 4 — Fonctionnalités avancées
- Détection de mouvement intégrée
- Assemblage automatique de timelapses
- Import/export de configuration
- Templates de jobs réutilisables
- Image Docker officielle avec documentation
- Support ONVIF avancé (découverte, PTZ)
