# Phase 0 — Initialisation du projet

> **Statut** : Terminée
> **Date** : 2026-02-16
> **Résultat** : 12/12 tâches complétées

---

## 0.1 Mise en place du dépôt

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 0.1.1 | Initialiser le dépôt Git | Done | `git init` — branche `master` |
| 0.1.2 | Créer le `.gitignore` | Done | node_modules, dist, .env, data/, *.sqlite, IDE, OS, coverage, logs |
| 0.1.3 | Créer le `README.md` | Done | Description projet, stack, prérequis, commandes install/dev/docker |

### Fichiers créés
- `.git/`
- `.gitignore`
- `README.md`

---

## 0.2 Initialisation Node.js / TypeScript

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 0.2.1 | `pnpm init` → `package.json` | Done | name: camcron, version: 0.1.0, type: module |
| 0.2.2 | Installer TypeScript + tsx | Done | typescript 5.9.3, tsx 4.21.0, @types/node 25.2.3 |
| 0.2.3 | Créer `tsconfig.json` | Done | target ES2022, module NodeNext, strict: true |
| 0.2.4 | Structure de dossiers | Done | `src/core/`, `src/api/routes/`, `src/web/`, `tests/` |
| 0.2.5 | Scripts pnpm | Done | dev, build, start, test, test:watch, lint, format |

### Fichiers créés
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `src/index.ts` (point d'entrée placeholder)
- `src/core/` (vide)
- `src/api/routes/` (vide)
- `src/web/` (vide)
- `tests/` (vide)

### Configuration TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Scripts disponibles

| Script | Commande | Description |
|---|---|---|
| `pnpm dev` | `tsx watch src/index.ts` | Développement avec hot-reload |
| `pnpm build` | `tsc` | Compilation TypeScript → `dist/` |
| `pnpm start` | `node dist/index.js` | Exécution en production |
| `pnpm test` | `vitest run` | Lancer les tests une fois |
| `pnpm test:watch` | `vitest` | Lancer les tests en mode watch |
| `pnpm lint` | `eslint src/` | Vérification du code |
| `pnpm format` | `prettier --write "src/**/*.ts"` | Formatage du code |

---

## 0.3 Outillage de développement

| # | Tâche | Statut | Détails |
|---|---|---|---|
| 0.3.1 | ESLint pour TypeScript | Done | eslint 10.0.0 + typescript-eslint 8.55.0 |
| 0.3.2 | Prettier | Done | prettier 3.8.1 — semi, singleQuote, trailingComma: all |
| 0.3.3 | Vitest | Done | vitest 4.0.18 — globals: true, include: tests/**/*.test.ts |
| 0.3.4 | Test trivial de validation | Done | 2 tests passed (sanity check) |
| 0.3.5 | Dockerfile | Done | Multi-stage : build TS → prod Node 20 Alpine + ffmpeg |
| 0.3.6 | docker-compose.yml | Done | Port 3000, volumes data + config |

### Fichiers créés
- `eslint.config.js`
- `.prettierrc`
- `vitest.config.ts`
- `tests/sanity.test.ts`
- `Dockerfile`
- `docker-compose.yml`

### Vérifications effectuées

| Vérification | Résultat |
|---|---|
| `pnpm build` (compilation TS) | OK |
| `pnpm test` (2 tests sanity) | OK — 2 passed (304ms) |
| `pnpm lint` (ESLint) | OK — 0 erreur |

### Dépendances installées

**devDependencies :**

| Package | Version | Rôle |
|---|---|---|
| typescript | 5.9.3 | Compilateur TypeScript |
| tsx | 4.21.0 | Exécution TS en dev (watch mode) |
| @types/node | 25.2.3 | Types Node.js |
| eslint | 10.0.0 | Linter |
| @eslint/js | 10.0.1 | Config ESLint recommandée |
| typescript-eslint | 8.55.0 | Plugin ESLint pour TypeScript |
| prettier | 3.8.1 | Formateur de code |
| vitest | 4.0.18 | Framework de test |

### Docker

**Dockerfile** — Build multi-stage :
1. **Stage builder** : Node 20 Alpine → install deps → `pnpm build`
2. **Stage prod** : Node 20 Alpine + ffmpeg → deps prod only → copie `dist/`

**docker-compose.yml** :
- Port `3000:3000`
- Volume `camcron-data` → `/data/camcron`
- Volume bind `./config.json` → `/app/config.json` (lecture seule)
- `NODE_ENV=production`

---

## Arborescence du projet après Phase 0

```
CamCron/
├── docs/
│   ├── cahier-des-charges.md
│   ├── todolist.md
│   └── Phase0.md
├── src/
│   ├── core/
│   ├── api/
│   │   └── routes/
│   ├── web/
│   └── index.ts
├── tests/
│   └── sanity.test.ts
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
└── vitest.config.ts
```

---

## Prêt pour Phase 1

La Phase 0 est complète. Toutes les fondations sont en place pour démarrer la Phase 1 (MVP backend) :
- TypeScript compile correctement
- Les tests tournent
- Le linter fonctionne
- Docker est configuré
- La structure de dossiers est prête

Prochaine étape : **1.1 Modèles de données** (interfaces TypeScript pour Camera, Job, Schedule, etc.)
