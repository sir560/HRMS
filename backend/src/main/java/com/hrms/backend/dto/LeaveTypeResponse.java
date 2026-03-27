package com.hrms.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LeaveTypeResponse {

    private final Long leaveTypeId;
    private final Long companyId;
    private final String leaveCode;
    private final String leaveName;
    private final String description;
    private final Integer defaultDays;
    private final boolean active;
}
