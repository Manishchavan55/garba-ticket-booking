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

## Phase 5 public booking flow

The public React website now provides:

```text
/
/events/:id
/events/:id/book
```

The public API currently provides:

```text
GET /api/events
GET /api/events/:id
GET /api/events/:eventId/ticket-categories
POST /api/bookings
```

The booking flow collects ticket category, quantity, customer name, email, and phone. The backend loads the ticket price from MySQL and creates the booking in the existing `pending` pre-payment state.

Creating a booking does **not** mean payment succeeded, a ticket was issued, or a QR code was generated. Payment, QR, authentication, notifications, and admin features remain later phases.

## Phase 2/5 database setup

Create an empty MySQL database using your MySQL administration tooling, then configure `backend/.env`:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kesariya_dandiya
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
```

Run migrations:

```bash
npm run db:migrate
```

Validate the schema:

```bash
npm run db:validate
```

Check connectivity:

```bash
npm run db:check
```

Seed development data only when appropriate:

```bash
npm run db:seed
```

Phase 5 adds `002_booking_idempotency.sql`, which adds a unique nullable idempotency key to bookings. Existing migrations must not be edited after being applied.

## Inventory limitation

The source requirements define ticket-category availability status but do not define numeric capacity/quota. Phase 5 therefore does not invent ticket quantities or claim finite inventory enforcement. The booking transaction locks the selected category while checking its current availability status and creating the booking.

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

## Phase 5 status

Implemented:

- Transactional public booking creation API
- Backend customer-data validation
- Database-authoritative ticket price calculation
- Decimal-safe integer-cents price calculation
- Ticket-category availability-status enforcement
- Server-generated unique booking IDs
- Booking idempotency via `Idempotency-Key`
- Existing MySQL transaction helper integration
- Public booking route `/events/:id/book`
- Customer booking form and client-side validation
- Loading, validation, API-error, and booking-created states
- Explicit payment-pending messaging
- Booking API documentation and inventory limitation
- Backend booking and transaction tests

Intentionally not implemented in Phase 5:

- Numeric inventory/capacity enforcement
- Payment gateway/checkout/webhooks/verification
- Paid status transitions
- QR generation/scanning/verification
- Customer booking retrieval endpoint
- Admin authentication/authorization/dashboard
- Gallery management
- Sponsor management
- Inquiry management
- Reports/analytics
- Email/WhatsApp/Google Maps

These belong to later phases.
