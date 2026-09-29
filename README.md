# Garba Ticket Booking System

Production-oriented Garba ticket booking platform.

## Structure

- `backend/` — Spring Boot REST API
- `frontend/` — React + Vite application

## Module 1

Module 1 establishes the project structure, backend health API, React frontend, and local development workflow.

## Prerequisites

- Java 17+
- Maven 3.6.3+
- Node.js LTS
- npm
- MySQL for later modules

## Backend

```powershell
cd backend
mvn clean test
mvn spring-boot:run
```

Health endpoint:

```text
GET http://localhost:8080/api/health
```

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

Copy `.env.example` to a local `.env` only when configuration is needed. Never commit secrets or secret-bearing environment files.

## Verification status

Module 1 code is committed to GitHub. Local STS/React IDE execution is not performed by this repository integration and must be verified in the local development environment.
