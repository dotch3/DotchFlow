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
- **SQLite** (sql.js)
- **JWT** for authentication

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=3001
JWT_SECRET=your_secret_key_here
```

## Running

```bash
npm run dev
```

API will be available at `http://localhost:3001`

## Database

### Reset Database

To reset the database (delete all data and start fresh):

```bash
# Stop the server first
# Then delete the database file:
rm -f data/dotchflow.db
```

The database will be automatically recreated on next server start.

### Seed Data

The following data is automatically created on first run:

**Store Items (Loja):**
| Item | Cost | Level |
|------|------|-------|
| 🌙 Tema Dark Premium | 100 coins | 1 |
| 🌅 Tema Sunset | 150 coins | 3 |
| 🔔 Notificações Inteligentes | 200 coins | 5 |
| 👑 Avatar Dourado | 300 coins | 7 |
| 💼 Modo Multi-Carteira | 500 coins | 10 |
| 📊 Relatório Anual Pdf | 250 coins | 5 |

User data (transactions, goals, etc.) is created when you register via the app.

## Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | User data |

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
