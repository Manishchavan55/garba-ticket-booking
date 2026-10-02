# Production / UAT Readiness Checklist

This document covers deployment configuration and UAT for the functionality already implemented in KESARIYA Dandiya Nights. It does not define new product functionality.

## 1. Production environment checklist

### Frontend

Set the frontend build variable:

```text
VITE_API_BASE_URL=https://<production-api-host>/api
```

Do not place database, PhonePe, webhook, or admin credentials in Vite variables. Values prefixed with `VITE_` are exposed to the browser bundle.

### Backend

Set:

```text
NODE_ENV=production
PORT=<internal-api-port>
CORS_ORIGIN=https://<production-frontend-host>
REQUEST_BODY_LIMIT=1mb
```

`CORS_ORIGIN` may contain comma-separated origins, but every production origin must use HTTPS.

### MySQL

Provide production-only values:

```text
DB_HOST=<production-db-host>
DB_PORT=3306
DB_NAME=<production-db-name>
DB_USER=<production-db-user>
DB_PASSWORD=<production-db-password>
```

Run migrations against the intended production database before enabling application traffic. Do not edit an already-applied migration.

### PhonePe

The production provider is PhonePe Standard Checkout:

```text
PAYMENT_PROVIDER=phonepe
PHONEPE_ENVIRONMENT=PRODUCTION
PHONEPE_CLIENT_ID=<production-client-id>
PHONEPE_CLIENT_SECRET=<production-client-secret>
PHONEPE_CLIENT_VERSION=<production-client-version>
PHONEPE_REDIRECT_URL=https://<production-frontend-host>/payment/result
PHONEPE_WEBHOOK_USERNAME=<configured-webhook-username>
PHONEPE_WEBHOOK_PASSWORD=<configured-webhook-password>
```

Production startup fails closed if `PHONEPE_ENVIRONMENT` is not `PRODUCTION`, if the redirect URL is not HTTPS, or if a configured CORS origin is not HTTPS.

PhonePe production merchant enablement and the provider-side redirect/webhook configuration must be completed by the operator. Do not use sandbox credentials in production.

### Admin bootstrap

The repository does not create a default production administrator through migrations or seed data.

Create the controlled account only after production configuration is present:

```bash
npm --workspace backend run admin:create
```

The production process additionally requires:

```text
ADMIN_BOOTSTRAP_CONFIRM=CREATE_ADMIN
```

The password must be supplied through the backend environment and must contain at least 12 characters. Do not commit the credential or place it in frontend configuration.

After the account is created, remove the bootstrap environment values from the long-lived runtime configuration where the deployment platform permits this.

## 2. Database procedure

The migration command is:

```bash
npm run db:migrate
```

Current migrations:

```text
001_initial_schema.sql
002_booking_idempotency.sql
003_admin_auth_sessions.sql
```

The migrator records applied filenames in `schema_migrations` and skips migrations already recorded there. Migrations are append-only. Back up the production database and apply migrations during a controlled maintenance/deployment step; the application does not automatically run migrations when the API starts.

Validate the resulting schema with:

```bash
npm run db:validate
```

Check connectivity with:

```bash
npm run db:check
```

## 3. Health/readiness verification

```text
GET /api/health
GET /api/health/ready
```

`/api/health` verifies application-process health. `/api/health/ready` executes `SELECT 1` against MySQL and therefore verifies database readiness.

Expected successful responses use the repository's normal success response shape. A readiness/database failure must not be represented as a successful ready response.

## 4. Security checks before launch

- Verify `.env` files are not committed.
- Verify production secrets exist only in the backend/runtime secret store.
- Verify no `VITE_` variable contains a backend/payment secret.
- Verify `CORS_ORIGIN` is the exact production frontend origin(s).
- Verify HTTPS/TLS is terminated and enforced by the deployment/reverse proxy.
- Verify admin session cookies are therefore emitted with `Secure` in production.
- Verify production PhonePe configuration uses `PRODUCTION`, not `SANDBOX`.
- Verify PhonePe credentials and webhook credentials are not present in source control.
- Verify no default admin account is created by migration or seed.

## 5. UAT test plan

Perform these tests against the UAT/sandbox environment first. Production payment tests require the organizer/operator to complete PhonePe production enablement.

### Application and database

1. `GET /api/health` returns HTTP 200 and `status=ok`.
2. `GET /api/health/ready` returns HTTP 200 and MySQL `ok` with a valid database.
3. Stop/break database connectivity and confirm readiness does not report `ready`.
4. Apply migrations to a clean UAT database and run `db:validate`.
5. Re-run `db:migrate` and confirm already-applied migrations are skipped.

### Public event/ticket flow

1. Load the public event list.
2. Open an event.
3. Confirm ticket categories, price, and availability are displayed.
4. Confirm malformed/nonexistent identifiers return the expected validation/not-found response.

### Booking

1. Create a booking with valid event/category/customer data.
2. Confirm the backend calculates the authoritative amount.
3. Retry with the same `Idempotency-Key` and confirm no duplicate booking is created.
4. Try an event/category ownership mismatch and confirm rejection.
5. Confirm client-supplied price/total values cannot override the database amount.

### PhonePe UAT

1. Initiate payment for a valid pending booking.
2. Confirm the browser receives a PhonePe checkout URL rather than a locally asserted success state.
3. Complete a successful PhonePe sandbox payment.
4. Verify payment server-side.
5. Confirm amount, currency, provider, and transaction reference are validated.
6. Repeat verification and confirm idempotent behavior.
7. Exercise a failed/cancelled provider outcome and confirm the booking is not confirmed and tickets are not issued.
8. Exercise the authenticated webhook with the supported callback event variants and identifier forms.
9. Send an invalid webhook authorization value and confirm rejection.
10. Send an invalid amount/reference and confirm rejection.

### Ticket / QR

1. After one genuinely verified successful payment, confirm the expected number of QR tickets is issued.
2. Confirm QR identifiers do not contain customer/payment secrets.
3. Verify a valid unused QR and confirm entry is accepted.
4. Verify the same QR again and confirm it is rejected as already used.
5. Verify an unknown QR and confirm rejection.
6. Confirm an unpaid/invalid booking cannot produce an accepted venue entry.

### Admin

1. Login with the controlled UAT administrator.
2. Confirm the browser receives only the HttpOnly session cookie.
3. Confirm unauthenticated admin requests return 401.
4. Confirm authenticated admin access works.
5. Logout and confirm the session is revoked.
6. Confirm expired/revoked sessions cannot access admin APIs.
7. Exercise event/category CRUD within the existing safety rules.
8. Review bookings and payments without modifying financial history.
9. Exercise QR venue verification and duplicate-use rejection.
10. Exercise gallery, sponsor, and inquiry administration.

### Frontend

Verify on supported desktop and mobile/tablet browsers:

- public navigation;
- event/ticket pages;
- booking states;
- payment redirect/result handling;
- gallery/sponsors/contact pages;
- admin login and protected routes;
- loading, empty, validation, error, and success states;
- keyboard navigation and form labels;
- responsive layout.

## 6. Live verification boundary

Code and CI can verify application behavior without production credentials, but they cannot prove a real production payment, production webhook delivery, production TLS configuration, or production MySQL availability.

A real production payment must only be claimed after an actual PhonePe production transaction has completed and the corresponding server-side verification/webhook path has been observed.
