# DotchFlow Backend

REST API for DotchFlow - a gamified personal finance app that turns financial control into a fun and motivating experience.

> **Note:** This is a test/learning project built for practice purposes.

## Features

- **Expense Tracking** - Quick recording of income and expenses with categories
- **Financial Health** - Analysis using the 50-15-35 rule (essentials, priorities, lifestyle)
- **Balance Forecast** - 30-day projection based on recurring transactions
- **Gamification** - XP system, levels, coins, and daily streaks
- **Goals (Dreams)** - Organize your financial objectives
- **Store** - Unlock items with earned coins

## Tech Stack

- **Node.js** + **Express**
- **PostgreSQL** (works great with [Neon](https://neon.tech)'s free tier)
- **JWT** for authentication
- **Swagger / OpenAPI** docs served at `/api-docs`

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=3001
JWT_SECRET=your_secret_key_here
MAX_USERS=50
CLEANUP_INTERVAL_DAYS=30

# Postgres connection string. Works with Neon, Supabase, Render Postgres,
# or any Postgres instance. Neon's free tier is a good default (see
# "Deploy" section below for how to get one).
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

You need a real Postgres database even for local development — there's no
more local SQLite file. The easiest way to get one for free is Neon (see
the "Deploy to Render + Neon" section below); point `DATABASE_URL` at it
whether you're running the API locally or deployed.

## Running

```bash
npm run dev
```

API will be available at `http://localhost:3001`

## Testing

```bash
npm test
```

This runs Jest with Supertest for API route testing.

**Current test coverage:**
- Auth routes (login, register, language)
- Transactions routes (GET, POST, DELETE)

Tests use mocked database functions - no real database required.

## Database

Schema and tables are created automatically on server start (see
`src/infra/database/db.js`) — there's nothing to migrate manually, just
point `DATABASE_URL` at an empty Postgres database and run `npm run dev`.

### Local development database

Same commands, two ways to get the `DATABASE_URL`:

**Option A — Neon (no local install):**
1. Create a project + database at [neon.tech](https://neon.tech).
2. Copy the pooled connection string into `backend/.env` as `DATABASE_URL`
   (it already includes `?sslmode=require`).

**Option B — local Postgres:**
1. Install Postgres (e.g. `brew install postgresql@16` on macOS), or
   reuse one you already have running for another project.
2. Create an empty database, specifying the Postgres user explicitly —
   `createdb` alone defaults to your OS username, not the Postgres role,
   which fails with `password authentication failed for user "<your-os-user>"`:
   ```bash
   createdb -h localhost -U postgres dotchflow
   ```
   (replace `postgres` with whatever role you actually use — check an
   existing local project's connection string if unsure. It'll prompt for
   that role's password.)
3. In `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dotchflow
   DATABASE_SSL=false
   ```
   (`DATABASE_SSL=false` because local Postgres has no SSL — Neon does,
   and needs the default `true`.)

Either way, `npm run dev-seed` (schema + sample data) and `npm run dev`
work unchanged — they just follow whatever `DATABASE_URL` says.

**Keeping dev and production separate:** if you deploy to Render (see
below) using the same Neon database you develop against locally, the two
share data — anything you seed/reset locally also changes what's live.
Neon's free tier includes database branching (like a git branch, but for
data) if you want a separate `dev` branch from `production`; for a
practice project a single shared database is usually fine to start.

### Reset Database

```bash
npm run db:reset
```

Truncates every table and re-seeds the store catalog, using whatever
`DATABASE_URL` is set to — local Postgres or Neon, same command either
way, no `psql`/`createdb` needed. This is also what `npm run dev-seed`
runs first, so `dev-seed` always starts from a clean slate regardless of
what was in the database before.

(There's also `POST /admin/reset` in Swagger, which does the same thing
over HTTP against a running server, if you'd rather trigger it through the
API than the CLI - useful for a Playwright test that needs to reset state
between runs.)

### Seed Data

The following store items are automatically created on first run:

**Store Items:**
| Item | Cost | Level |
|------|------|-------|
| 🌙 Dark Theme Premium | 100 coins | 1 |
| 🌅 Sunset Theme | 150 coins | 3 |
| 🔔 Smart Notifications | 200 coins | 5 |
| 👑 Golden Avatar | 300 coins | 7 |
| 💼 Multi-Wallet Mode | 500 coins | 10 |
| 📊 Annual PDF Report | 250 coins | 5 |

User data (transactions, goals, etc.) is created when you register via the app.

### Quick Start with Seed Data

For first-time setup or testing, use:

```bash
npm run dev-seed
```

This connects to whatever `DATABASE_URL` points at (local Postgres or
Neon — see "Local development database" below), creates the schema if
it's not there yet, and inserts the test user + sample data. Safe to
re-run any time: it wipes the test user's own data first, so it never
duplicates.

**That's it!** Start the app with `npm run dev` and log in with the test
credentials.

---

### Manual Seed (if database already exists)

If you already have a database and just want to add test data:

```bash
# Make sure server is NOT running
# Then run seed:
npm run seed
```

**Re-running seed:** if `test@dotchflow.com` already exists, `npm run seed`
wipes that user's data and recreates it — safe to run as many times as you
want.

---

### Test User Credentials

After running seed, login with:

| Field | Value |
|-------|-------|
| Email | `test@dotchflow.com` |
| Password | `myPassword123` |
| XP Points | 1250 |
| Level | 3 |
| Coins | 250 |
| Streak | 5 days |

**Includes:** 9 categories, 16 transactions (last 30 days), 3 goals, and 2 unlocked store items.

## Language / Internationalization

Error messages, validation messages, and the store catalog are translated
into English, Spanish, and Brazilian Portuguese (`en` / `es` / `pt-BR`).
The language used for a given response is picked in this order:

1. **Logged in** — the language saved on the account, set via
   `PUT /auth/language`.
2. **Not logged in** — the `Accept-Language` request header. Browsers send
   this automatically on every request, which is why testing through
   Swagger UI (or any browser-based client) can return responses in
   *your* browser's language even though you never explicitly chose one
   for that request — this is standard HTTP content negotiation, not the
   app reading anything unusual about you.
3. **Neither present** — falls back to English.

**For scripts and automated tests:** don't rely on step 2's fallback —
it makes responses depend on whatever machine happens to run the test.
Set `Accept-Language: en` explicitly for deterministic assertions, and
treat language switching itself as its own test scenario (send
`Accept-Language: pt-BR`, assert the translated string) rather than an
incidental side effect.

Translation source: `src/i18n/locales/{en,es,pt-BR}.json`. The lookup
logic is in `src/i18n/index.js` (`getRequestLanguage`, `t`).

## Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | User data |
| PUT | `/auth/language` | Update language preference |

### Gamification
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/gamification/checkin` | Daily check-in |
| GET | `/gamification/status` | XP, level, streak status |

### Finance
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/finance/health` | Financial health (50-15-35 rule) |
| GET | `/finance/forecast` | 30-day projection |

### Transactions
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/transactions` | List (filters: category, type, date) |
| POST | `/transactions` | Create |
| PUT | `/transactions/:id` | Update |
| DELETE | `/transactions/:id` | Delete |

### Goals
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/goals` | List goals |
| POST | `/goals` | Create goal |
| POST | `/goals/:id/deposit` | Deposit |
| DELETE | `/goals/:id` | Delete |

### Store
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/store` | List items |
| POST | `/store/unlock` | Unlock item |

### Categories
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/categories` | List |
| POST | `/categories` | Create |
| PUT | `/categories/:id` | Update |
| DELETE | `/categories/:id` | Delete |

---

## API Usage Examples

> **Base URL:** `http://localhost:3001`
> 
> Most endpoints require a JWT token. After login, include the token in the `Authorization` header:
> ```
> Authorization: Bearer <your_jwt_token>
> ```

### 1. Authentication

#### Register a new user
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "myPassword123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "level": 1,
    "xp": 0,
    "coins": 100,
    "streak": 0
  }
}
```

#### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "myPassword123"
  }'
```

#### Get current user
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### 2. Transactions

#### List all transactions (with filters)
```bash
# All transactions
curl -X GET http://localhost:3001/transactions \
  -H "Authorization: Bearer <your_jwt_token>"

# Filter by type (income/expense)
curl -X GET "http://localhost:3001/transactions?type=expense" \
  -H "Authorization: Bearer <your_jwt_token>"

# Filter by category
curl -X GET "http://localhost:3001/transactions?categoryId=1" \
  -H "Authorization: Bearer <your_jwt_token>"

# Filter by date range
curl -X GET "http://localhost:3001/transactions?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "description": "Grocery shopping",
      "amount": 150.00,
      "type": "expense",
      "categoryId": 1,
      "category": "Food",
      "date": "2024-01-15",
      "recurring": false
    }
  ]
}
```

#### Create a transaction
```bash
curl -X POST http://localhost:3001/transactions \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Salary",
    "amount": 5000,
    "type": "income",
    "categoryId": 8,
    "date": "2024-01-15",
    "recurring": true,
    "recurringType": "monthly"
  }'
```

#### Update a transaction
```bash
curl -X PUT http://localhost:3001/transactions/1 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated grocery shopping",
    "amount": 175.00
  }'
```

#### Delete a transaction
```bash
curl -X DELETE http://localhost:3001/transactions/1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### 3. Categories

#### List all categories
```bash
curl -X GET http://localhost:3001/categories \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "categories": [
    { "id": 1, "name": "Food", "icon": "🍔", "type": "expense" },
    { "id": 2, "name": "Transport", "icon": "🚗", "type": "expense" },
    { "id": 8, "name": "Salary", "icon": "💰", "type": "income" }
  ]
}
```

#### Create a category
```bash
curl -X POST http://localhost:3001/categories \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entertainment",
    "icon": "🎬",
    "type": "expense"
  }'
