# Database Architecture

The project uses MySQL 8.x. The backend owns database credentials and database access.

## Core tables

- `events`
- `ticket_categories`
- `bookings`
- `payments`
- `qr_tickets`
- `gallery`
- `sponsors`
- `inquiries`
- `admin_users`
- `admin_sessions`

Migration bookkeeping is stored in `schema_migrations`.

## Booking relationships

```text
 events
   |
   └── ticket_categories
          |
          └── bookings
                 ├── payments
                 └── qr_tickets

 admin_users
      |
      └── admin_sessions
```

The remaining tables remain logically separate because later feature phases will define their operational relationships.

## Phase 5 booking change

`002_booking_idempotency.sql` adds a nullable, unique `bookings.idempotency_key` column.

This is required to make repeated public booking requests safe when a customer double-clicks, retries after a network timeout, or submits the same request again. A null value is allowed for legacy/manual records; public booking creation supplies an idempotency key.

The existing `bookings.booking_status = 'pending'` remains the pre-payment state and is documented by the API as **PENDING_PAYMENT**. The migration does not change the existing status constraint because `pending` already represents the required pre-payment lifecycle state.

## Phase 8 admin authentication change

`003_admin_auth_sessions.sql` adds the server-side session table required by the Phase 8 authentication strategy.

The existing `admin_users` table already contains:

- `username`
- `email`
- `password_hash`
- `is_active`
- `last_login_at`

It does not contain session token state, expiration, or revocation fields. A separate `admin_sessions` table therefore provides:

- `admin_user_id` foreign key
- SHA-256 hash of the opaque session token
- explicit `expires_at`
- explicit `revoked_at`
- unique session-token hash
- lookup indexes for administrator, expiration, and revocation state

The raw session token is never stored in MySQL.

Existing migrations are not modified.

## Integrity decisions

- Primary keys use unsigned `BIGINT` values to leave room for growth.
- Monetary values use `DECIMAL(12,2)` rather than floating point.
- Booking identifiers and QR identifiers are unique.
- Booking idempotency keys are unique when supplied.
- Payment idempotency keys are unique when supplied.
- Payment gateway references are unique per provider when supplied.
- Admin session token hashes are unique.
- Foreign keys use `ON UPDATE RESTRICT` and appropriate delete behavior so operational history is not removed accidentally.
- Booking, payment, ticket, gallery, sponsor, inquiry, and admin statuses use constrained string values rather than application-only conventions.
- A booking may have multiple QR tickets; the requirements do not define a one-QR-per-booking rule.

## Inventory limitation

`ticket_categories` currently contains `availability_status`, but no numeric capacity, quota, remaining-count, or reservation-expiry field is defined by the source requirements.

Phase 5 therefore does not invent inventory quantities and does not claim finite inventory enforcement. Booking creation locks the selected category row while checking its current availability status and writing the booking. A true remaining-ticket/overselling model requires an organizer-defined numeric inventory rule in a later phase.

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

The commands require:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

The database itself must exist before running migrations. The migration runner creates application tables and migration bookkeeping; it does not create a server/database account.

## Migration approach

`backend/src/database/migrator.js` discovers SQL files in `database/migrations`, sorts them lexically, and records applied filenames in `schema_migrations`.

Existing migrations must not be edited after being treated as applied. New changes use incremented filenames such as:

```text
002_booking_idempotency.sql
003_admin_auth_sessions.sql
004_future_change.sql
```

## Seed data

The development seed does not create a default administrator and does not contain a default admin password. Use the explicit `npm --workspace backend run admin:create` bootstrap command with environment-provided credentials for development or controlled operational setup.
