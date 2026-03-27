package com.hrms.backend.dto;

import com.hrms.backend.entity.PayrollStatus;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PayrollSlipResponse {

    private final Long companyId;
    private final String companyName;
    private final Integer payrollMonth;
    private final Integer payrollYear;
    private final Long employeeId;
    private final String employeeCode;
    private final String employeeName;
    private final String departmentName;
    private final String designation;
    private final BigDecimal basicSalary;
    private final BigDecimal hra;
    private final BigDecimal specialAllowance;
    private final BigDecimal otherAllowance;
    private final BigDecimal grossSalary;
    private final BigDecimal pfAmount;
    private final BigDecimal esiAmount;
    private final BigDecimal tdsAmount;
    private final BigDecimal lopAmount;
    private final BigDecimal totalDeductions;
    private final BigDecimal netSalary;
    private final BigDecimal paidDays;
    private final BigDecimal lopDays;
    private final PayrollStatus status;
    private final String notes;
    private final Instant generatedAt;
}
