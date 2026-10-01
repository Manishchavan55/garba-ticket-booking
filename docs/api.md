# Backend API Foundation

## Base URL

Local development defaults to:

```text
http://localhost:8080/api
```

## Current endpoints

### `GET /health`

Reports application-process health only. It does not query MySQL.

Success response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "kesariya-api"
  }
}
```

### `GET /health/ready`

Reports dependency readiness and currently verifies MySQL with `SELECT 1`.

Success response:

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "service": "kesariya-api",
    "dependencies": {
      "mysql": "ok"
    }
  }
}
```

A database failure is returned as a structured service error; the endpoint does not expose SQL details or credentials.

## Response convention

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

API errors do not expose stack traces, SQL errors, environment variables, filesystem paths, credentials, or secrets.

## Status code conventions

- `200` successful request
- `400` malformed or invalid request
- `404` unknown API route/resource
- `409` resource conflict
- `413` request body too large
- `415` is reserved for unsupported media types; current request validation reports invalid content type as a validation error
- `500` unexpected internal error
- `503` database/service dependency unavailable

## Configuration

Backend configuration is server-side only. Copy `backend/.env.example` to `backend/.env` and provide local values. Database credentials must never be placed in frontend environment variables.

Important settings include `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `REQUEST_BODY_LIMIT`, and the `DB_*` variables.

## Development

```bash
npm install
npm --workspace backend run dev
```

## Tests and lint

```bash
npm --workspace backend test
npm --workspace backend run lint
```

The frontend can be validated from the workspace with:

```bash
npm --workspace frontend run lint
npm --workspace frontend run build
```

## Database commands

Existing Phase 2 commands remain unchanged:

```bash
npm run db:check
npm run db:migrate
npm run db:validate
npm run db:seed
```

Phase 3 adds only backend infrastructure. No event, ticket, booking, payment, QR, admin, gallery, sponsor, inquiry, reporting, email, WhatsApp, or Maps business APIs exist yet.
