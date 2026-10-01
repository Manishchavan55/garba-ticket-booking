# KESARIYA Dandiya Nights

Production-oriented event management and ticket-booking platform foundation.

## Architecture

```text
React frontend
      |
      v
Node.js + Express API
      |
      v
MySQL
```

The repository is a monorepo with independently owned frontend, backend, database, and documentation responsibilities.

## Repository structure

```text
.
├── backend/          # Node.js/Express API and database layer
├── frontend/         # React/Vite application shell
├── database/         # Database architecture documentation
├── docs/             # Architecture and project documentation
├── .env.example      # Non-secret environment reference
├── .gitignore
└── package.json      # Workspace scripts
```

## Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer
- MySQL 8.x

## Installation

From the repository root:

```bash
npm install
```

This installs workspace dependencies for both applications.

## Environment setup

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

PowerShell equivalents:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Never commit `.env` files or real credentials.

## Run the backend

```bash
npm --workspace backend run dev
```

The API listens on `http://localhost:8080` by default.

## Run the frontend

```bash
npm --workspace frontend run dev
```

Vite serves the application on its configured local development port, normally `http://localhost:5173`.

## Health endpoint

```text
GET http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "kesariya-api"
}
```

The API health endpoint intentionally does not claim database health. Database connectivity is checked separately with `npm run db:check`.

## Phase 2 database setup

Create an empty MySQL database using your MySQL administration tooling, then configure `backend/.env`:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kesariya_dandiya
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
```

Run the migration process:

```bash
npm run db:migrate
```

Validate required tables, foreign keys, and unique constraints:

```bash
npm run db:validate
```

Check basic connectivity:

```bash
npm run db:check
```

The migration process is implemented in `backend/src/database/migrate.js` and reads ordered SQL files from `backend/src/database/migrations/`. Applied migration filenames are tracked in `schema_migrations`.

No development seed data is included because the specification does not define particular fictional event or ticket values and no business assumptions are necessary for the database foundation.

## Testing and validation

Backend tests:

```bash
npm --workspace backend test
```

Backend lint:

```bash
npm --workspace backend run lint
```

Frontend lint:

```bash
npm --workspace frontend run lint
```

Frontend production build:

```bash
npm --workspace frontend run build
```

Database validation:

```bash
npm run db:validate
```

## Phase 2 status

Implemented:

- MySQL 8.x-compatible schema
- `events`
- `ticket_categories`
- `bookings`
- `payments`
- `qr_tickets`
- `gallery`
- `sponsors`
- `inquiries`
- `admin_users`
- Foreign-key relationships
- Monetary precision and database constraints
- Booking/payment/QR uniqueness protections
- Lightweight ordered SQL migrations
- Migration tracking through `schema_migrations`
- Schema validation command
- Database architecture documentation

Intentionally not implemented in Phase 2:

- Event management UI/API
- Ticket selection or booking UI/API
- Booking service/business rules
- Payment gateway or callbacks/webhooks
- QR generation, scanning, or verification API
- Admin authentication or dashboard
- Gallery/sponsor/inquiry UI
- Email or WhatsApp
- Google Maps
- Reports/analytics

These belong to later phases.
