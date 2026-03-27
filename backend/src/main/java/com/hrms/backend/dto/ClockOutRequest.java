package com.hrms.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClockOutRequest {

    private Long employeeId;

    @Size(max = 255, message = "Notes must not exceed 255 characters")
    private String notes;
}