```

---

### 4. Goals (Dreams)

#### List all goals
```bash
curl -X GET http://localhost:3001/goals \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "goals": [
    {
      "id": 1,
      "name": "Emergency Fund",
      "targetAmount": 10000,
      "currentAmount": 2500,
      "deadline": "2024-12-31",
      "completed": false
    }
  ]
}
```

#### Create a goal
```bash
curl -X POST http://localhost:3001/goals \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vacation to Japan",
    "targetAmount": 15000,
    "deadline": "2025-06-01"
  }'
```

#### Deposit towards a goal
```bash
curl -X POST http://localhost:3001/goals/1/deposit \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500
  }'
```

#### Delete a goal
```bash
curl -X DELETE http://localhost:3001/goals/1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### 5. Finance (Health & Forecast)

#### Get financial health (50-15-35 rule)
```bash
curl -X GET http://localhost:3001/finance/health \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "health": {
    "score": 85,
    "status": "excellent",
    "breakdown": {
      "essentials": { "percentage": 45, "rule": 50, "status": "good" },
      "priorities": { "percentage": 20, "rule": 15, "status": "warning" },
      "lifestyle": { "percentage": 35, "rule": 35, "status": "excellent" }
    },
    "recommendations": [
      "Consider reducing lifestyle spending by 5%"
    ]
  }
}
```

