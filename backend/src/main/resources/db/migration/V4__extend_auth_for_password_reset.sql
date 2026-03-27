ALTER TABLE users
    ADD COLUMN password_reset_otp VARCHAR(12) NULL,
    ADD COLUMN password_reset_expires_at TIMESTAMP NULL;