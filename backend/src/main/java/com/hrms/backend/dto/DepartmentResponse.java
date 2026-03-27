package com.hrms.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DepartmentResponse {

    private final Long departmentId;
    private final Long companyId;
    private final String departmentName;
    private final String departmentCode;
    private final String description;
    private final boolean active;
    private final long employeeCount;
}