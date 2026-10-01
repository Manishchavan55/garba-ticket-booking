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

The backend:

1. locks and loads the booking by its public booking ID
2. requires the booking to remain in `pending`
3. loads amount/currency from MySQL
4. creates or reuses a pending payment record
5. delegates checkout creation to the configured provider abstraction
6. never marks the booking paid during checkout creation

A configured provider may return a checkout URL/reference. Until a production provider is selected, this endpoint returns a sanitized `503 PAYMENT_PROVIDER_NOT_CONFIGURED` response after the pending payment boundary has been established.

### `POST /payments/verify`

Backend verification boundary. The request identifies the booking and carries provider data, but a browser-supplied status such as `{"status":"paid"}` is never sufficient.

The configured provider implementation must authenticate/verify the provider result and normalize it before the service will:

- compare amount against the authoritative booking amount
- compare currency against the authoritative booking currency
- verify the provider transaction reference
- update the payment state
- transition the booking from `pending` to `confirmed`
- issue the booking's QR tickets exactly once

A successful verification response includes the issued ticket records and backend-generated QR image data. No production provider is configured yet, so this endpoint currently returns `503 PAYMENT_PROVIDER_NOT_CONFIGURED`.

### `POST /payments/webhook`

Generic provider webhook boundary. Provider-specific signature/authentication is intentionally not invented before provider selection. The configured provider implementation owns webhook authenticity verification and event normalization.

A verified successful webhook uses the same payment-confirmation transaction boundary and ticket issuance service as direct verification. Duplicate callbacks reuse existing ticket records.

No production provider is configured yet, so this endpoint currently returns `503 PAYMENT_PROVIDER_NOT_CONFIGURED`.

## Payment state machine

Payment state and booking state are separate:

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

A failed payment never confirms the booking and never issues tickets. A successful payment is recorded only after trusted provider verification. Repeated successful verification is handled idempotently and reuses the same QR-ticket records.

Payment amount and currency are always compared against the authoritative booking/payment data loaded from MySQL. Browser totals, client status values, and redirect URLs are not authoritative.

## Ticket issuance and QR tickets

Ticket issuance is a domain operation, not a client-created resource. The payment-success boundary invokes the ticket service inside the same transaction that confirms the booking.

The issuance transaction:

```text
BEGIN
  -> lock/read confirmed booking
  -> verify latest payment is successful
  -> lock existing QR tickets
  -> compare persisted booking quantity
  -> create only missing tickets
  -> COMMIT
```

On failure the transaction rolls back and releases the connection.

### Ticket cardinality

The persisted `bookings.quantity` determines the number of QR tickets:

```text
quantity = 1 -> 1 QR ticket
quantity = 3 -> 3 QR tickets
```

The frontend cannot override this value during issuance.

The existing `qr_tickets` table already supports the required one-booking-to-many-tickets relationship and has a unique `qr_identifier` constraint. No Phase 7 migration is required.

### QR identifier strategy

Each QR identifier is generated server-side using cryptographically secure random bytes and encoded as a URL-safe opaque identifier. It contains no customer data, passwords, payment secrets, database identifiers, or sequential ticket numbers.

The QR image is rendered from only that opaque identifier. Customer/payment data is not encoded into the QR payload.

The backend uses the maintained `qrcode` package for server-side PNG data-URL rendering. The QR image is generated for presentation after the transactional ticket records have been committed; the identifier itself remains the persisted source of truth.

### Ticket issuance idempotency

Ticket issuance does not depend on an HTTP idempotency header. It is safe when invoked internally by repeated payment verification/webhook processing.

The booking row is locked before existing tickets are checked. If the persisted quantity has already been fully issued, the existing ticket records are returned and no inserts occur. If a prior transaction somehow left a partial batch, only the missing quantity is created. The database's unique QR identifier constraint remains the final uniqueness guarantee.

## QR verification

### `POST /tickets/verify`

