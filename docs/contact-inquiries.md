# Contact / Inquiries

## Implemented endpoints

Public:
- `POST /api/inquiries`

Admin (existing `authenticateAdmin` -> `authorizeAdmin`):
- `GET /api/admin/inquiries`
- `GET /api/admin/inquiries/:id`
- `PATCH /api/admin/inquiries/:id`
- `DELETE /api/admin/inquiries/:id`

## Schema fields used

The existing `inquiries` table is used without a migration:
- `name` VARCHAR(160), required
- `email` VARCHAR(254), required
- `phone` VARCHAR(40), optional
- `message` TEXT, required
- `inquiry_status` VARCHAR(20), existing values `new`, `in_progress`, `resolved`, `closed`
- database-managed `id`, `created_at`, `updated_at`

Public submission never accepts or returns database-managed IDs/timestamps.

## Behavior

Public submissions trim text, validate required fields and email format, enforce schema column lengths, and use parameterized SQL.

Administrators can list and inspect inquiries, update only the existing `inquiry_status` field, and delete inquiries. No new inquiry workflow or status values are introduced.

## Conservative assumptions

- The source requires contact/inquiry functionality but does not define a separate public inquiry acknowledgement identifier, so the public success response contains only `{ submitted: true }`.
- The existing schema defines the status vocabulary, so those values are the only administrator status choices.
- No migration, captcha, OTP, attachments, email, WhatsApp, CRM, spam scoring, priority, assignment, or internal-note functionality is added.
- Public navigation links Contact alongside the existing Gallery and Sponsors links.

## Explicitly deferred

Email/WhatsApp notifications and other external communication are not implemented because they are separate/unspecified workstreams. No changes were made to payments, bookings, sponsors, gallery, QR operations, or authentication.