#### Get 30-day forecast
```bash
curl -X GET http://localhost:3001/finance/forecast \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "forecast": {
    "currentBalance": 8500,
    "projectedEndBalance": 12300,
    "dailyAverage": {
      "income": 500,
      "expense": 280
    },
    "projectedTransactions": [
      { "date": "2024-02-01", "description": "Salary", "amount": 5000, "type": "income" },
      { "date": "2024-02-05", "description": "Rent", "amount": 1500, "type": "expense" }
    ]
  }
}
```

---

### 6. Gamification

#### Daily check-in (earn XP & coins)
```bash
curl -X POST http://localhost:3001/gamification/checkin \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "checkin": {
    "success": true,
    "streak": 5,
    "xp": 50,
    "coins": 25,
    "message": "5-day streak! Keep it up!"
  }
}
```

#### Get XP, level, and streak status
```bash
curl -X GET http://localhost:3001/gamification/status \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "status": {
    "level": 5,
    "xp": 1250,
    "nextLevelXp": 1500,
    "coins": 450,
    "streak": 5,
    "streakBonus": 25,
    "dailyCheckinAvailable": true
  }
}
```

---

### 7. Store

#### List all store items
```bash
curl -X GET http://localhost:3001/store \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Dark Premium Theme",
      "description": "Beautiful dark mode for the app",
      "cost": 100,
      "levelRequired": 1,
      "unlocked": false
    },
    {
      "id": 2,
      "name": "Golden Avatar",
      "description": "Stand out with a golden avatar frame",
      "cost": 300,
      "levelRequired": 7,
      "unlocked": true
    }
  ]
}
```

