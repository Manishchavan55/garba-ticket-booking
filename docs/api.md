# Backend API

## Base URL

Local development defaults to:

```text
http://localhost:8080/api
```

## Response convention

Success:

```json
{ "success": true, "data": {} }
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

API errors do not expose stack traces, SQL errors, filesystem paths, credentials, or secrets.

## Health

```text
GET /health
GET /health/ready
```

`/health` reports process health. `/health/ready` checks MySQL readiness.

## Public event/ticket API

```text
GET /events
GET /events/:id
GET /events/:eventId/ticket-categories
```

Public responses expose only event and ticket information required by the public site. Invalid identifiers return the established validation response; missing records return `404`.

Ticket categories expose their public `id`, name, price, and availability status. The backend remains authoritative for booking price and availability.

## Public booking API

```text
POST /bookings
```

Requires an `Idempotency-Key` header.

The backend loads the selected ticket category and current price from MySQL, verifies the category/event relationship and availability, calculates the authoritative amount, and stores the booking in the pre-payment `pending` state.

The client cannot supply an authoritative price or total.

## Payment API

```text
POST /bookings/:bookingId/payment
POST /payments/verify
POST /payments/webhook
```

Payment initiation requires `Idempotency-Key`.

The selected production provider is PhonePe Standard Checkout. Credentials are backend-only environment variables.

The payment service validates:

- booking/payment state
- authoritative amount
- currency
- provider
- provider transaction reference
- provider payment state

Successful verified payment changes the booking to `confirmed` and invokes idempotent QR-ticket issuance.

The webhook endpoint delegates authenticity verification to the PhonePe provider implementation before applying any state transition. Current callback handling accepts the supported PhonePe checkout callback variants and validates the callback authorization header.

Refund APIs are not implemented because the supplied project requirements did not define a refund-management workstream with sufficient business rules.

## Ticket / QR API

```text
POST /tickets/verify
```

A valid unused QR can grant entry once. Verification is transactional and changes the QR record from `unused` to `used`. A repeated verification returns a conflict rather than granting entry again.

## Gallery API

Public:

```text
GET /gallery
```

Admin:

```text
GET    /admin/gallery
GET    /admin/gallery/:id
POST   /admin/gallery
PATCH  /admin/gallery/:id
DELETE /admin/gallery/:id
```

Admin routes require `authenticateAdmin` followed by `authorizeAdmin()`.

Gallery uses the existing schema fields including `media_type`, `media_url`, `alt_text`, and `is_active`. File-upload/storage-provider infrastructure is not included because the supplied requirements did not require it.

## Sponsor API

Public:

```text
GET /sponsors
```

Admin:

```text
GET    /admin/sponsors
GET    /admin/sponsors/:id
POST   /admin/sponsors
PATCH  /admin/sponsors/:id
DELETE /admin/sponsors/:id
```

Public retrieval exposes active sponsors only. Admin routes require the existing admin authentication and authorization middleware.

## Inquiry API

Public:

```text
POST /inquiries
```

Admin:

```text
GET    /admin/inquiries
GET    /admin/inquiries/:id
PATCH  /admin/inquiries/:id
DELETE /admin/inquiries/:id
```

Public submissions accept only the fields represented by the existing `inquiries` schema. Admin updates are limited to supported schema fields, including the existing inquiry status values.

## Admin authentication

```text
POST /admin/auth/login
GET  /admin/auth/me
POST /admin/auth/logout
```

Authentication uses server-side opaque MySQL sessions. The browser receives only an HttpOnly session cookie; the database stores a hash of the session token.

State-changing admin requests require a configured allowed Origin. Backend authorization is authoritative; frontend protected routes are only a UX boundary.

## Admin event / ticket-category API

```text
GET    /admin/events
GET    /admin/events/:id
POST   /admin/events
PATCH  /admin/events/:id
DELETE /admin/events/:id

GET    /admin/events/:eventId/ticket-categories
POST   /admin/events/:eventId/ticket-categories
PATCH  /admin/ticket-categories/:id
DELETE /admin/ticket-categories/:id
```

Deletion respects the database's restrictive financial/ticket relationships. Dependent historical records are not cascade-deleted.

## Admin booking API

```text
GET /admin/bookings
GET /admin/bookings/:bookingId
```

The implemented management surface is read-only; it does not mutate booking financial history.

## Admin payment/transaction API

```text
GET /admin/payments
GET /admin/payments/:paymentId
```

The implemented management surface is read-only. It does not invent refund, reconciliation, or payment-status mutation workflows.

## Admin QR / venue API

```text
GET  /admin/qr-tickets
GET  /admin/qr-tickets/:ticketId
POST /admin/qr-tickets/verify
```

Venue verification is server-side and one-time-use. Existing ticket/payment validity is checked before entry is accepted.

## Authorization boundary

Every admin business endpoint uses:

```text
authenticateAdmin
      ↓
authorizeAdmin()
      ↓
controller
      ↓
service
      ↓
MySQL
```

No frontend authorization state is trusted for access control.

## Database migrations

Current migrations:

```text
001_initial_schema.sql
002_booking_idempotency.sql
003_admin_auth_sessions.sql
```

Migrations are append-only. Existing applied migrations are not edited.

## Deliberately unspecified integrations

The supplied project requirements mention email, WhatsApp, Google Maps, and reports/analytics as later functionality but do not specify provider/API/business rules sufficiently to implement them safely. They are therefore not represented as implemented APIs here.

FAQ functionality is also not documented because the supplied source does not define an FAQ schema or functional contract.
