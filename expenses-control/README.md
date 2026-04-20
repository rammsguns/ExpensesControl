# ExpensesControl — Expense Splitting MVP

A self-hosted, open source expense tracker for splitting bills with friends, partners, or roommates.

## Features

- ✅ User authentication (JWT)
- ✅ Group management (create, invite by email)
- ✅ Expense splitting (equal, percentage, exact amounts, shares)
- ✅ Balance tracking per group and across all groups
- ✅ Debt simplification (minimize number of payments)
- ✅ Settlement recording
- ✅ Multi-language (English/Spanish)
- ✅ Mobile-first responsive design

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (via Knex.js)
- **Auth:** JWT

## Setup

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Start both (from root)
npm run dev
```

Server runs on http://localhost:3001, client on http://localhost:5173.

### Individual services

```bash
# Server only
npm run dev:server

# Client only
npm run dev:client
```

### Demo Data

The server auto-seeds demo data on first run:
- **Users:** alice@example.com, bob@example.com, carlos@example.com (password: `demo123`)
- **Group:** "Trip to Cancún" with sample expenses

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/groups | List user's groups |
| POST | /api/groups | Create group |
| GET | /api/groups/:id | Group details + members |
| POST | /api/groups/:id/members | Add member by email |
| POST | /api/expenses | Add expense |
| GET | /api/expenses/group/:groupId | List group expenses |
| GET | /api/balances/group/:groupId | Group balances |
| GET | /api/balances | Total balances |
| GET | /api/settlements/group/:groupId/plan | Simplified debt plan |
| POST | /api/settlements | Record settlement |

## Roadmap

- [ ] Receipt scanning
- [ ] Currency conversion
- [ ] Charts & spending analytics
- [ ] Recurring expenses
- [ ] PWA / Android wrapper (Capacitor)
- [ ] Push notifications