# DotchFlow Frontend

Frontend for DotchFlow - a gamified interface for personal finance control.

> **Note:** This is a test/learning project built for practice purposes.

## Features

- **Dashboard** - Overview with balance, XP, streak, and charts
- **Transactions** - Expense list with filters and search
- **Goals** - Track your financial objectives
- **Store** - Unlock items with your coins
- **Profile** - Statistics and achievements
- **Multi-language** - English, Spanish, Portuguese (BR) support

## Tech Stack

- **React** + **Vite**
- **Tailwind CSS**
- **Recharts** for charts
- **Zustand** for global state
- **Axios** for API
- **react-i18next** for internationalization

## Installation

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_BACKEND_PORT to match backend/.env's PORT
```

## Running

```bash
npm run dev
```

App will be available at `http://localhost:5173`. In dev, API calls to
`/api/*` are proxied by Vite to the backend port set in `.env`
(`VITE_BACKEND_PORT`, default 3001) — see `vite.config.js`.

## Testing

```bash
npm run test:run
```

This runs Vitest with Testing Library.

**Current test coverage:**
- LanguageSelector component (UI interactions)
- authStore (state management with persistence)

To run tests in watch mode:

```bash
npm run test
```

## Production Build

To create a production build:

```bash
npm run build
```

The build output will be in the `dist/` folder. You can preview it locally:

```bash
npm run preview
```

## Configuration

API base URL is controlled by environment variables (see `.env.example`),
not hardcoded in the source:

- **Dev** (`npm run dev`): calls go to `/api/*`, proxied by Vite to
  `http://localhost:<VITE_BACKEND_PORT>` (see `vite.config.js`). Set
  `VITE_BACKEND_PORT` in `.env` to match whatever port your local backend
  actually runs on (`backend/.env`'s `PORT`).
- **Production build** (`npm run build`, e.g. deployed to Vercel):
  `VITE_API_URL` is baked into the bundle at build time and used as the
  API base URL directly — no proxy involved. It must include `/api` at the
  end, e.g. `VITE_API_URL=https://dotchflow-api.onrender.com/api`. Set it
  as an environment variable in the Vercel project settings (marked as
  public/"Config", not "Secret" — it needs to be readable in the browser
  bundle to work at all).

Both are read in `src/api/client.js`:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // ...
});
```

## Deploy

- **Vercel** (production): see [`PROJECT.md`](../PROJECT.md#31-deploy-em-produção-neon--render--vercel)
  at the repo root for the full Neon → Render → Vercel walkthrough,
  including exact env var values.
- **Docker / Podman** (local, everything containerized together with the
  backend and a Postgres container): see the root
  [`README.md`](../README.md#local-deploy-docker--podman---everything-at-once).

## Structure

```
src/
├── api/          # API client
├── components/   # Reusable components
├── pages/        # App pages
├── store/        # Global state (Zustand)
├── i18n/         # Internationalization (locales)
└── index.css    # Global styles
```
