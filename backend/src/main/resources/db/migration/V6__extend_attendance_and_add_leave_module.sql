ALTER TABLE attendance
    ADD COLUMN work_from_home BIT NOT NULL DEFAULT b'0' AFTER attendance_status;

UPDATE attendance
SET attendance_status = 'PRESENT'
WHERE attendance_status IN ('CLOCKED_IN', 'CLOCKED_OUT');

CREATE TABLE leave_types (
    leave_type_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    leave_code VARCHAR(20) NOT NULL,
    leave_name VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    default_days INT NOT NULL,
    active BIT NOT NULL DEFAULT b'1',
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_leave_types PRIMARY KEY (leave_type_id),
    CONSTRAINT fk_leave_types_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT uk_leave_types_company_code UNIQUE (company_id, leave_code),
    CONSTRAINT uk_leave_types_company_name UNIQUE (company_id, leave_name)
);

CREATE TABLE leave_requests (
    leave_request_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL,
    review_comment VARCHAR(255),
    manager_reviewed_at TIMESTAMP NULL,
    hr_reviewed_at TIMESTAMP NULL,
    admin_reviewed_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_leave_requests PRIMARY KEY (leave_request_id),
    CONSTRAINT fk_leave_requests_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id),
    CONSTRAINT fk_leave_requests_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types (leave_type_id)
);

INSERT INTO leave_types (company_id, leave_code, leave_name, description, default_days, active, created_at, updated_at)
SELECT c.company_id, 'CL', 'Casual Leave', 'Casual leave allocation', 12, b'1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM leave_types lt WHERE lt.company_id = c.company_id AND lt.leave_code = 'CL'
);

INSERT INTO leave_types (company_id, leave_code, leave_name, description, default_days, active, created_at, updated_at)
SELECT c.company_id, 'SL', 'Sick Leave', 'Medical or sick leave allocation', 10, b'1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM leave_types lt WHERE lt.company_id = c.company_id AND lt.leave_code = 'SL'
);

INSERT INTO leave_types (company_id, leave_code, leave_name, description, default_days, active, created_at, updated_at)
SELECT c.company_id, 'EL', 'Earned Leave', 'Earned leave allocation', 15, b'1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM leave_types lt WHERE lt.company_id = c.company_id AND lt.leave_code = 'EL'
);

CREATE INDEX idx_attendance_work_from_home ON attendance (work_from_home);
CREATE INDEX idx_leave_types_company_id ON leave_types (company_id);
CREATE INDEX idx_leave_requests_company_id ON leave_requests (company_id);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests (employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests (status);
