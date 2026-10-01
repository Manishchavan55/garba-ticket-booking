-- Phase 8 admin authentication sessions.
-- The existing admin_users table stores account identity and password hashes, but
-- it has no server-side session state. Opaque session tokens are hashed before
-- persistence so logout and expiration can invalidate authentication server-side.

CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NOT NULL,
  session_token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_sessions_token_hash (session_token_hash),
  INDEX idx_admin_sessions_admin_user (admin_user_id),
  INDEX idx_admin_sessions_expires (expires_at),
  INDEX idx_admin_sessions_revoked (revoked_at),
  CONSTRAINT fk_admin_sessions_admin_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;
