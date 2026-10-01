# Phase 1 Architecture Notes

## Responsibilities

- `frontend/`: browser-facing React application. It contains no database credentials or server secrets.
- `backend/`: Express API, configuration, middleware, service/controller boundaries, and MySQL connection layer.
- `database/`: database foundation notes only; no business schema in Phase 1.

## Request flow

```text
Browser -> React -> API client -> Express route -> controller -> service -> database layer
```

The health endpoint is intentionally lightweight and does not depend on MySQL. A dedicated database check verifies real connectivity when credentials and a reachable MySQL server are available.
