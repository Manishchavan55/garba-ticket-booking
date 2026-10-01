-- KESARIYA Dandiya Nights
-- Phase 5: public booking request idempotency.
-- One idempotency key represents one client booking-creation attempt.

ALTER TABLE bookings
  ADD COLUMN idempotency_key VARCHAR(191) NULL,
  ADD UNIQUE KEY uq_bookings_idempotency_key (idempotency_key);
