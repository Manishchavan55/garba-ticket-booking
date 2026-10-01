# Backend API

## Base URL

Local development defaults to:

```text
http://localhost:8080/api
```

## Response convention

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

API errors do not expose stack traces, SQL errors, environment variables, filesystem paths, credentials, or secrets.

## Health

### `GET /health`

Reports application-process health only. It does not query MySQL.

### `GET /health/ready`

Reports dependency readiness and verifies MySQL with `SELECT 1`.

## Public event API

### `GET /events`

Returns public event records using only fields intended for the public website.

### `GET /events/:id`

Path parameter:

- `id` — positive integer event identifier

Returns one public event. A missing event returns `404` with `NOT_FOUND`. A malformed identifier returns `400` with `INVALID_ID`.

### `GET /events/:eventId/ticket-categories`

Path parameter:

- `eventId` — positive integer event identifier

Returns public ticket-category information:

```json
[
  {
    "id": 1,
    "name": "General Entry",
    "price": "499.00",
    "availability_status": "available"
  }
]
```

The category `id` is exposed because the booking API requires a stable public reference to the selected category. The backend remains authoritative for price and availability.

No quantity, reservation, booking, inventory calculation, payment, or customer information is processed by this endpoint.

## Public booking API

### `POST /bookings`

Creates a customer booking in the existing pre-payment state. **Booking creation is not payment success.** This endpoint does not start or verify a payment, issue a ticket, or generate a QR code.

Required header:

```text
Idempotency-Key: <client-generated unique key>
```

The same idempotency key may be safely retried after a network timeout or accidental repeat submission. The server returns the existing booking instead of creating another booking.

Request body:

```json
{
  "eventId": 1,
  "ticketCategoryId": 1,
  "quantity": 2,
  "customerName": "Customer Name",
  "customerEmail": "customer@example.com",
  "customerPhone": "+919876543210"
}
```

`eventId` must identify the event whose ticket category is being booked. The backend verifies that the selected category belongs to that event inside the transaction.

The backend loads the ticket category from MySQL inside the booking transaction, checks that its `availability_status` is `available`, reads the database price, calculates the amount, and stores the authoritative amount. Client-supplied price or total values are not accepted.

Success response (`201`):

```json
{
  "success": true,
  "data": {
    "bookingId": "KDN-...",
    "status": "pending",
    "amount": "998.00",
    "currency": "INR"
  }
}
```

The existing database `pending` status is the Phase 5 pre-payment state and is documented semantically as **PENDING_PAYMENT**. It is not changed to `confirmed` by booking creation. Payment verification owns the later transition.

## Payment API

### `POST /bookings/:bookingId/payment`

Initiates checkout for a payable booking.

Required header:

```text
Idempotency-Key: <client-generated unique key>
```

The backend locks and loads the booking, requires `pending`, loads amount/currency from MySQL, creates or reuses a pending payment record, delegates checkout creation to the configured provider abstraction, and never marks the booking paid during checkout creation.

Until a production provider is selected, this endpoint returns sanitized `503 PAYMENT_PROVIDER_NOT_CONFIGURED` after the payment boundary is established.

### `POST /payments/verify`

Backend verification boundary. A browser-supplied status such as `{"status":"paid"}` is never sufficient.

A configured provider must authenticate/verify the provider result and normalize it before the service compares amount/currency, verifies the transaction reference, updates payment state, confirms the booking, and issues QR tickets.

No production provider is configured yet, so this endpoint currently returns `503 PAYMENT_PROVIDER_NOT_CONFIGURED`.

### `POST /payments/webhook`

Generic provider webhook boundary. Provider-specific signature/authentication is intentionally not invented before provider selection. The configured provider implementation owns webhook authenticity verification and event normalization.

No production provider is configured yet, so this endpoint currently returns `503 PAYMENT_PROVIDER_NOT_CONFIGURED`.

## Payment state machine

```text
Payment:
  pending -> successful
  pending -> failed

Booking:
  pending --verified successful payment--> confirmed
                                      |
                                      v
                                ticket issuance
```

A failed payment never confirms the booking and never issues tickets. Repeated successful verification is idempotent.

## Ticket issuance and QR tickets

Ticket issuance is a domain operation invoked by trusted payment success. The persisted `bookings.quantity` determines ticket cardinality.

