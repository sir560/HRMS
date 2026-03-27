package com.hrms.backend.dto;

import com.hrms.backend.entity.LeaveRequestStatus;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LeaveRequestResponse {

    private final Long leaveRequestId;
    private final Long companyId;
    private final Long employeeId;
    private final String employeeCode;
    private final String employeeName;
    private final String departmentName;
    private final Long leaveTypeId;
    private final String leaveTypeCode;
    private final String leaveTypeName;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final Integer totalDays;
    private final String reason;
    private final LeaveRequestStatus status;
    private final String reviewComment;
    private final String nextActionRole;
    private final Instant managerReviewedAt;
    private final Instant hrReviewedAt;
    private final Instant adminReviewedAt;
    private final Instant rejectedAt;
    private final Instant createdAt;
    private final Instant updatedAt;
}
