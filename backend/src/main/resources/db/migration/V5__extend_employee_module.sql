CREATE TABLE designations (
    designation_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    designation_name VARCHAR(120) NOT NULL,
    designation_code VARCHAR(40) NOT NULL,
    description VARCHAR(255),
    active BIT NOT NULL DEFAULT b'1',
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_designations PRIMARY KEY (designation_id),
    CONSTRAINT fk_designations_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT uk_designations_company_code UNIQUE (company_id, designation_code),
    CONSTRAINT uk_designations_company_name UNIQUE (company_id, designation_name)
);

ALTER TABLE employees
    ADD COLUMN designation_id BIGINT NULL AFTER department_id,
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

INSERT INTO designations (company_id, designation_name, designation_code, description, active, created_at, updated_at)
SELECT e.company_id,
       e.designation,
       CONCAT('DSG-', e.company_id, '-', MIN(e.employee_id)),
       CONCAT('Migrated from existing employee designation: ', e.designation),
       b'1',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM employees e
GROUP BY e.company_id, e.designation;

UPDATE employees e
JOIN designations d
  ON d.company_id = e.company_id
 AND d.designation_name = e.designation
SET e.designation_id = d.designation_id;

ALTER TABLE employees
    MODIFY COLUMN designation_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_employees_designation FOREIGN KEY (designation_id) REFERENCES designations (designation_id);

CREATE INDEX idx_designations_company_id ON designations (company_id);
CREATE INDEX idx_designations_deleted_at ON designations (deleted_at);
CREATE INDEX idx_employees_designation_id ON employees (designation_id);
CREATE INDEX idx_employees_deleted_at ON employees (deleted_at);
