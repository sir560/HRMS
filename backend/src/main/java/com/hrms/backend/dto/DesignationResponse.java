package com.hrms.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DesignationResponse {

    private final Long designationId;
    private final Long companyId;
    private final String designationName;
    private final String designationCode;
    private final String description;
    private final boolean active;
    private final long employeeCount;
}
