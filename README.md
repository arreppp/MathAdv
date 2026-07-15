# MathAdventura Web Edition

A production-ready educational web game combining mathematics learning, RPG-style progression,
achievements, leaderboards, and teacher analytics for students aged 7-15.

## Status

This repo is under active initial build. See `docs/` (added in a later milestone) and the
project plan for current scope. The first milestone targets: auth, full DB schema, and one
complete playable vertical slice — register → login → play World 1 (Addition/Subtraction) in
Phaser → earn XP → see it on the dashboard. Every other module (teacher analytics, admin panel,
leaderboards, Worlds 2-4, etc.) is scaffolded but not fully implemented yet.

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

## Local Development

Setup instructions for both the Laragon-based local flow and Docker will be added once the
backend and frontend scaffolding lands (see the project plan).

## License

TBD
