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

## Public flow through Phase 7

The public React website provides:

```text
/
/events/:id
/events/:id/book
```

The backend payment boundary remains provider-agnostic. When a real provider is selected, the trusted sequence is:

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
      ↓
TicketService
      ↓
QR tickets issued exactly once
```

The browser cannot mark a payment successful. QR ticket issuance is triggered by the trusted payment-success boundary, not by frontend state.

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

## Ticket and QR API

```text
POST /api/tickets/verify
```

Successful payment confirmation creates the persisted QR-ticket records according to the booking's stored `quantity`.

Examples:

```text
quantity = 1 -> 1 QR ticket
quantity = 3 -> 3 QR tickets
```

QR identifiers are server-generated cryptographically random opaque values. The QR payload contains only that identifier, not customer/payment data. The backend generates a PNG data URL for customer-facing ticket data using the QR identifier.

Ticket issuance is domain-idempotent: repeated payment verification or webhook processing reuses existing ticket records and does not create a second ticket batch.

QR verification is transactional and one-time-use:

```text
unused -> used
```

A second verification returns `409 QR_TICKET_ALREADY_USED`. Invalid or nonexistent identifiers are rejected. Admin authentication and camera/scanner UI are not part of Phase 7.

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

Phase 5 added `002_booking_idempotency.sql`. Phase 6 and Phase 7 do not add or modify database schema because the existing `payments` and `qr_tickets` tables already contain the required fields and constraints.

## Inventory limitation

The source requirements define ticket-category availability status but do not define numeric capacity/quota. Phase 5 therefore does not invent ticket quantities or claim finite inventory enforcement. Phase 7 uses the persisted booking quantity only for ticket cardinality and does not introduce inventory rules.

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

## Phase 7 status

Implemented:

- Dedicated transactional ticket issuance service
- Payment-success → confirmed booking → ticket issuance integration
- One-to-many ticket cardinality based on persisted booking quantity
- Server-side cryptographically random QR identifiers
- Existing `qr_tickets` schema and unique identifier constraint reused without migration
- Ticket issuance idempotency under repeated payment verification
- Server-side QR image generation from the opaque identifier
- Transactional one-time QR verification
- `POST /api/tickets/verify` API boundary
- Invalid/used/not-eligible QR rejection
- Backend ticket/QR automated tests
- Updated API and architecture documentation

Intentionally not implemented in Phase 7:

- Production payment gateway selection or credentials
- Customer authentication/access tokens
- Admin authentication/authorization
- Admin scanning UI/camera workflow
- Email/WhatsApp/SMS/push notifications
- Inventory/capacity rules
- Gallery/sponsors/inquiries/reporting
- Maps

These remain later-phase work.
