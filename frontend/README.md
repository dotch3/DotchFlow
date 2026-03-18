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
```

## Running

```bash
npm run dev
```

App will be available at `http://localhost:5173`

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

The frontend expects the API to be running at `http://localhost:3001`. To change this, edit `src/api/client.js`:

```javascript
const api = axios.create({
  baseURL: 'http://your-server:3001', // change here
  // ...
});
```

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
