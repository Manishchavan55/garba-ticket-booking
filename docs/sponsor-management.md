# Sponsor Management

## Source-supported scope

The project requirements identify sponsor details, logos, and inquiry information and provide a `sponsors` table for future sponsor management. The existing schema is sufficient, so this workstream adds no migration and no storage/upload provider.

## API

Public:
- `GET /api/sponsors` — returns active sponsors with public fields only: `name` and `logo_url`.

Admin (protected by `authenticateAdmin` then `authorizeAdmin`):
- `GET /api/admin/sponsors`
- `GET /api/admin/sponsors/:id`
- `POST /api/admin/sponsors`
- `PATCH /api/admin/sponsors/:id`
- `DELETE /api/admin/sponsors/:id`

Admin records include `name`, `logo_url`, `inquiry_information`, `is_active`, and timestamps.

## Conservative assumptions

- `is_active` controls public publication because it is the existing schema field for active state.
- No tier, ranking, display priority, approval workflow, or logo-dimension rules are implemented because the requirements do not define them.
- `logo_url` is URL-based; no file-upload or storage provider is introduced.
- Public responses omit `inquiry_information` and internal identifiers because the requirements do not require them to be public.
- DELETE is a hard delete. The sponsors table has no dependent foreign keys, and the requirements do not define a separate soft-delete workflow. Administrators can instead use `is_active: false` when the sponsor should remain stored but unpublished.
- Public ordering is ascending database ID because no organizer-defined ordering is specified.