#### Unlock a store item
```bash
curl -X POST http://localhost:3001/store/unlock \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Dark Premium Theme unlocked!",
  "newBalance": 350
}
```

---

## Interactive Documentation

Full interactive API documentation is available at `/api-docs`:

- Local: http://localhost:3001/api-docs
- Production (Render): `<your-render-url>/api-docs` — the production
  server is added to the Swagger "servers" dropdown automatically at
  runtime, no need to edit `openapi.yaml` per deploy.

This provides:
- Visual interface to test all endpoints
- Request/response examples
- Schema documentation

Raw OpenAPI spec (for importing into Postman, Insomnia, or a Playwright/
codegen tool): `/api-docs.json`.

---

## Deploy to Render + Neon

This gives you a public, always-reachable URL for the API — useful as a
target for API testing tools like Playwright, Postman, etc.

### 1. Create the database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (free tier: data is kept
   indefinitely, compute just suspends after 5 min idle and wakes on the
   next query — no time limit like Railway's trial).
2. Create a project, then a database inside it.
3. Copy the **pooled connection string** (Dashboard → Connect → "Pooled
   connection"). It looks like:
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`

### 2. Deploy the API (Render)

Option A — Blueprint (uses the `render.yaml` at the repo root):
1. On [render.com](https://render.com), **New → Blueprint**, point it at
   this repo.
2. Render detects `render.yaml` and creates the `dotchflow-api` web
   service with `rootDir: backend` already configured.
3. Fill in the two secret env vars it asks for: `JWT_SECRET` (any long
   random string) and `DATABASE_URL` (the Neon connection string from
   step 1).

Option B — Manual:
1. **New → Web Service**, point it at this repo.
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add env vars: `JWT_SECRET`, `DATABASE_URL`, `MAX_USERS=50`,
   `CLEANUP_INTERVAL_DAYS=30`.

### 3. Seed data on the deployed API

Either call `POST /admin/seed` (see Swagger) against the live URL, or run
`DATABASE_URL=<neon-url> npm run seed` locally — it connects straight to
Neon, no need to be inside the deployed container.

### What to expect

Render's free tier spins the service down after 15 min without traffic
and takes about a minute to wake back up on the next request — plan for
that in test timeouts (e.g. a warm-up request in `beforeAll`). Data isn't
lost between spin-downs since it now lives in Neon, not on Render's disk.

---

## Local Deploy (Docker / Podman)

For running the whole app (Postgres + this API + the frontend) locally in
containers, with no Neon/Render/Vercel account needed:

```bash
# from the repo root, not backend/
cp .env.example .env    # fill in JWT_SECRET
docker compose up --build     # or: podman compose up --build
```

Then, in a second terminal, seed test data inside the running container:

```bash
docker compose exec backend npm run dev-seed
```

The API is then reachable at `http://localhost:3001` (Swagger at
`/api-docs`), backed by its own Postgres container - not related to the
Neon/local-Postgres setup described above. Full walkthrough (env vars,
troubleshooting Podman's registry login on macOS, tearing down) is in the
root [`README.md`](../README.md#local-deploy-docker--podman---everything-at-once).

---

## Error Responses

All endpoints may return error responses:

| Status | Meaning |
|--------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

**Example error response:**
```json
{
  "error": "Category not found"
}
```
