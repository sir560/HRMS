ALTER TABLE companies
    ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE roles
    ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE users
    ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE refresh_tokens
    ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE user_roles
    ADD COLUMN deleted_at TIMESTAMP NULL;
