CREATE TABLE attendance (
    attendance_id BIGINT NOT NULL AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    clock_in_at TIMESTAMP NOT NULL,
    clock_out_at TIMESTAMP NULL,
    working_minutes INT NULL,
    attendance_status VARCHAR(30) NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_attendance PRIMARY KEY (attendance_id),
    CONSTRAINT fk_attendance_company FOREIGN KEY (company_id) REFERENCES companies (company_id),
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id),
    CONSTRAINT uk_attendance_company_employee_date UNIQUE (company_id, employee_id, attendance_date)
);

CREATE INDEX idx_attendance_company_id ON attendance (company_id);
CREATE INDEX idx_attendance_employee_id ON attendance (employee_id);
CREATE INDEX idx_attendance_company_date ON attendance (company_id, attendance_date);