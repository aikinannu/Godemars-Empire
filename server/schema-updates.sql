-- Database schema additions for Phase 2 features
-- Email verification, 2FA, OAuth, and security enhancements

-- Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Add email_verified flag to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Two-Factor Authentication Settings Table
CREATE TABLE IF NOT EXISTS two_factor_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  method VARCHAR(20), -- 'authenticator', 'sms', 'email', 'backup'
  authenticator_secret VARCHAR(255),
  authenticator_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  backup_codes_generated_at TIMESTAMP,
  backup_codes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- Backup Codes Table
CREATE TABLE IF NOT EXISTS backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_code (code)
);

-- OAuth Profiles Table (for social login linking)
CREATE TABLE IF NOT EXISTS oauth_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', 'microsoft', 'facebook'
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  picture_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  UNIQUE KEY unique_provider (user_id, provider),
  INDEX idx_provider_id (provider, provider_id),
  INDEX idx_user_id (user_id)
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Login Activity Log Table (for security tracking)
CREATE TABLE IF NOT EXISTS login_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  status VARCHAR(20), -- 'success', 'failed', 'blocked'
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  location VARCHAR(255),
  failed_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_ip_address (ip_address)
);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE, -- email, IP, user_id
  attempts INT DEFAULT 0,
  last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked_until TIMESTAMP,
  reason VARCHAR(100), -- 'login', 'signup', 'password_reset'
  INDEX idx_key (key),
  INDEX idx_blocked_until (blocked_until)
);

-- Security Events Log (for audit trail)
CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50), -- '2fa_enabled', '2fa_disabled', 'password_changed', 'email_changed', 'device_blocked'
  event_data JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
);

-- Sessions Table (for token management)
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Create indexes on refresh_tokens for better performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_id ON refresh_tokens(device_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_ip ON refresh_tokens(ip_address);

-- Add analytics columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Create view for active users (helpful for analytics)
CREATE OR REPLACE VIEW active_users AS
SELECT 
  u.id,
  u.email,
  u.username,
  u.created_at,
  u.last_login_at,
  u.login_count,
  u.email_verified,
  ts.enabled as two_factor_enabled,
  op.provider,
  COUNT(rt.id) as active_sessions
FROM users u
LEFT JOIN two_factor_settings ts ON u.id = ts.user_id
LEFT JOIN oauth_profiles op ON u.id = op.user_id
LEFT JOIN refresh_tokens rt ON u.id = rt.user_id AND rt.revoked = FALSE
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.username, u.created_at, u.last_login_at, u.login_count, u.email_verified, ts.enabled, op.provider;
