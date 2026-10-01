CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  venue VARCHAR(255) NOT NULL,
  guidelines TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_events_date (event_date),
  INDEX idx_events_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ticket_categories_event_name (event_id, name),
  INDEX idx_ticket_categories_event (event_id),
  INDEX idx_ticket_categories_status (availability_status),
  CONSTRAINT chk_ticket_categories_price_nonnegative CHECK (price >= 0),
  CONSTRAINT chk_ticket_categories_status CHECK (availability_status IN ('available', 'unavailable')),
  CONSTRAINT fk_ticket_categories_event FOREIGN KEY (event_id) REFERENCES events (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id VARCHAR(40) NOT NULL,
  ticket_category_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  booking_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_booking_id (booking_id),
  INDEX idx_bookings_ticket_category (ticket_category_id),
  INDEX idx_bookings_status (booking_status),
  INDEX idx_bookings_created_at (created_at),
  CONSTRAINT chk_bookings_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_bookings_subtotal_nonnegative CHECK (subtotal_amount >= 0),
  CONSTRAINT chk_bookings_total_nonnegative CHECK (total_amount >= 0),
  CONSTRAINT chk_bookings_status CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'failed')),
  CONSTRAINT fk_bookings_ticket_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(60) NULL,
  gateway_transaction_reference VARCHAR(191) NULL,
  idempotency_key VARCHAR(191) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_idempotency_key (idempotency_key),
  UNIQUE KEY uq_payments_provider_reference (provider, gateway_transaction_reference),
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_status (payment_status),
  INDEX idx_payments_reference (gateway_transaction_reference),
  CONSTRAINT chk_payments_amount_nonnegative CHECK (amount >= 0),
  CONSTRAINT chk_payments_status CHECK (payment_status IN ('pending', 'successful', 'failed', 'cancelled', 'refunded')),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS qr_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  qr_identifier VARCHAR(191) NOT NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unused',
  verified_at TIMESTAMP NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_tickets_identifier (qr_identifier),
  INDEX idx_qr_tickets_booking (booking_id),
  INDEX idx_qr_tickets_status (verification_status),
  INDEX idx_qr_tickets_used_at (used_at),
  CONSTRAINT chk_qr_tickets_status CHECK (verification_status IN ('unused', 'used', 'invalid')),
  CONSTRAINT fk_qr_tickets_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gallery (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NULL,
  media_type VARCHAR(20) NOT NULL,
  media_url VARCHAR(2048) NOT NULL,
  alt_text VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_gallery_media_type (media_type),
  INDEX idx_gallery_active (is_active),
  CONSTRAINT chk_gallery_media_type CHECK (media_type IN ('image', 'video'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sponsors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  logo_url VARCHAR(2048) NULL,
  inquiry_information TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sponsors_active (is_active),
  INDEX idx_sponsors_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NULL,
  message TEXT NOT NULL,
  inquiry_status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_inquiries_status (inquiry_status),
  INDEX idx_inquiries_created_at (created_at),
  CONSTRAINT chk_inquiries_status CHECK (inquiry_status IN ('new', 'in_progress', 'resolved', 'closed'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_username (username),
  UNIQUE KEY uq_admin_users_email (email),
  INDEX idx_admin_users_active (is_active)
) ENGINE=InnoDB;
