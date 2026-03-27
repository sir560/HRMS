package com.hrms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateDepartmentRequest {

    @NotBlank(message = "Department name is required")
    @Size(max = 120, message = "Department name must not exceed 120 characters")
    private String departmentName;

    @NotBlank(message = "Department code is required")
    @Size(max = 40, message = "Department code must not exceed 40 characters")
    private String departmentCode;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
}