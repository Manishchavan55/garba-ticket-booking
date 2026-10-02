# Gallery Management

## Phase scope

Gallery management uses the existing `gallery` table and `media_url` field. No file upload or storage provider is introduced because the requirements explicitly defer file-upload functionality.

## Supported records

The existing schema supports `image` and `video` media types, optional `title` and `alt_text`, a `media_url`, and `is_active`.

Public gallery output contains active records only. Administrator APIs can list, create, retrieve, update, and delete gallery records and can change `is_active`.

## Conservative assumptions

- No display-order field or ordering business rule is introduced; records are returned by ascending database ID.
- No external storage provider or upload workflow is introduced.
- The existing `media_url` is treated as an opaque URL string subject to the database's 2048-character limit; the source does not define host, scheme, or media-format restrictions.
- `is_active` controls public visibility.
- Delete is a database-row delete because the source/schema do not define soft-delete semantics and gallery records have no dependent foreign keys. This does not affect booking, payment, or QR history.
