package com.hrms.backend.dto;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceReportResponse {

    private final Long companyId;
    private final Long employeeId;
    private final LocalDate dateFrom;
    private final LocalDate dateTo;
    private final long totalEmployees;
    private final long totalTrackedDays;
    private final long totalRecords;
    private final long presentCount;
    private final long absentCount;
    private final long lateCount;
    private final long halfDayCount;
    private final long workFromHomeCount;
    private final long totalWorkingMinutes;
    private final String averageWorkingHours;
    private final List<AttendanceResponse> records;
}
