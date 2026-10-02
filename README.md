# KESARIYA Dandiya Nights

Production-oriented event management and ticket-booking platform.

## Architecture

```text
React frontend
      |
      v
Node.js + Express API
      |
      v
MySQL 8.x
```

The repository is a monorepo with separate frontend, backend, database, and documentation responsibilities.

## Current implementation

Implemented workstreams include:

- public event and ticket-category APIs/pages
- public booking creation
- PhonePe Standard Checkout payment integration
- server-side payment verification and authenticated webhooks
- idempotent payment processing
- payment → booking confirmation → QR-ticket issuance lifecycle
- one-time QR verification
- server-side opaque admin sessions
- admin event and ticket-category management
- admin booking management
- admin payment/transaction viewing
- admin QR/venue operations
- public/admin gallery management
- public/admin sponsor management
- public/admin Contact / Inquiry management

The source requirements do not define an FAQ schema/workflow, so FAQ functionality is not included.

The source mentions email, WhatsApp, Google Maps, and reports as later functionality but does not provide sufficient implementation detail for those integrations. They are therefore not implemented in this repository.

## Repository structure

```text
.
├── backend/          # Node.js/Express API, services, validation and DB layer
├── frontend/         # React/Vite public website and admin UI
├── database/         # MySQL migrations and seed tooling
├── docs/             # Architecture, API and workstream documentation
├── .env.example
├── .gitignore
└── package.json
```

## Prerequisites

- Node.js 20 LTS or newer
- npm 10 or newer
- MySQL 8.x

## Installation

```bash
npm install
```

## Environment

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env
```

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Never commit `.env` files or real credentials.

### Backend secrets

Database credentials, PhonePe credentials, webhook credentials, and admin bootstrap credentials are backend-only environment variables. They must never be placed in React/Vite environment variables.

### PhonePe

The production provider selected for this implementation is PhonePe Standard Checkout. Configure:

```text
PAYMENT_PROVIDER=phonepe
PHONEPE_ENVIRONMENT=SANDBOX
PHONEPE_CLIENT_ID=...
PHONEPE_CLIENT_SECRET=...
PHONEPE_CLIENT_VERSION=1
PHONEPE_REDIRECT_URL=...
PHONEPE_WEBHOOK_USERNAME=...
PHONEPE_WEBHOOK_PASSWORD=...
```

Use `SANDBOX` for UAT and switch to `PRODUCTION` only after the PhonePe merchant account and go-live configuration are complete.

## Run locally

Backend:

```bash
npm --workspace backend run dev
```

Default API:

```text
http://localhost:8080
```

Frontend:

```bash
npm --workspace frontend run dev
```

Default Vite URL:

```text
http://localhost:5173
```

## Database

Configure `backend/.env`:

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

Check MySQL connectivity:

```bash
npm run db:check
```

Seed development data only when required:

```bash
npm run db:seed
```

Current migrations:

```text
001_initial_schema.sql
002_booking_idempotency.sql
003_admin_auth_sessions.sql
```

Migrations are append-only; already-applied migrations must not be edited.

## Public API

```text
GET  /api/health
GET  /api/health/ready
GET  /api/events
GET  /api/events/:id
GET  /api/events/:eventId/ticket-categories
POST /api/bookings
POST /api/bookings/:bookingId/payment
POST /api/payments/verify
POST /api/payments/webhook
POST /api/tickets/verify
POST /api/inquiries
GET  /api/gallery
GET  /api/sponsors
```

## Admin API

All business-admin endpoints require the existing server-side session authentication and authorization middleware:

```text
authenticateAdmin
      ↓
authorizeAdmin()
      ↓
controller/service
```

Authentication:

```text
POST /api/admin/auth/login
GET  /api/admin/auth/me
POST /api/admin/auth/logout
```

Business modules:

```text
GET/POST/PATCH/DELETE /api/admin/events...
GET/POST/PATCH/DELETE /api/admin/ticket-categories...
GET /api/admin/bookings...
GET /api/admin/payments...
GET /api/admin/qr-tickets...
POST /api/admin/qr-tickets/verify
GET/POST/PATCH/DELETE /api/admin/gallery...
GET/POST/PATCH/DELETE /api/admin/sponsors...
GET/PATCH/DELETE /api/admin/inquiries...
```

See `docs/api.md` and the individual workstream documentation for the detailed contracts.

## Payment lifecycle

The browser never declares payment success.

```text
Booking created
      ↓
pending payment
      ↓
PhonePe checkout
      ↓
server-side PhonePe verification/webhook
      ↓
amount + currency + provider reference validation
      ↓
payment successful
      ↓
booking confirmed
      ↓
QR tickets issued exactly once
```

Payment processing is idempotent. Provider references and payment idempotency keys are constrained in MySQL.

PhonePe callback authentication is verified server-side. The implementation accepts the current documented checkout callback event variants and the callback order identifier forms used by the provider SDKs. Payment state is never taken from a browser-only status field.

## QR / venue lifecycle

QR identifiers are generated server-side and contain no customer or payment data.

```text
unused → used
```

Verification is transactional. A previously used QR cannot grant entry again.

## Admin authentication

Admin authentication uses server-side opaque MySQL sessions, not JWTs or browser-stored bearer tokens.

- password hashes use `crypto.scrypt`
- raw session tokens are sent only as HttpOnly cookies
- session token hashes are persisted in MySQL
- sessions expire and can be revoked server-side
- state-changing admin requests require a configured allowed Origin
- login failures are rate limited in-process
- credentials, tokens, password hashes, and sensitive request bodies are not logged

Create an administrator through the controlled bootstrap command:

```bash
npm --workspace backend run admin:create
```

No default production administrator is created by migrations or seed data.

## Frontend routes

Public:

```text
/
/events/:id
/events/:id/book
/gallery
/sponsors
/contact
```

Admin:

```text
/admin/login
/admin
/admin/events
/admin/bookings
/admin/payments
/admin/qr
/admin/gallery
/admin/sponsors
/admin/inquiries
```

Admin routes use `ProtectedAdminRoute`; this is only a UX boundary. Backend authorization remains authoritative.

## Testing

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

The GitHub Actions workflow runs all four checks on pushes and pull requests targeting `main`.

## Production readiness limitations

Before production launch, the source-supported operational work still requires deployment-specific configuration and verification, including:

- production MySQL credentials and database provisioning
- HTTPS/TLS and production frontend/API origins
- PhonePe production merchant enablement and credentials
- PhonePe production webhook configuration
- controlled production admin account creation
- production backup/operational procedures
- final responsive/accessibility verification on supported devices
- organizer-provided event, venue, ticket, gallery, sponsor, and contact content

The source does not specify a hosting vendor, email provider, WhatsApp provider, Google Maps integration method, reporting metrics, or FAQ behavior. Those are not invented here.

## CI status

The final verified `main` commit and GitHub Actions run are reported in the project audit/verification record. CI is configured to fail on backend test/lint or frontend lint/build failure; no failure suppression is used.
