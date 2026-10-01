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

## Phase 6 public payment flow

The public React website provides:

```text
/
/events/:id
/events/:id/book
```

After a booking is created, the booking page exposes a payment-initiation state. The browser may be redirected to a configured provider checkout when one exists.

The backend remains authoritative:

```text
Booking created
      ↓
Payment pending
      ↓
Provider checkout
      ↓
Trusted backend verification
      ↓
Payment successful
      ↓
Booking confirmed
```

The browser cannot mark a payment successful. QR/ticket issuance begins only in a later phase.

## Payment provider status

**No production payment provider is configured yet.**

`backend/.env.example` therefore uses:

```text
PAYMENT_PROVIDER=unconfigured
```

The backend contains a provider abstraction and an isolated fail-closed `unconfigured` provider. It is not a mock payment gateway and does not create fake successful payments.

When a real provider is selected, its implementation must provide checkout creation, payment verification, webhook authenticity verification, and normalized payment status without leaking credentials into React.

Do not add production credentials until the provider has been selected and its integration requirements have been documented.

## Payment API

```text
POST /api/bookings/:bookingId/payment
POST /api/payments/verify
POST /api/payments/webhook
```

Payment initiation requires an `Idempotency-Key` header. The backend obtains amount and currency from the booking in MySQL.

Payment confirmation uses the existing `payments` table and transaction infrastructure. Amount/currency mismatches are rejected, duplicate provider references are rejected, and repeated successful verification is idempotent.

Provider-specific webhook signatures and credentials remain intentionally unimplemented until provider selection.

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

Phase 5 added `002_booking_idempotency.sql`. Phase 6 does not add a payment table or modify the existing payment schema.

## Inventory limitation

The source requirements define ticket-category availability status but do not define numeric capacity/quota. Phase 5 therefore does not invent ticket quantities or claim finite inventory enforcement. Payment does not introduce an inventory system.

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

## Phase 6 status

Implemented:

- Provider-agnostic payment-provider interface boundary
- Fail-closed unconfigured provider
- Payment initiation endpoint
- Payment verification endpoint boundary
- Generic webhook architecture boundary
- Existing `payments` table integration
- Authoritative booking amount/currency verification
- Payment/booking state separation
- Transactional successful-payment transition
- Payment idempotency and provider-reference uniqueness handling
- Duplicate verification handling
- Payment failure handling without booking confirmation
- React payment initiation state
- Provider checkout redirect support when a real provider is configured
- Backend payment tests with an isolated test provider
- Payment API documentation

Intentionally not implemented in Phase 6:

- Production payment gateway selection
- Production payment credentials
- Provider-specific checkout SDK
- Provider-specific webhook signature verification
- Fake production payment success
- QR generation/scanning/verification
- Ticket issuance
- Email/WhatsApp/SMS/push notifications
- Admin authentication/authorization/dashboard
- Inventory/capacity invention

These remain later-phase work.
