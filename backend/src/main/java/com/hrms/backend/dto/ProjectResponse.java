package com.hrms.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectResponse {

    private final Long projectId;
    private final Long companyId;
    private final String projectName;
    private final String projectCode;
    private final String description;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final boolean active;
    private final Long ownerEmployeeId;
    private final String ownerEmployeeName;
    private final List<TaskResponse> tasks;
    private final Instant createdAt;
    private final Instant updatedAt;
}
