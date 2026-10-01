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
├── backend/          # Node.js/Express API foundation
├── frontend/         # React/Vite application shell
├── database/         # Database setup notes; schema arrives in a later phase
├── docs/             # Architecture and project documentation
├── .env.example      # Non-secret environment reference
├── .gitignore
└── package.json      # Workspace scripts
```

## Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer
- MySQL 8.x for database connectivity checks

No MySQL database schema is required for Phase 1.

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

The Phase 1 API health endpoint intentionally does not claim database health. Database connectivity is checked separately with `npm run db:check` so an unavailable MySQL instance cannot be mistaken for a healthy database.

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

Database connectivity check:

```bash
npm run db:check
```

`db:check` requires valid backend database environment variables and a reachable MySQL server. It reports failure rather than fabricating success when MySQL is unavailable.

## Phase 1 status

Implemented:

- Monorepo foundation
- React/Vite application shell
- React routing foundation
- Frontend API client foundation
- Responsive/global CSS foundation
- Express API foundation
- `/api/health`
- Centralized error and 404 handling
- CORS and JSON middleware
- Environment configuration
- MySQL connection pool foundation
- Basic backend tests
- Frontend build/lint configuration
- Git hygiene and environment templates

Intentionally not implemented in Phase 1:

- Event management
- Ticket categories or ticket sales
- Booking
- Payment gateway
- QR generation or scanning
- Admin authentication or dashboard
- Gallery management
- Sponsor management
- Inquiry management
- Reports/analytics
- Email
- WhatsApp
- Google Maps

These belong to later phases.
