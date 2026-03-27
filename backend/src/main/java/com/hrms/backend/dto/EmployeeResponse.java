package com.hrms.backend.dto;

import com.hrms.backend.entity.EmploymentStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmployeeResponse {

    private final Long employeeId;
    private final Long companyId;
    private final String employeeCode;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String phoneNumber;
    private final Long designationId;
    private final String designation;
    private final LocalDate dateOfJoining;
    private final EmploymentStatus employmentStatus;
    private final boolean active;
    private final DepartmentResponse department;
    private final List<EmployeeDocumentResponse> documents;
    private final Instant createdAt;
    private final Instant updatedAt;
}
