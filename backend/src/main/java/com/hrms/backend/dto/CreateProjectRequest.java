package com.hrms.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(max = 150, message = "Project name must not exceed 150 characters")
    private String projectName;

    @NotBlank(message = "Project code is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{2,50}$", message = "Project code must contain only letters, numbers, and hyphens")
    private String projectCode;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private Long ownerEmployeeId;

    @PastOrPresent(message = "Start date cannot be in the future")
    private LocalDate startDate;

    private LocalDate endDate;
}
