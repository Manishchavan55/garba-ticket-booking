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

On first startup, Flyway applies `V1__initial_schema.sql`. Future schema changes must use a new immutable migration such as `V2__...sql` rather than editing an applied migration.

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

Module 2 implementation is committed to its feature branch but local MySQL/Flyway/JPA execution is **NOT VERIFIED — requires local execution**.
