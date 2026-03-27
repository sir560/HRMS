package com.hrms.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PayrollRunEmployeeRequest {

    @NotNull(message = "Employee is required")
    private Long employeeId;

    @NotNull(message = "Basic salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Basic salary cannot be negative")
    private BigDecimal basicSalary;

    @NotNull(message = "HRA is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "HRA cannot be negative")
    private BigDecimal hra;

    @NotNull(message = "Special allowance is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Special allowance cannot be negative")
    private BigDecimal specialAllowance;

    @NotNull(message = "Other allowance is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Other allowance cannot be negative")
    private BigDecimal otherAllowance;

    @NotNull(message = "PF percentage is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "PF percentage cannot be negative")
    private BigDecimal pfPercentage;

    @NotNull(message = "ESI percentage is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "ESI percentage cannot be negative")
    private BigDecimal esiPercentage;

    @NotNull(message = "TDS percentage is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "TDS percentage cannot be negative")
    private BigDecimal tdsPercentage;

    @DecimalMin(value = "0.0", inclusive = true, message = "LOP days cannot be negative")
    private BigDecimal lopDays;

    @Size(max = 255, message = "Notes must not exceed 255 characters")
    private String notes;
}
