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
├── frontend/         # React/Vite public website and admin auth foundation
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

The trusted sequence is:

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

## Phase 8 admin authentication

Phase 8 adds only the security foundation for the future admin panel. No admin business modules are implemented.

### Authentication strategy

The application uses a **server-side opaque session** rather than JWTs or long-lived browser storage. The server generates a cryptographically random session token, stores only its SHA-256 hash in MySQL, and sends the raw token only as an HttpOnly cookie.

Default session lifetime:

```text
8 hours
```

The session cookie is:

- HttpOnly
- SameSite=Lax
- Secure in production
- scoped to `/api/admin`
- explicitly invalidated on logout

Passwords are hashed with Node.js `crypto.scrypt` using a per-password random salt. Passwords and password hashes are never returned to clients.

### Admin authentication API

```text
POST /api/admin/auth/login
GET  /api/admin/auth/me
POST /api/admin/auth/logout
```

Login accepts a username or email plus password. Invalid, nonexistent, and inactive accounts use the same generic `401 INVALID_CREDENTIALS` response.

`/api/admin/auth/me` requires a valid, active, unexpired, non-revoked session.

Logout revokes the server-side session and clears the HttpOnly cookie.

### Authorization boundary

Backend protection is enforced through reusable:

```text
authenticateAdmin
      ↓
authorizeAdmin(policy)
      ↓
admin controller
```

The current policy is authenticated-admin access only. The centralized authorization layer is designed so future roles/permissions can be added without scattering role checks through controllers.

### CSRF/CORS

State-changing admin requests require an `Origin` matching the configured frontend `CORS_ORIGIN`. The backend uses credentialed CORS for configured origins only; wildcard origins are not used.

The cookie's `SameSite=Lax` policy provides an additional browser-level cross-site restriction. The read-only `/me` endpoint does not require CSRF protection.

### Login abuse protection

A lightweight in-process limiter allows five failed attempts per fifteen-minute window by default. This is intentionally not described as a distributed protection mechanism.

### Admin account setup

No default administrator is created by migrations or seed data.

For development or controlled operational setup:

```bash
npm --workspace backend run admin:create
```

Supply these backend-only environment values:

```text
ADMIN_BOOTSTRAP_USERNAME=...
ADMIN_BOOTSTRAP_EMAIL=...
ADMIN_BOOTSTRAP_PASSWORD=...
```

Production additionally requires:

```text
ADMIN_BOOTSTRAP_CONFIRM=CREATE_ADMIN
```

Never commit real credentials.

## Database setup

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

Phase 5 added `002_booking_idempotency.sql`. Phase 8 adds `003_admin_auth_sessions.sql` because the existing `admin_users` table does not contain server-side session state required for secure expiration and revocation.

## Inventory limitation

The source requirements define ticket-category availability status but do not define numeric capacity/quota. The project therefore does not invent ticket quantities or claim finite inventory enforcement.

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

## Phase 8 status

Implemented:

- Server-side opaque admin sessions
- scrypt password hashing
- Generic invalid-credential handling
- Active-account enforcement
- Login/logout/me APIs
- Server-side logout revocation
- Session expiration
- Reusable authentication middleware
- Centralized authorization boundary
- Same-origin CSRF defense for state-changing admin endpoints
- Credentialed configured-origin CORS
- Lightweight login rate limiting
- Security event logging without credentials/tokens/passwords
- Development/controlled admin bootstrap command without default credentials
- React admin login page
- React admin authentication context
- Protected `/admin` route foundation
- No admin business dashboard/modules

Not implemented in Phase 8:

- Event CRUD
- Ticket/category CRUD
- Booking management
- Payment management
- QR management/scanner UI
- Gallery management
- Sponsor management
- Inquiry management
- Reports/analytics
- Notifications
- Google Maps/WhatsApp/email integrations
- Inventory/capacity logic
- Phase 9 features

## Security limitations

The login rate limiter is in-process and therefore not suitable as the sole brute-force defense for a horizontally scaled deployment. Production infrastructure should add a shared rate limiter or upstream WAF/control.

Cookie authentication assumes the frontend and API are deployed within a browser-compatible same-site arrangement under the configured origin policy. A cross-site deployment requiring `SameSite=None` would need an explicit security review and corresponding CSRF design.
