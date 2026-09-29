# Garba Ticket Booking System

Production-oriented Garba ticket booking platform.

## Structure

- `backend/` — Spring Boot REST API
- `frontend/` — React + Vite application

## Module 1

Module 1 establishes the project structure, backend health API, React frontend, and local development workflow.

## Module 2 — Database + Flyway

Module 2 establishes the MySQL database foundation, Flyway schema migration, and JPA entity model for:

- admins
- customers
- ticket_categories
- bookings
- booking_items
- payments
- tickets
- entry_scans
- audit_logs

Flyway owns schema evolution and Hibernate is configured with `ddl-auto=validate`; Hibernate must not create or modify the production schema.

## Module 3 — Admin Authentication

Module 3 uses stateless JWT bearer authentication for the REST API.

- `POST /api/auth/login` — public admin login
- `POST /api/auth/logout` — authenticated client-side logout acknowledgement; a stateless JWT is not server-side revoked by this endpoint
- `GET /api/admin/me` — protected admin endpoint
- `/api/admin/**` requires an authenticated admin role
- Admin roles are the existing `SUPER_ADMIN`, `ADMIN`, `EVENT_MANAGER`, and `SCANNER` values
- Passwords are hashed with BCrypt and stored in `admins.password_hash`
- JWTs use HS256, require a secret of at least 32 UTF-8 bytes, and contain only issuer, subject, admin id, role, issued-at, and expiry claims
- JWT secrets, database credentials, and other secrets are environment configuration only

### Authentication configuration

```text
JWT_SECRET=<long random secret of at least 32 bytes>
JWT_EXPIRATION=3600
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

The template is `backend/.env.example`. The file is documentation; Spring Boot reads environment variables directly.

### Secure initial admin creation

Module 3 does not seed a production admin and does not provide default credentials. Create the first admin through a controlled administrative/database bootstrap process using a BCrypt hash generated from a securely chosen password. Never insert a plaintext password and never commit the resulting credential to GitHub.

The existing `admins` schema already provides `email`, `password_hash`, `role`, `active`, and audit timestamps, so no schema migration is required for authentication.

## Prerequisites

- Java 17+
- Maven 3.6.3+
- Node.js LTS
- npm
- MySQL 8.0.16+ recommended because the schema uses enforced CHECK constraints

## Backend — Module 1

```powershell
cd backend
mvn clean test
mvn spring-boot:run
```

Health endpoint:

```text
GET http://localhost:8081/api/health
```

## Backend — Module 2 database setup

Create the local database:

```sql
CREATE DATABASE garba_ticket_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Set environment variables in the shell or your IDE launch configuration. Do not commit real credentials.

```text
DB_URL=jdbc:mysql://localhost:3306/garba_ticket_booking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=<your-mysql-username>
DB_PASSWORD=<your-mysql-password>
```

A non-secret template is available at `backend/.env.example`. Spring Boot reads the environment variables directly; the `.env.example` file is documentation and is not loaded automatically.

Run the normal build/tests:

```powershell
cd backend
mvn clean test
```

Run the MySQL integration tests after configuring the database:

```powershell
mvn verify -Dskip.integration.tests=false
```

Start the backend:

```powershell
mvn spring-boot:run
```

Flyway applies versioned migrations automatically. Future schema changes must use a new immutable migration rather than editing an applied migration.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The frontend calls the backend health endpoint through Axios.

## Environment

Never commit passwords, API keys, payment secrets, JWT secrets, database passwords, or secret-bearing `.env` files.

## Database design notes

- Monetary values use fixed-precision `DECIMAL(12,2)`.
- Historical booking item prices are stored in `booking_items.unit_price` and are independent of later category-price changes.
- Ticket QR credentials are stored as unique opaque tokens; personal data is not placed in the token.
- Financial and ticket history uses restrictive foreign-key deletion rules instead of cascade deletion.
- `ticket_categories.version` provides an optimistic-locking field for future inventory updates; booking transactions must still perform concurrency-safe inventory checks/updates.
- Timestamps are stored consistently using UTC application timestamps.
- `audit_logs.details` uses MySQL JSON and is not intended for passwords, secrets, tokens, or payment credentials.

## Verification status

Module 2 was locally verified by running the MySQL-backed Maven verification successfully.

Module 3 implementation is **NOT VERIFIED — requires local execution**.
