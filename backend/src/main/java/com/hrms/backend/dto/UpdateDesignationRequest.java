package com.hrms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateDesignationRequest {

    @NotBlank(message = "Designation name is required")
    @Size(max = 120, message = "Designation name must not exceed 120 characters")
    private String designationName;

    @NotBlank(message = "Designation code is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{2,40}$", message = "Designation code must contain only letters, numbers, and hyphens")
    private String designationCode;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