Verifies and consumes one QR ticket.

Request:

```json
{
  "qrIdentifier": "<opaque-qr-identifier>"
}
```

The identifier is validated before database access. The verification transaction then:

1. locks the matching ticket row
2. verifies that the ticket exists
3. rejects `used` or `invalid` tickets
4. verifies the associated booking is `confirmed`
5. verifies the latest payment is `successful`
6. atomically changes the ticket from `unused` to `used`
7. records `verified_at` and `used_at`
8. commits the entry decision

A successful response is:

```json
{
  "success": true,
  "data": {
    "verified": true,
    "status": "used",
    "bookingId": "KDN-..."
  }
}
```

A second verification of the same QR identifier returns `409 QR_TICKET_ALREADY_USED` and does not accept the ticket again. A nonexistent identifier returns `404 QR_TICKET_NOT_FOUND`.

This phase provides the verification service/API foundation but does not add a scanning camera UI or admin authorization layer. Admin authentication and venue-scanning UI belong to later phases.

## Provider abstraction

The backend uses:

```text
PaymentService
    ↓
PaymentProvider interface
    ↓
Provider implementation
```

The provider contract supports:

- checkout creation
- payment authenticity verification
- webhook authenticity verification
- normalized payment status

The current implementation is an isolated `unconfigured` provider that deliberately fails closed. It is a configuration boundary, **not a payment gateway and not a fake successful-payment implementation**.

Provider-specific signatures, credentials, API fields, checkout behavior, and webhook payloads remain pending production provider selection.

## Payment idempotency and atomicity

Payment initiation uses the existing `payments.idempotency_key` unique constraint. Provider transaction references use the existing unique `(provider, gateway_transaction_reference)` constraint.

Payment confirmation uses the existing transaction helper and locks the relevant payment/booking rows before state changes. The payment update, booking confirmation, and successful-payment ticket issuance commit together or roll back together.

Duplicate provider events and repeated verification do not create another payment or another QR-ticket batch.

## Payment security

Provider credentials, webhook secrets, signatures, authorization headers, and database credentials remain backend-only. They are not exposed to React or public files.

QR identifiers are bearer-style credentials. They are not logged and are not included in generic error metadata. Verification responses return only the minimum booking reference needed for the entry decision.

The application does not log full payment payloads or secrets. Provider-specific signature validation remains explicitly pending provider selection.

## Inventory limitation

The current schema provides ticket-category `availability_status` (`available`/`unavailable`) but does not define a numeric ticket quota, capacity, or remaining-inventory field. Phase 5 therefore does **not** claim finite inventory enforcement and does not invent a capacity value.

## Status code conventions

- `200` successful request or idempotent replay
- `201` new booking/payment record successfully initiated
- `400` malformed or invalid request
- `404` unknown API route/resource
- `409` resource/state/amount/reference conflict
- `413` request body too large
- `500` unexpected internal error
- `503` database or unconfigured payment-provider dependency unavailable

## Configuration

Backend configuration is server-side only. Copy `backend/.env.example` to `backend/.env` and provide local values. Database credentials and future payment credentials must never be placed in frontend environment variables.

The payment provider configuration currently defaults to:

```text
PAYMENT_PROVIDER=unconfigured
```

No production payment provider is configured yet.

## Development

```bash
npm install
npm --workspace backend run dev
npm --workspace frontend run dev
```

## Tests and lint

```bash
npm --workspace backend test
npm --workspace backend run lint
npm --workspace frontend run lint
npm --workspace frontend run build
```

## Database commands

```bash
npm run db:check
npm run db:migrate
npm run db:validate
npm run db:seed
```

Phase 7 does not add a schema migration because the existing `qr_tickets` table already contains the required one-booking-to-many-ticket fields and the unique QR identifier constraint. No authentication/admin, notifications, gallery, sponsor, inquiry, reporting, email, WhatsApp, Maps, or inventory business functionality has been added.
