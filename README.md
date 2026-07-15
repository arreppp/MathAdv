# MathAdventura Web Edition

A production-ready educational web game combining mathematics learning, RPG-style progression,
achievements, leaderboards, and teacher analytics for students aged 7-15.

## Status

This repo has a complete, verified vertical slice: register → login → play World 1
(Addition/Subtraction) in Phaser → earn XP → see it on the dashboard, plus a full DB schema and
API surface for every spec'd module. Teacher analytics, the admin panel, class management, and
Worlds 2-4 gameplay are scaffolded (routes/pages/controllers exist) but not fully built yet —
see the module list below.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Phaser 3, React Router, TanStack Query, Zustand
- **Backend**: Laravel 11, PHP 8.3, MySQL
- **Auth**: Laravel Sanctum (token-based API auth)
- **Deployment**: Vercel (frontend), Hostinger VPS (backend)

## Repo Layout

```
MathAdv/
├── backend/     Laravel 11 API
├── frontend/    React 19 + TS + Vite + Tailwind + Phaser 3
├── docker/      docker-compose.yml + Dockerfiles (deployment; optional for local dev)
└── .github/     CI/CD workflows
```

## What's implemented

| Module | Status |
| --- | --- |
| Auth (register/login/logout, roles) | Done |
| DB schema (all 14 spec modules + pivots) | Done |
| World 1 gameplay (Phaser + adaptive questions + XP) | Done |
| Student dashboard (XP/level/activity) | Done |
| Leaderboard, Achievements/Badges, Daily Reward | Done (real data, simple UI) |
| Teacher dashboard, class management, admin panel | Scaffolded only (placeholder UI) |
| Worlds 2-4 (Multiplication/Division/Fractions) | Schema ready, no seeded levels/scenes yet |
| Matching / Drag-and-drop question types | Schema ready, no playable UI yet |
| Docker, CI/CD | Done (see below) |

## Local Development

### Option A: Laragon (or any local PHP/MySQL/Node stack)

This is the primary local dev flow used while building this project.

**Backend**

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Make sure DB_* in .env points at a running MySQL instance and the database exists, e.g.:
#   mysql -u root -e "CREATE DATABASE mathadventura;"
php artisan migrate --seed
php artisan serve         # http://localhost:8000
```

Seeding creates an admin user: `admin@mathadventura.test` / `password`.

**Frontend**

```sh
cd frontend
npm install
cp .env.example .env      # VITE_API_URL defaults to http://localhost:8000/api/v1
npm run dev                # http://localhost:5173
```

**Tests**

```sh
cd backend && php artisan test
cd frontend && npm run test
```

### Option B: Docker

Docker Compose is provided for parity with the eventual deployment target, but hasn't been run
in this environment (no Docker install available while building this repo) - review the compose
file and Dockerfiles before relying on them, and file an issue if something doesn't build cleanly.

```sh
cd docker
cp .env.example .env      # adjust DB credentials / VITE_API_URL if needed
docker compose up -d --build
```

This starts `mysql`, `backend` (php-fpm), `nginx` (serving the Laravel app on
`http://localhost:8000`), and `frontend` (static build served on `http://localhost:5173`). Run
migrations/seeders once the containers are up:

```sh
docker compose exec backend php artisan migrate --seed
```

## CI/CD

`.github/workflows/`:

- `ci.yml` - runs the backend (PHPUnit) and frontend (build + Vitest) test suites on every push/PR.
- `deploy-frontend.yml` - deploys `frontend/` to Vercel on push to `main`.
- `deploy-backend.yml` - deploys `backend/` to the Hostinger VPS via SSH on push to `main`.

The deploy workflows need repo secrets that aren't set up yet - see the workflow files for the
exact names required. They'll simply fail until those secrets are added in GitHub repo Settings →
Secrets, which is expected.

## License

TBD
