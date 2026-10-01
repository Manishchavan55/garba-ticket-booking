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
├── frontend/         # React/Vite public website
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

## Phase 4 public website

The public React website currently provides:

```text
/
/events/:id
```

The public API currently provides:

```text
GET /api/events
GET /api/events/:id
GET /api/events/:eventId/ticket-categories
```

The public pages retrieve event and ticket-category data from the backend API. Event details, venue, guidelines, prices, and availability are not duplicated as frontend business data.

The booking call-to-action is intentionally disabled/placeholder-only. No customer information, booking, inventory reservation, payment, QR ticket, or confirmation flow exists yet.

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

## Phase 4 status

Implemented:

- Read-only public event API
- Public ticket-category API
- Public event and ticket service layer using parameterized MySQL queries
- Public React home page
- Public event detail route
- Reusable ticket-category component
- Loading, error, empty, and success states
- Responsive public-site styling
- Basic page titles and event meta descriptions
- Semantic headings, links, and accessible disabled booking placeholder
- API documentation for public endpoints

Intentionally not implemented in Phase 4:

- Booking creation
- Customer information collection
- Inventory reservation
- Payment gateway/verification
- QR generation/scanning/verification
- Admin authentication/authorization/dashboard
- Gallery management
- Sponsor management
- Inquiry management
- Reports/analytics
- Email/WhatsApp/Google Maps

These belong to later phases.
