# KESARIYA Dandiya Nights Architecture Notes

## Responsibilities

- `frontend/`: browser-facing React application. It contains no database credentials or server secrets.
- `backend/`: Express API, configuration, middleware, validation, controller/service boundaries, MySQL connection/transaction layer, and payment-provider abstraction.
- `database/`: database architecture documentation and ordered SQL migrations.
- `docs/`: architecture and API documentation.

## Request flow

```text
Browser -> React -> API client -> Express route -> controller -> service -> database/repository layer -> MySQL
                                      |
                                      +-> PaymentService -> PaymentProvider -> selected provider
```

Payment-provider-specific behavior is isolated behind the provider abstraction. Controllers and booking code do not contain gateway-specific API calls.

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

Phase 6 uses this transaction infrastructure for payment confirmation so payment state and booking confirmation commit together or roll back together.

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

## Payment and booking states

Payment and booking states are separate:

```text
Payment:
  pending -> successful
  pending -> failed

Booking:
  pending --trusted successful payment--> confirmed
```

Checkout creation does not confirm the booking. Browser redirects, client-side status values, and arbitrary `{"status":"paid"}` requests are not authoritative.

Payment confirmation loads the authoritative booking amount/currency from MySQL, verifies the trusted provider result, rejects mismatches, and performs the payment/booking transition inside a transaction.

## Payment idempotency

The existing `payments.idempotency_key` unique constraint supports safe repeated initiation requests. The existing unique `(provider, gateway_transaction_reference)` constraint protects provider-reference uniqueness.

Repeated successful verification is treated as an idempotent result. Payment processing does not generate QR codes or other later-phase side effects.

## Security baseline

- Helmet security headers are enabled.
- CORS is driven by backend environment configuration and is not configured with wildcard origins.
- Request bodies have a configurable size limit.
- JSON parsing failures are normalized centrally.
- Backend validation is reusable through `validateBody()`.
- Database credentials remain backend-only.
- Future payment/provider credentials remain backend-only.
- Provider signatures and authorization headers are not logged.
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

Phase 6 uses the existing `payments` table. It does not create a second payment table or modify an already-applied schema migration.

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

Phase 6 requires no schema migration because the Phase 2 `payments` table already contains amount, currency, provider, provider-reference, payment status, and idempotency fields.

## Phase 6 boundary

Phase 6 establishes the payment boundary only. It does not select a production payment provider and does not implement QR generation, ticket issuance, notifications, admin features, inventory/capacity, or other later business functionality.
