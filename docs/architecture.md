# KESARIYA Dandiya Nights Architecture Notes

## Responsibilities

- `frontend/`: browser-facing React application. It contains no database credentials or server secrets.
- `backend/`: Express API, configuration, middleware, validation, controller/service boundaries, MySQL connection/transaction layer, payment-provider abstraction, ticket/QR services, and admin authentication/session boundary.
- `database/`: database architecture documentation and ordered SQL migrations.
- `docs/`: architecture and API documentation.

## Request flow

```text
Browser -> React -> API client -> Express route -> controller -> service -> database/repository layer -> MySQL
                                      |
                                      +-> PaymentService -> PaymentProvider -> selected provider
                                      |
                                      +-> TicketService -> QR ticket persistence
                                      |
                                      +-> AdminAuth -> server-side session -> admin_users/admin_sessions
```

Payment-provider-specific behavior is isolated behind the provider abstraction. Controllers and booking code do not contain gateway-specific API calls.

Ticket issuance and QR verification are isolated in the ticket service. Controllers do not create QR records directly.

Admin authentication is isolated behind the admin authentication service and reusable authentication/authorization middleware. Admin business modules are not part of this phase.

Cross-cutting concerns are kept outside controllers through configuration, middleware, validation, error handling, logging, and reusable database utilities.

## API response convention

Successful responses use:

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

Production API responses do not expose stack traces, SQL details, credentials, environment variables, filesystem paths, or secrets.

## Health model

`GET /api/health` means the Node.js process/API is running. It does not query MySQL.

`GET /api/health/ready` is the dependency-readiness check and currently verifies MySQL with `SELECT 1`.

## Database access

The existing `mysql2` pool remains the single database connection mechanism. Future repository/data-access modules should use this pool rather than introducing another ORM or database client without a concrete requirement.

`withTransaction()` provides a reusable `BEGIN -> operation -> COMMIT` / `ROLLBACK` lifecycle and always releases the connection.

Phase 6 uses this transaction infrastructure for payment confirmation. Phase 7 uses the same transaction infrastructure for ticket issuance and one-time QR verification. Phase 8 uses it for login session creation and logout revocation.

## Payment architecture

```text
PaymentService
      |
      v
PaymentProvider interface
      |
      +--> selected production provider (future)
      |
      +--> unconfigured fail-closed provider (current)
```

The provider contract is responsible for:

- creating/initiating checkout
- verifying payment authenticity
- verifying webhook authenticity
- normalizing provider payment status

The current `unconfigured` provider deliberately fails closed. It is not a fake payment gateway and cannot report a successful payment.

No production provider, credentials, SDK, provider-specific signature format, or provider-specific webhook schema has been selected yet.

## Payment, booking, and ticket states

Payment and booking states remain separate, with ticket issuance downstream of trusted payment confirmation:

```text
Payment:
  pending -> successful
  pending -> failed

Booking:
  pending --trusted successful payment--> confirmed
                                      |
                                      v
                              TicketService
                                      |
                                      v
                             qr_tickets (unused)
```

Checkout creation does not confirm the booking. Browser redirects, client-side status values, and arbitrary `{"status":"paid"}` requests are not authoritative.

Payment confirmation loads the authoritative booking amount/currency from MySQL, verifies the trusted provider result, rejects mismatches, and performs the payment/booking/ticket issuance transition inside one transaction.

Repeated successful verification invokes the same ticket service but reuses the existing ticket records instead of creating another batch.

## Ticket issuance architecture

```text
Trusted payment success
        |
        v
confirmed booking
        |
        v
TicketService
        |
        +--> lock booking
        +--> verify successful payment
        +--> lock existing qr_tickets
        +--> compare persisted booking.quantity
        +--> insert only missing tickets
        |
        v
commit
```

The existing Phase 2 `qr_tickets` table is one-to-many from `bookings`: one booking can have as many ticket records as its persisted `quantity`. The existing unique `qr_identifier` constraint remains the database uniqueness guarantee.

QR identifiers are generated with cryptographically secure random bytes and contain no customer or payment data. QR images are generated from the opaque identifier only. The `qrcode` dependency renders a PNG data URL for customer-facing ticket data; the QR identifier remains the persisted source of truth.

## QR verification architecture

```text
QR identifier
      |
      v
TicketService.verifyQrTicket()
      |
      +--> validate identifier
      +--> SELECT ... FOR UPDATE
      +--> reject used/invalid/not-eligible ticket
      +--> conditional UPDATE unused -> used
      +--> commit
```

The one-time-use mutation is transactional. A second attempt returns a conflict and does not consume the ticket again.

