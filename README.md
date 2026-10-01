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
├── database/         # Database architecture and migrations
├── docs/             # Architecture and API documentation
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

## Phase 3 API foundation

Current backend endpoints:

```text
GET /api/health
GET /api/health/ready
```

`/api/health` confirms that the application process is running and deliberately does not depend on MySQL.

`/api/health/ready` verifies that the configured MySQL dependency is reachable.

API responses use one consistent JSON convention:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

See `docs/api.md` for the current API contract and status-code conventions.

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

Seed development data only when appropriate:

```bash
npm run db:seed
```

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

## Phase 3 status

Implemented:

- Consistent API response and error conventions
- Centralized error classification/handling
- Reusable request validation infrastructure
- Async error propagation through `asyncHandler`
- Controlled CORS and Helmet security headers
- Configurable request body limit
- Safe structured backend logging
- Application health and database readiness endpoints
- Reusable MySQL transaction helper
- Backend API documentation
- Expanded backend tests for health, 404, malformed JSON, validation, and transaction behavior

Intentionally not implemented in Phase 3:

- Event management API
- Ticket management/inventory API
- Booking API/business rules
- Payment gateway/webhooks/verification
- QR generation/scanning/verification
- Admin authentication/authorization/dashboard
- Gallery/sponsor/inquiry APIs
- Reports/analytics
- Email/WhatsApp/Google Maps

These belong to later phases.
