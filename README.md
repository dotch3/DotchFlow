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

Runs Postgres + backend + frontend together in containers, with no
external services needed (no Neon/Render/Vercel account required). Works
identically with **Docker** or **Podman** — same `docker-compose.yml`, only
the command name changes (`docker compose` vs `podman compose` /
`podman-compose`).

**1. Set up the `.env` file** (used by `docker-compose.yml`, at the repo root — not `backend/.env` or `frontend/.env`):

```bash
cp .env.example .env
```

Open the generated `.env` and fill in `JWT_SECRET` with a real random value:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output as `JWT_SECRET=...` in `.env`. (`POSTGRES_PASSWORD` already
has a default and only needs changing if you want to.) **Never commit
`.env`** — it's already in `.gitignore`; only `.env.example` (the blank
template) should be tracked.

**2. Build and start all three containers:**

```bash
# Docker
docker compose up --build

# Podman
podman compose up --build
# or, if using standalone podman-compose:
podman-compose up --build
```

This builds `backend/Dockerfile` and `frontend/Dockerfile`, pulls
`postgres:16-alpine`, and starts all three services. The `backend`
container waits for `db`'s healthcheck before starting, so tables get
created automatically on first boot (no manual migration step). Leave this
running in its own terminal — it streams logs from all three services.

> **Podman on macOS gotcha:** if the build fails on `FROM nginx:alpine`
> with an auth error like `unable to retrieve auth token: invalid
> username/password`, Podman needs its own registry login (separate from
> `docker login`, even for a public image): run `podman login docker.io`
> with your Docker Hub credentials (or an access token if you have 2FA),
> then re-run the build.
>
> If port `5432` is already taken (e.g. you also have a local Postgres
> running natively for non-Docker dev), that's already handled —
> `docker-compose.yml` maps the container to host port `5433` instead, so
> there's no conflict either way.

**3. Seed test data** — open a **second terminal** (leave the first one
running) and run:

```bash
# Docker
docker compose exec backend npm run dev-seed

# Podman
podman compose exec backend npm run dev-seed
# or: podman-compose exec backend npm run dev-seed
```

This runs `reset-db.js` + `seed.js` *inside* the already-running `backend`
container, against the `db` container's Postgres. Test credentials after
seeding: `test@dotchflow.com` / `myPassword123`.

**4. Open the app:**

| What | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend health check | http://localhost:3001/health |
| Swagger / API docs | http://localhost:3001/api-docs |

**5. Shut it down** (back in the first terminal, or from anywhere):

```bash
docker compose down     # or: podman compose down
```

Add `-v` (`down -v`) to also delete the Postgres data volume
(`dotchflow_pgdata`) and start fresh next time.

**Why this differs from the plain `npm run dev` setup above:** it's fully
self-contained (its own Postgres container, no Neon/local Postgres install
needed) and matches how the app actually runs when containerized, at the
cost of a slower first build. Use whichever fits — `npm run dev` for fast
iteration, Docker/Podman for an isolated, reproducible environment (e.g. to
point a Playwright test suite at).

Full production deploy walkthrough (Neon + Render + Vercel, with exact env
var values) is in [`PROJECT.md`](PROJECT.md#31-deploy-em-produção-neon--render--vercel).

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