## Admin authentication architecture

Phase 8 uses a **server-side opaque session** rather than JWTs or browser-stored access tokens. This is the simplest stateful design for the current React + Express application because logout/revocation can be enforced by the backend without distributing long-lived bearer credentials to JavaScript.

```text
React admin login
      |
      v
POST /api/admin/auth/login
      |
      v
AdminAuthService
      |
      +--> admin_users lookup
      +--> scrypt password verification
      +--> create random session token
      +--> SHA-256 token hash persisted in admin_sessions
      +--> update last_login_at
      |
      v
HttpOnly session cookie
```

The browser never receives the password hash or the raw session token in a JSON response. The raw session token exists only in the HttpOnly cookie. The database stores only its SHA-256 hash.

### Session behavior

Default session lifetime:

```text
8 hours
```

Configured with:

```text
ADMIN_SESSION_TTL_HOURS
```

The cookie is:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- scoped to `/api/admin`
- explicitly expired on logout

The backend checks the session hash, `revoked_at`, `expires_at`, and administrator `is_active` state on `/me` and every protected admin request.

Logout writes `revoked_at` server-side; it is not only a frontend state change.

### Password security

Passwords are stored using Node.js `crypto.scrypt` with a per-password random salt. The encoded password format stores the scrypt parameters, salt, and derived key; plaintext passwords are never persisted.

Login uses a generic `INVALID_CREDENTIALS` response for nonexistent, inactive, and incorrect-password accounts to avoid account enumeration.

### Authorization foundation

`authenticateAdmin` establishes the authenticated administrator identity. `authorizeAdmin(policy)` is the centralized authorization boundary for future role/permission policies. Current Phase 8 policy is authenticated-admin access only; no unnecessary roles are invented.

Future admin controllers should compose these middleware layers rather than scattering role checks through controllers.

### CSRF and CORS

Because authentication uses a browser cookie, state-changing admin endpoints use a concrete same-origin defense:

- `SameSite=Lax` on the session cookie
- state-changing admin requests require an `Origin` header matching the configured `CORS_ORIGIN`
- CORS uses the configured frontend origin(s) and `credentials: true`
- wildcard `Access-Control-Allow-Origin: *` is not used with credentials

The current protected GET `/me` endpoint does not require CSRF protection because it is read-only.

### Login abuse protection

A lightweight in-process IP-based limiter allows five failed login attempts per fifteen-minute window by default. It is intentionally not described as distributed or cluster-safe. A multi-instance production deployment will require a shared rate-limit mechanism or an upstream control.

### Security logging

The existing logger records successful and failed admin authentication events without passwords, password hashes, session tokens, cookies, or sensitive request bodies. The logger's metadata sanitizer also excludes fields matching password/secret/token/authorization/credential patterns.

## Phase 8 database model

```text
admin_users
    |
    +---- admin_sessions
```

The existing `admin_users` table already contains identity, password-hash, active-state, and last-login fields. It does not contain server-side session state, so migration `003_admin_auth_sessions.sql` adds `admin_sessions` with:

- administrator foreign key
- hashed opaque session token
- expiration timestamp
- revocation timestamp
- uniqueness and lookup indexes

Existing migrations are not edited.

## Admin API boundary

```text
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me
```

Only authentication and the protected identity endpoint are implemented in Phase 8. The `/api/admin` namespace is reserved for later protected administration modules.

## Admin account creation

No production administrator is seeded automatically and no default password exists in seed data.

The deliberate bootstrap command is:

```bash
npm --workspace backend run admin:create
```

It reads `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` from the backend environment. In production it additionally requires `ADMIN_BOOTSTRAP_CONFIRM=CREATE_ADMIN`.

Real credentials must never be committed to `.env.example`, seed files, source code, or documentation.

## Migration process

```text
npm run db:migrate
        |
        v
backend/src/database/migrations/*.sql
        |
        v
MySQL + schema_migrations
```

Schema validation is available with:

```text
npm run db:validate
```

Phase 8 adds `003_admin_auth_sessions.sql` because the existing `admin_users` table cannot provide server-side session creation, expiration, or revocation on its own.

## Phase 8 boundary

Phase 8 establishes secure administrator password authentication, server-side session state, login/logout/me APIs, reusable authentication/authorization middleware, configured-origin CORS/CSRF defenses, lightweight login abuse protection, safe security logging, and the minimum React admin-login/protected-route foundation.

It does not add event CRUD, ticket CRUD, booking management, payment management, QR management, gallery, sponsors, inquiries, reports, analytics, scanning UI, notifications, or other admin business modules.
