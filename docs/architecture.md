# KESARIYA Dandiya Nights Architecture Notes

## Responsibilities

- `frontend/`: browser-facing React application. It contains no database credentials or server secrets.
- `backend/`: Express API, configuration, middleware, validation, controller/service boundaries, MySQL connection/transaction layer, payment-provider abstraction, and ticket/QR services.
- `database/`: database architecture documentation and ordered SQL migrations.
- `docs/`: architecture and API documentation.

## Request flow

```text
Browser -> React -> API client -> Express route -> controller -> service -> database/repository layer -> MySQL
                                      |
                                      +-> PaymentService -> PaymentProvider -> selected provider
                                      |
                                      +-> TicketService -> QR ticket persistence
```

Payment-provider-specific behavior is isolated behind the provider abstraction. Controllers and booking code do not contain gateway-specific API calls.

Ticket issuance and QR verification are isolated in the ticket service. Controllers do not create QR records directly.

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

Phase 6 uses this transaction infrastructure for payment confirmation. Phase 7 uses the same transaction infrastructure for ticket issuance and one-time QR verification.

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

Phase 7 provides the backend verification API foundation but does not add scanning-camera UI or admin authorization. Those require the later authentication/admin and venue workflow phases.

## Payment idempotency

The existing `payments.idempotency_key` unique constraint supports safe repeated initiation requests. The existing unique `(provider, gateway_transaction_reference)` constraint protects provider-reference uniqueness.

Repeated successful verification is treated as an idempotent result. Ticket issuance is also idempotent at the domain level and does not depend on an HTTP idempotency header.

## Security baseline

- Helmet security headers are enabled.
- CORS is driven by backend environment configuration and is not configured with wildcard origins.
- Request bodies have a configurable size limit.
- JSON parsing failures are normalized centrally.
- Backend validation is reusable through `validateBody()`.
- Database credentials remain backend-only.
- Future payment/provider credentials remain backend-only.
- Provider signatures and authorization headers are not logged.
- QR identifiers are not logged.
- SQL errors are not returned to API consumers.
- SQL execution in the database layer uses parameterized queries where values are supplied.
- Authentication and authorization are intentionally not implemented yet.

## Phase 2 database model

```text
 events
   |
   └── ticket_categories
          |
          └── bookings
                 ├── payments
                 └── qr_tickets

 gallery
 sponsors
 inquiries
 admin_users
```

Phase 6 uses the existing `payments` table. Phase 7 uses the existing `qr_tickets` table and its unique QR identifier constraint.

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

Phase 7 requires no schema migration because the Phase 2 `qr_tickets` table already contains booking association, opaque QR identifier, verification status, verification timestamp, used timestamp, and uniqueness constraints.

## Phase 7 boundary

Phase 7 establishes ticket issuance, QR identifier generation, customer-facing QR image data, and one-time QR verification foundations. It does not add a production payment provider, authentication/admin UI, scanning-camera UI, notifications, inventory/capacity, gallery, sponsors, inquiries, reporting, email, WhatsApp, Maps, or other later business functionality.
