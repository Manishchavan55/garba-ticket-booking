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
  "ticketCategoryId": 1,
  "quantity": 2,
  "customerName": "Customer Name",
  "customerEmail": "customer@example.com",
  "customerPhone": "+919876543210"
}
```

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

The existing database `pending` status is the Phase 5 pre-payment state and is documented semantically as **PENDING_PAYMENT**. It is not changed to `confirmed` by booking creation. Later payment integration will own payment-success transitions.

A successful booking response does not mean:

- payment was successful
- a payment gateway was called
- a ticket was issued
- a QR code was generated
- an email or WhatsApp message was sent

Validation errors return `400`. A missing ticket category returns `404` with `TICKET_CATEGORY_NOT_FOUND`. An unavailable category returns `409` with `TICKET_CATEGORY_UNAVAILABLE`.

The API does not provide a public booking lookup endpoint in Phase 5 because authentication/customer access tokens are not yet available. Numeric database IDs are never exposed as a booking lookup mechanism.

## Inventory limitation

The current schema provides ticket-category `availability_status` (`available`/`unavailable`) but does not define a numeric ticket quota, capacity, or remaining-inventory field. Phase 5 therefore does **not** claim finite inventory enforcement and does not invent a capacity value.

The booking transaction locks the selected ticket-category row while checking its current availability and creating the booking. This prevents the availability decision and booking write from being split across separate transactions, but it does not constitute numeric inventory enforcement.

A future inventory model must be defined by the organizer before the system can claim remaining-ticket or overselling guarantees.

## Booking lifecycle

Phase 5 establishes:

```text
PENDING_PAYMENT
      ↓
[future payment phase]
      ↓
PAID / later ticket issuance states
```

The database currently represents the first state as `booking_status = 'pending'`, preserving the Phase 2 status constraint. Existing `confirmed`, `cancelled`, and `failed` values remain available for later lifecycle phases but are not transitioned by Phase 5 payment logic.

## Public API security boundary

Public endpoints do not expose customer, payment, admin, credential, or internal operational fields. Booking responses contain only the public booking identifier, lifecycle status, authoritative amount, and currency.

Customer email/phone are accepted only for creating the booking and are not returned in the booking response or public event endpoints.

## Status code conventions

- `200` successful request or idempotent replay
- `201` new booking successfully created
- `400` malformed or invalid request
- `404` unknown API route/resource
- `409` resource conflict, including unavailable ticket category
- `413` request body too large
- `500` unexpected internal error
- `503` database/service dependency unavailable

## Configuration

Backend configuration is server-side only. Copy `backend/.env.example` to `backend/.env` and provide local values. Database credentials must never be placed in frontend environment variables.

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

Phase 5 adds only the booking idempotency migration. No payment, QR, admin, gallery, sponsor, inquiry, reporting, email, WhatsApp, or Maps business APIs exist yet.
