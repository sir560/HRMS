CREATE TABLE departments (
    department_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    department_name VARCHAR(120) NOT NULL,
    department_code VARCHAR(40) NOT NULL,
    description VARCHAR(255),
    active BIT NOT NULL DEFAULT b'1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_departments PRIMARY KEY (department_id),
    CONSTRAINT fk_departments_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT uk_departments_company_code UNIQUE (company_id, department_code),
    CONSTRAINT uk_departments_company_name UNIQUE (company_id, department_name)
);

CREATE TABLE employees (
    employee_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    employee_code VARCHAR(40) NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    designation VARCHAR(120) NOT NULL,
    date_of_joining DATE NOT NULL,
    employment_status VARCHAR(30) NOT NULL,
    active BIT NOT NULL DEFAULT b'1',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_employees PRIMARY KEY (employee_id),
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments (department_id),
    CONSTRAINT uk_employees_company_code UNIQUE (company_id, employee_code),
    CONSTRAINT uk_employees_company_email UNIQUE (company_id, email)
);

CREATE INDEX idx_departments_company_id ON departments (company_id);
CREATE INDEX idx_employees_company_id ON employees (company_id);
CREATE INDEX idx_employees_department_id ON employees (department_id);
CREATE INDEX idx_employees_company_department ON employees (company_id, department_id);