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
MAX_USERS=50
CLEANUP_INTERVAL_DAYS=30
```

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

For first-time setup or testing, use the combined command:

```bash
npm run dev-seed
```

This will:
1. Delete existing database (if any)
2. Start the server (creates fresh database with schema)
3. Run the seed script automatically
4. Stop the server

**That's it!** You can then start the app with `npm run dev` and login with the test credentials.

---

### Manual Seed (if database already exists)

If you already have a database and just want to add test data:

```bash
# Make sure server is NOT running
# Then run seed:
npm run seed
```

**⚠️ Error if user exists:** If `test@dotchflow.com` already exists, you'll see an error. To re-seed, first delete the database:

```bash
rm -f data/dotchflow.db
npm run seed
```

---

### Test User Credentials

After running seed, login with:

| Field | Value |
|-------|-------|
| Email | `test@dotchflow.com` |
| Password | `myPassword123` |
| XP Points | 500 |
| Level | 3 |
| Coins | 250 |
| Streak | 5 days |

**Includes:** 9 categories, 16 transactions (last 30 days), 3 goals, and 2 unlocked store items.

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

Full interactive API documentation is available at:

**Swagger UI:** http://localhost:3001/api-docs

This provides:
- Visual interface to test all endpoints
- Request/response examples
- Schema documentation

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
