CREATE TABLE admins (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_login_at TIMESTAMP(6) NULL,
    CONSTRAINT pk_admins PRIMARY KEY (id),
    CONSTRAINT uq_admins_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    mobile VARCHAR(32) NOT NULL,
    email VARCHAR(254) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_customers PRIMARY KEY (id),
    INDEX idx_customers_mobile (mobile),
    INDEX idx_customers_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ticket_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(500) NULL,
    price DECIMAL(12,2) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_ticket_categories PRIMARY KEY (id),
    CONSTRAINT uq_ticket_categories_name UNIQUE (name),
    CONSTRAINT chk_ticket_categories_price CHECK (price >= 0),
    CONSTRAINT chk_ticket_categories_total_qty CHECK (total_quantity >= 0),
    CONSTRAINT chk_ticket_categories_available_qty CHECK (available_quantity >= 0),
    CONSTRAINT chk_ticket_categories_inventory CHECK (available_quantity <= total_quantity),
    INDEX idx_ticket_categories_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE bookings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_reference VARCHAR(40) NOT NULL,
    customer_id BIGINT NOT NULL,
    booking_status VARCHAR(32) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    expires_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_bookings PRIMARY KEY (id),
    CONSTRAINT uq_bookings_reference UNIQUE (booking_reference),
    CONSTRAINT chk_bookings_total_amount CHECK (total_amount >= 0),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    INDEX idx_bookings_customer (customer_id),
    INDEX idx_bookings_status (booking_status),
    INDEX idx_bookings_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE booking_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    ticket_category_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_booking_items PRIMARY KEY (id),
    CONSTRAINT chk_booking_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_booking_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_booking_items_subtotal CHECK (subtotal >= 0),
    CONSTRAINT fk_booking_items_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_booking_items_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT uq_booking_items_booking_category UNIQUE (booking_id, ticket_category_id),
    INDEX idx_booking_items_category (ticket_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    gateway_order_id VARCHAR(128) NULL,
    gateway_payment_id VARCHAR(128) NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    payment_status VARCHAR(32) NOT NULL,
    paid_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT uq_payments_gateway_order UNIQUE (gateway_order_id),
    CONSTRAINT uq_payments_gateway_payment UNIQUE (gateway_payment_id),
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tickets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    booking_item_id BIGINT NOT NULL,
    qr_token VARCHAR(128) NOT NULL,
    qr_status VARCHAR(24) NOT NULL,
    issued_at TIMESTAMP(6) NULL,
    used_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_tickets PRIMARY KEY (id),
    CONSTRAINT uq_tickets_qr_token UNIQUE (qr_token),
    CONSTRAINT fk_tickets_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_tickets_booking_item FOREIGN KEY (booking_item_id) REFERENCES booking_items (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    INDEX idx_tickets_booking (booking_id),
    INDEX idx_tickets_booking_item (booking_item_id),
    INDEX idx_tickets_status (qr_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE entry_scans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT NOT NULL,
    scanned_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    scanner_id VARCHAR(100) NULL,
    result VARCHAR(32) NOT NULL,
    CONSTRAINT pk_entry_scans PRIMARY KEY (id),
    CONSTRAINT fk_entry_scans_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    INDEX idx_entry_scans_ticket (ticket_id),
    INDEX idx_entry_scans_scanned_at (scanned_at),
    INDEX idx_entry_scans_scanner (scanner_id),
    INDEX idx_entry_scans_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_type VARCHAR(32) NOT NULL,
    actor_id BIGINT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NULL,
    entity_id BIGINT NULL,
    details JSON NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    INDEX idx_audit_logs_actor (actor_id),
    INDEX idx_audit_logs_entity (entity_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