```text
quantity = 1 -> 1 QR ticket
quantity = 3 -> 3 QR tickets
```

QR identifiers are generated server-side using cryptographically secure random bytes. They contain no customer data, payment secrets, database identifiers, or sequential ticket numbers. The QR image is rendered from the opaque identifier only.

### `POST /tickets/verify`

Request:

```json
{
  "qrIdentifier": "<opaque-qr-identifier>"
}
```

The verification transaction locks the ticket, checks booking/payment eligibility, and atomically changes `unused` to `used`. A second verification returns `409 QR_TICKET_ALREADY_USED`.

## Provider abstraction

```text
PaymentService
    ↓
PaymentProvider interface
    ↓
Provider implementation
```

The provider contract supports checkout creation, payment authenticity verification, webhook authenticity verification, and normalized payment status. The current `unconfigured` provider deliberately fails closed and is not a fake successful-payment implementation.

## Admin authentication API

Phase 8 uses a server-side opaque session stored in MySQL. The browser receives only an HttpOnly cookie; the database stores a SHA-256 hash of the random session token. Session lifetime defaults to eight hours and is configurable with `ADMIN_SESSION_TTL_HOURS`.

### `POST /admin/auth/login`

Requires a configured frontend `Origin` header and accepts:

```json
{
  "identifier": "admin@example.com",
  "password": "<admin-password>"
}
```

The identifier can be the administrator username or email. Passwords are verified against scrypt hashes in `admin_users`.

Successful response:

```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    },
    "expiresAt": "2026-10-02T12:00:00.000Z"
  }
}
```

The session credential is delivered only through an HttpOnly cookie. The JSON response never contains the password, password hash, raw session token, database credentials, or server secrets.

Invalid, nonexistent, and inactive accounts use the same `401 INVALID_CREDENTIALS` response. This avoids username/email enumeration.

Repeated failed login attempts are limited by a lightweight in-process limiter: five failures per fifteen-minute window by default. This is not a distributed rate-limit guarantee.

### `GET /admin/auth/me`

Requires the valid admin session cookie.

Unauthenticated or expired/revoked sessions return:

```text
401 AUTHENTICATION_REQUIRED
```

Authenticated response contains only safe administrator identity and session expiration information.

### `POST /admin/auth/logout`

Requires a configured frontend `Origin`. The server revokes the current session in `admin_sessions` and clears the HttpOnly cookie. Logout is therefore server-side invalidation, not only frontend state deletion.

## Admin authentication security

Cookie attributes:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- `Path=/api/admin`
- explicit `Max-Age`

State-changing admin endpoints require an `Origin` matching the configured `CORS_ORIGIN`. CORS uses credentialed requests only for configured origins; wildcard origins are not used.

The existing logger is used for successful/failed login and logout events. Passwords, password hashes, session tokens, cookies, authorization headers, and sensitive request bodies are not logged.

## Admin API boundary

The protected namespace is reserved under:

```text
/api/admin/*
```

Phase 8 implements only:

```text
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me
```

No admin event, ticket, booking, payment, QR, gallery, sponsor, inquiry, reporting, or analytics endpoints exist in this phase.

## Admin account creation

No default administrator is created automatically and no real credentials are stored in seed data.

Development or controlled operational setup uses:

```bash
npm --workspace backend run admin:create
```

with `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` supplied through the backend environment. Production additionally requires `ADMIN_BOOTSTRAP_CONFIRM=CREATE_ADMIN`.

## Configuration

Backend configuration is server-side only. Copy `backend/.env.example` to `backend/.env` and provide local values. Authentication secrets are not exposed through React environment variables because the session credential is generated server-side and delivered only through an HttpOnly cookie.

## Inventory limitation

The current schema defines ticket-category availability status but no numeric capacity/quota. The booking/ticket phases therefore do not claim finite inventory enforcement.

## Status code conventions

- `200` successful request or idempotent replay
- `201` new booking/payment record successfully initiated
- `400` malformed or invalid request
- `401` authentication required or invalid credentials
- `403` CSRF/origin or authorization failure
- `404` unknown API route/resource
- `409` resource/state/amount/reference conflict
- `413` request body too large
- `429` login rate limit exceeded
- `500` unexpected internal error
- `503` database or unconfigured payment-provider dependency unavailable
