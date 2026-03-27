package com.hrms.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClockInRequest {

    private Long employeeId;

    private Boolean workFromHome;

    @Size(max = 255, message = "Notes must not exceed 255 characters")
    private String notes;
}
