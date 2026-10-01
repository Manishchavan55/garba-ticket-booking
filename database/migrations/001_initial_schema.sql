-- KESARIYA Dandiya Nights
-- Phase 2 initial schema. MySQL 8.x.

CREATE TABLE events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NULL,
  venue VARCHAR(500) NOT NULL,
  guidelines TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_events_date (event_date)
) ENGINE=InnoDB;

CREATE TABLE ticket_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ticket_categories_event_name (event_id, name),
  INDEX idx_ticket_categories_event (event_id),
  CONSTRAINT fk_ticket_categories_event FOREIGN KEY (event_id) REFERENCES events (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_ticket_categories_price CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id VARCHAR(64) NOT NULL,
  ticket_category_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(320) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','confirmed','cancelled','failed','refunded') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_booking_id (booking_id),
  INDEX idx_bookings_ticket_category (ticket_category_id),
  INDEX idx_bookings_status (status),
  CONSTRAINT fk_bookings_ticket_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_bookings_quantity CHECK (quantity > 0),
  CONSTRAINT chk_bookings_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_bookings_total_amount CHECK (total_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(50) NULL,
  transaction_reference VARCHAR(191) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','success','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_transaction_reference (transaction_reference),
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_status (status),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE qr_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id BIGINT UNSIGNED NOT NULL,
  qr_identifier VARCHAR(128) NOT NULL,
  status ENUM('generated','verified','used','invalid') NOT NULL DEFAULT 'generated',
  verified_at TIMESTAMP NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_tickets_identifier (qr_identifier),
  INDEX idx_qr_tickets_booking (booking_id),
  INDEX idx_qr_tickets_status (status),
  CONSTRAINT fk_qr_tickets_booking FOREIGN KEY (booking_id) REFERENCES bookings (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE gallery (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NULL,
  media_type ENUM('image','video') NOT NULL,
  media_url VARCHAR(2048) NOT NULL,
  caption TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_gallery_published (is_published),
  INDEX idx_gallery_media_type (media_type)
) ENGINE=InnoDB;

CREATE TABLE sponsors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(2048) NULL,
  inquiry_info TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sponsors_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE inquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(30) NULL,
  message TEXT NOT NULL,
  status ENUM('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_inquiries_status (status),
  INDEX idx_inquiries_email (email)
) ENGINE=InnoDB;

CREATE TABLE admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_username (username),
  UNIQUE KEY uq_admin_users_email (email),
  INDEX idx_admin_users_active (is_active)
) ENGINE=InnoDB;
