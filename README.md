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
- **Backend**: Supabase - Postgres, Auth, and Postgres RPC functions (`supabase/migrations/`) for every
  piece of server-side logic (adaptive question selection, answer grading, XP/leveling, teacher
  analytics). No separate application server - the frontend talks to Supabase directly via
  `@supabase/supabase-js`.
- **Auth**: Supabase Auth (JWT), with Postgres row-level security replacing role-based route middleware
- **Deployment**: Vercel (frontend), Supabase (hosted Postgres + Auth)

> The original Laravel 11 / MySQL backend still lives in `backend/` for reference and is not
> currently wired to the frontend. It's kept until the Supabase migration has run in production for
> a while, then will be removed along with `deploy-backend.yml`.

## Repo Layout

```
MathAdv/
├── backend/     Laravel 11 API (deprecated - see Tech Stack above)
├── frontend/    React 19 + TS + Vite + Tailwind + Phaser 3 (talks to Supabase directly)
├── supabase/    Postgres schema, RLS policies, RPC functions, seed data
└── .github/     CI/CD workflows
```

## What's implemented

| Module | Status |
| --- | --- |
| Auth (register/login/logout, roles, username-only - no email) | Done |
| DB schema (all 14 spec modules + pivots) | Done |
| World 1 gameplay (Phaser + adaptive questions + XP) | Done |
| Student dashboard (XP/level/activity) | Done |
| Leaderboard, Achievements/Badges | Done (real data, simple UI) |
| Teacher dashboard, class management, admin panel | Scaffolded only (placeholder UI) |
| Worlds 2-4 (Multiplication/Division/Fractions) | Schema ready, no seeded levels/scenes yet |
| Matching / Drag-and-drop question types | Schema ready, no playable UI yet |
| CI/CD | Done (see below) |

## Local Development

**Supabase (database + auth + backend logic)**

Requires the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
and Docker.

```sh
cd supabase
supabase start      # spins up Postgres, Auth (GoTrue), PostgREST, Studio, etc. via Docker
```

`supabase start` automatically applies every migration in `supabase/migrations/` and then
`supabase/seed.sql`, which seeds roles, question categories, World 1 game levels + questions, badges,
and an admin user (username `MathAdventura Admin` / password `password`). It prints the local API
URL and anon key on startup - use those for the frontend's `.env` below. Studio is at
http://localhost:54323 if you want to browse the data.

To apply migrations to an already-running local instance after editing SQL, without a full reset:
`supabase db reset` (drops and rebuilds from migrations + seed).

**Frontend**

```sh
cd frontend
npm install
cp .env.example .env      # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from `supabase start`'s output
npm run dev                # http://localhost:5173
```

**Tests**

```sh
cd frontend && npm run test
```

The `supabase/` SQL itself is exercised by `supabase/tests/smoke_test.sql` (also run in CI - see
below), which checks the auth-provisioning trigger, RLS policies, and the core game-loop RPC
end to end against a real Postgres instance.

## CI/CD

`.github/workflows/`:

- `ci.yml` - runs the frontend (lint + Vitest + build) test suite, applies every
  `supabase/migrations/*.sql` + `supabase/seed.sql` to a throwaway Postgres service container and
  runs `supabase/tests/smoke_test.sql` against it, and (until it's removed) still runs the legacy
  Laravel backend's PHPUnit suite - on every push/PR.
- `deploy-frontend.yml` - deploys `frontend/` to Vercel on push to `main`.
- `deploy-supabase.yml` - pushes `supabase/migrations/` to the linked Supabase project on push to
  `main` (via `supabase db push`). Seeding (`supabase/seed.sql`) is *not* run automatically on
  deploy - it's a one-time/manual step, since re-running it would regenerate World 1's practice
  questions with new random values on every push.
- `deploy-backend.yml` - deploys the legacy `backend/` Laravel app to the Hostinger VPS via SSH on
  push to `main`. Kept only until the Supabase migration is confirmed working in production.

The deploy workflows need repo secrets that aren't set up yet (GitHub repo Settings → Secrets and
variables → Actions) - they'll simply fail until these are added, which is expected:

- **`deploy-frontend.yml`**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (and the Vercel
  project itself needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` set in its dashboard)
- **`deploy-supabase.yml`**: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`
- **`deploy-backend.yml`**: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (private key with access to the
  VPS), `VPS_DEPLOY_PATH` (absolute path to the app on the VPS)

## License

TBD
