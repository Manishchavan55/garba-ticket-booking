# Phase 2 Database Architecture

Phase 2 introduces the MySQL 8.x schema and a lightweight SQL migration process. The backend remains the owner of database credentials and database access.

## Schema

Core tables:

- `events`
- `ticket_categories`
- `bookings`
- `payments`
- `qr_tickets`
- `gallery`
- `sponsors`
- `inquiries`
- `admin_users`

Migration bookkeeping is stored in `schema_migrations`.

## Relationships

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

The independent tables remain logically separate because the requirements do not define additional mandatory relationships.

## Integrity decisions

- Primary keys use unsigned `BIGINT` values to leave room for growth.
- Monetary values use `DECIMAL(12,2)` rather than floating point.
- Booking identifiers and QR identifiers are unique.
- Payment idempotency keys are unique when supplied.
- Payment gateway references are unique per provider when supplied.
- Foreign keys use `ON UPDATE RESTRICT` and `ON DELETE RESTRICT` so booking/payment/ticket history cannot be removed accidentally through parent deletion.
- Booking, payment, ticket, gallery, sponsor, inquiry, and admin statuses use constrained string values rather than application-only conventions.
- A booking may have multiple QR tickets; the requirements do not define a one-QR-per-booking rule.
- QR `verification_status` stores `unused`, `used`, or `invalid`. The actual one-time verification transaction belongs to a later service layer; the schema provides the state and timestamps needed for an atomic conditional update.

## Migration commands

From the repository root:

```bash
npm run db:migrate
```

Validate the resulting schema:

```bash
npm run db:validate
```

Check basic MySQL connectivity:

```bash
npm run db:check
```

The commands require the backend database variables in `backend/.env`:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

Create the database itself using the MySQL server's normal database-creation mechanism before running migrations. The migration runner creates the application tables; it does not silently create a database with credentials or server-level privileges.

## Migration approach

`backend/src/database/migrate.js` discovers SQL files in `backend/src/database/migrations`, sorts them lexically, and records applied filenames in `schema_migrations`. New migrations should use an incremented filename such as `002_description.sql`.

The current migration is `001_initial_schema.sql` and creates the complete Phase 2 application schema.

## Seed data

No seed data is included in Phase 2. The specification permits development seed data but does not require particular fictional event/ticket values, so no business assumptions were introduced.
