package com.hrms.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterCompanyRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 150, message = "Company name must not exceed 150 characters")
    private String companyName;

    @NotBlank(message = "Company code is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{3,50}$", message = "Company code must contain only letters, numbers, and hyphens")
    private String companyCode;

    @NotBlank(message = "Admin first name is required")
    @Size(max = 80, message = "Admin first name must not exceed 80 characters")
    private String adminFirstName;

    @NotBlank(message = "Admin last name is required")
    @Size(max = 80, message = "Admin last name must not exceed 80 characters")
    private String adminLastName;

    @Email(message = "Admin email must be valid")
    @NotBlank(message = "Admin email is required")
    @Size(max = 150, message = "Admin email must not exceed 150 characters")
    private String adminEmail;

    @NotBlank(message = "Admin password is required")
    @Size(min = 8, max = 72, message = "Admin password must be between 8 and 72 characters")
    private String adminPassword;

    @Pattern(regexp = "^$|^[0-9+ -]{7,30}$", message = "Phone number must be a valid contact number")
    private String phoneNumber;
}
