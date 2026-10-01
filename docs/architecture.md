# KESARIYA Dandiya Nights Architecture Notes

## Responsibilities

- `frontend/`: browser-facing React application. It contains no database credentials or server secrets.
- `backend/`: Express API, configuration, middleware, validation, controller/service boundaries, MySQL connection/transaction layer, and database migration/validation commands.
- `database/`: database architecture documentation and ordered SQL migrations.
- `docs/`: architecture and API documentation.

## Request flow

```text
Browser -> React -> API client -> Express route -> controller -> service -> database/repository layer -> MySQL
```

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

`withTransaction()` provides a reusable `BEGIN -> operation -> COMMIT` / `ROLLBACK` lifecycle and always releases the connection. It is infrastructure only; no booking/payment/QR transaction has been implemented.

## Security baseline

- Helmet security headers are enabled.
- CORS is driven by backend environment configuration and is not configured with wildcard origins.
- Request bodies have a configurable size limit.
- JSON parsing failures are normalized centrally.
- Backend validation is reusable through `validateBody()`.
- Database credentials remain backend-only.
- SQL errors are not returned to API consumers.
- SQL execution in the database layer uses parameterized queries where values are supplied.
- Authentication and authorization are intentionally not implemented in Phase 3.

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

## Phase 3 boundary

Phase 3 establishes backend infrastructure only. No event CRUD, ticket CRUD, booking, payment, QR, admin authentication, gallery, sponsor, inquiry, reports, email, WhatsApp, Google Maps, or other later business APIs are implemented.
