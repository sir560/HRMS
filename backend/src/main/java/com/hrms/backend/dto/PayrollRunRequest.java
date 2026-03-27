package com.hrms.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PayrollRunRequest {

    @NotNull(message = "Payroll month is required")
    @Min(value = 1, message = "Payroll month must be between 1 and 12")
    @Max(value = 12, message = "Payroll month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Payroll year is required")
    @Min(value = 2000, message = "Payroll year is invalid")
    @Max(value = 2100, message = "Payroll year is invalid")
    private Integer year;

    @Valid
    @NotEmpty(message = "At least one employee payroll input is required")
    private List<PayrollRunEmployeeRequest> employees;
}
