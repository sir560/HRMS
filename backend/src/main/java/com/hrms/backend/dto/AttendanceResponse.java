package com.hrms.backend.dto;

import com.hrms.backend.entity.AttendanceStatus;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceResponse {

    private final Long attendanceId;
    private final Long companyId;
    private final Long employeeId;
    private final String employeeCode;
    private final String employeeName;
    private final String departmentName;
    private final LocalDate attendanceDate;
    private final Instant clockInAt;
    private final Instant clockOutAt;
    private final Integer workingMinutes;
    private final String workingHours;
    private final AttendanceStatus attendanceStatus;
    private final boolean workFromHome;
    private final String notes;
    private final Instant createdAt;
    private final Instant updatedAt;
}
