-- Development-only seed data. No real customer, payment, or admin credentials.
INSERT INTO events (name, event_date, start_time, end_time, venue, guidelines)
VALUES ('KESARIYA Dandiya Nights - Development Event', '2030-10-12', '18:00:00', '23:00:00', 'Development Venue', 'Development-only sample event. Replace with organizer-provided details before use.');

INSERT INTO ticket_categories (event_id, name, price, availability_status)
SELECT id, 'General Entry - Development', 499.00, 'available'
FROM events
WHERE name = 'KESARIYA Dandiya Nights - Development Event'
ORDER BY id DESC
LIMIT 1;
