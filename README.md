# DotchFlow

![DotchFlow](dotchFlow.png)

Gamified personal finance tracker — turn financial control into a motivating experience with XP, levels, streaks, and a reward store.

> **Note:** This is a test/learning project built with the help of AI (Claude by Anthropic). The full prompts and specs used to generate this project are documented in [`PROJECT.md`](PROJECT.md).

## What it does

- **Dashboard** — balance overview, XP, streak, and charts
- **Transactions** — quick income/expense recording with categories
- **Financial Health** — analysis using the 50-15-35 rule (essentials / priorities / lifestyle)
- **Balance Forecast** — 30-day projection based on recurring transactions
- **Goals (Dreams)** — track financial objectives with monthly savings targets
- **Gamification** — daily check-ins, XP, levels, DotchCoins, and streaks
- **Store** — unlock themes and features with earned coins
- **Multi-language** — English, Spanish, Portuguese (BR)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React + Vite, Tailwind CSS, Recharts, Zustand, react-i18next |
| Backend | Node.js + Express, PostgreSQL, JWT |
| Docs | Swagger / OpenAPI at `/api-docs` |
| Deploy | Neon (DB) + Render (API) + Vercel (frontend), or local via Docker/Podman |

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env   # set JWT_SECRET and DATABASE_URL (local Postgres or Neon)
npm run dev            # http://localhost:<PORT from .env>
```

First-time setup with seed data:

```bash
npm run dev-seed
```

Test credentials after seed: `test@dotchflow.com` / `myPassword123`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_BACKEND_PORT to match backend/.env's PORT
npm run dev            # http://localhost:5173
```

All API routes are served under `/api` on the backend. In dev, the Vite
proxy forwards `/api/*` to the backend port above; in production, the
frontend calls `VITE_API_URL` (set at build time) directly — see
[`PROJECT.md`](PROJECT.md#31-deploy-em-produção-neon--render--vercel) for
the full deploy walkthrough.

### Local deploy (Docker / Podman) — everything at once

Postgres + backend + frontend, all in containers, no external services
needed:

```bash
cp .env.example .env   # set JWT_SECRET
docker compose up --build   # or: podman compose up --build
```

Full details (including seeding, ports, and how the pieces connect) in
[`PROJECT.md`](PROJECT.md#32-deploy-local-docker--podman).

## Testing

```bash
# Backend (Jest + Supertest)
cd backend && npm test

# Frontend (Vitest + Testing Library)
cd frontend && npm run test:run
```

## Project Structure

```
DotchFlow/
├── backend/        # REST API (Clean Architecture)
│   ├── src/
│   │   ├── domain/     # Entities & use cases
│   │   ├── infra/      # Repositories & database
│   │   └── ui/         # Controllers & routes
│   └── README.md   # Full API docs & endpoints
└── frontend/       # React SPA
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── store/
    │   └── i18n/
    └── README.md   # Frontend setup & structure
```

See [`backend/README.md`](backend/README.md) for full API reference and [`frontend/README.md`](frontend/README.md) for frontend details.
