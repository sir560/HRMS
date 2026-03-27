CREATE TABLE companies (
    company_id BIGINT NOT NULL AUTO_INCREMENT,
    company_name VARCHAR(150) NOT NULL,
    company_code VARCHAR(50) NOT NULL,
    primary_email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    active BIT NOT NULL DEFAULT b'1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_companies PRIMARY KEY (company_id),
    CONSTRAINT uk_companies_company_code UNIQUE (company_code),
    CONSTRAINT uk_companies_primary_email UNIQUE (primary_email)
);

CREATE TABLE roles (
    role_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_roles PRIMARY KEY (role_id),
    CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT uk_roles_company_name UNIQUE (company_id, role_name)
);

CREATE TABLE users (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active BIT NOT NULL DEFAULT b'1',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT uk_users_company_email UNIQUE (company_id, email)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

CREATE TABLE refresh_tokens (
    refresh_token_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BIT NOT NULL DEFAULT b'0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (refresh_token_id),
    CONSTRAINT fk_refresh_tokens_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT uk_refresh_tokens_token UNIQUE (token)
);

CREATE INDEX idx_roles_company_id ON roles (company_id);
CREATE INDEX idx_users_company_id ON users (company_id);
CREATE INDEX idx_users_company_email ON users (company_id, email);
CREATE INDEX idx_refresh_tokens_company_user ON refresh_tokens (company_id, user_id);