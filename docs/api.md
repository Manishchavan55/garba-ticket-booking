# Backend API

## Base URL

Local development defaults to:

```text
http://localhost:8080/api
```

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

## Health

### `GET /health`

Reports application-process health only. It does not query MySQL.

### `GET /health/ready`

Reports dependency readiness and verifies MySQL with `SELECT 1`.

## Public event API

### `GET /events`

Returns public event records using only fields intended for the public website.

Success data contains:

```json
[
  {
    "id": 1,
    "name": "Event name",
    "event_date": "2030-10-12",
    "start_time": "18:00:00",
    "end_time": "23:00:00",
    "venue": "Venue name",
    "guidelines": "Public guidelines"
  }
]
```

### `GET /events/:id`

Path parameter:

- `id` — positive integer event identifier

Returns one public event. A missing event returns `404` with `NOT_FOUND`. A malformed identifier returns `400` with `INVALID_ID`.

### `GET /events/:eventId/ticket-categories`

Path parameter:

- `eventId` — positive integer event identifier

Returns public ticket-category information:

```json
[
  {
    "name": "General Entry",
    "price": "499.00",
    "availability_status": "available"
  }
]
```

No quantity, reservation, booking, inventory calculation, payment, or customer information is exposed or processed by this endpoint.

A nonexistent event returns `404` with `NOT_FOUND`. A malformed identifier returns `400` with `INVALID_ID`.

## Public API security boundary

Public event endpoints do not expose customer, payment, admin, credential, or internal operational fields. Event IDs are exposed only because they are required to address the public event detail route.

## Status code conventions

- `200` successful request
- `400` malformed or invalid request
- `404` unknown API route/resource
- `409` resource conflict
- `413` request body too large
- `500` unexpected internal error
- `503` database/service dependency unavailable

## Configuration

Backend configuration is server-side only. Copy `backend/.env.example` to `backend/.env` and provide local values. Database credentials must never be placed in frontend environment variables.

## Development

```bash
npm install
npm --workspace backend run dev
npm --workspace frontend run dev
```

## Tests and lint

```bash
npm --workspace backend test
npm --workspace backend run lint
npm --workspace frontend run lint
npm --workspace frontend run build
```

## Database commands

```bash
npm run db:check
npm run db:migrate
npm run db:validate
npm run db:seed
```

The Phase 2 schema is unchanged by Phase 4. No booking, payment, QR, admin, gallery, sponsor, inquiry, reporting, email, WhatsApp, or Maps business APIs exist yet.
