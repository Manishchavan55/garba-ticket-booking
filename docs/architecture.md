# KESARIYA Dandiya Nights Architecture Notes

## Responsibilities

- `frontend/`: browser-facing React application. It contains no database credentials or server secrets.
- `backend/`: Express API, configuration, middleware, service/controller boundaries, MySQL connection layer, and database migration/validation commands.
- `database/`: database architecture documentation.
- `backend/src/database/migrations/`: ordered SQL migrations owned by the backend database layer.

## Request flow

```text
Browser -> React -> API client -> Express route -> controller -> service -> database layer -> MySQL
```

The health endpoint remains lightweight and does not depend on MySQL. A dedicated database check verifies real connectivity when credentials and a reachable MySQL server are available.

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

### Data-integrity principles

- Monetary values use exact `DECIMAL(12,2)` types.
- Booking IDs, QR identifiers, admin usernames/emails, and payment idempotency/reference identifiers have appropriate uniqueness constraints.
- Foreign keys use restrictive delete/update behavior to preserve historical booking, payment, and ticket records.
- Status values are constrained at the database layer.
- QR tickets retain verification and usage timestamps so a future verification service can perform an atomic one-time entry operation.

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

No Phase 3 business/API/UI functionality is introduced by the database schema.
