package com.hrms.backend.service;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.AttendanceReportResponse;
import com.hrms.backend.dto.AttendanceResponse;
import com.hrms.backend.dto.ClockInRequest;
import com.hrms.backend.dto.ClockOutRequest;
import com.hrms.backend.dto.UpdateAttendanceRequest;
import com.hrms.backend.entity.Attendance;
import com.hrms.backend.entity.AttendanceStatus;
import com.hrms.backend.entity.Employee;
import com.hrms.backend.entity.RoleName;
import com.hrms.backend.exception.BadRequestException;
import com.hrms.backend.exception.ResourceNotFoundException;
import com.hrms.backend.repository.AttendanceRepository;
import com.hrms.backend.repository.EmployeeRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final Set<RoleName> MANAGEMENT_ROLES = Set.of(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR, RoleName.MANAGER);
    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);
    private static final int HALF_DAY_MINUTES = 4 * 60;

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public AttendanceResponse clockIn(AuthenticatedUser principal, ClockInRequest request) {
        Employee employee = resolveAccessibleEmployee(principal, request.getEmployeeId());
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDate(principal.getCompanyId(), employee.getEmployeeId(), today)
                .ifPresent(existing -> {
                    throw new BadRequestException("Employee is already clocked in for today");
                });

        Instant clockInAt = Instant.now();
        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(today)
                .clockInAt(clockInAt)
                .attendanceStatus(determineAttendanceStatus(clockInAt, null, Boolean.TRUE.equals(request.getWorkFromHome())))
                .workFromHome(Boolean.TRUE.equals(request.getWorkFromHome()))
                .notes(trimToNull(request.getNotes()))
                .build();
        attendance.setCompanyId(principal.getCompanyId());

        return toResponse(attendanceRepository.save(attendance));
    }

    @Transactional
    public AttendanceResponse clockOut(AuthenticatedUser principal, ClockOutRequest request) {
        Employee employee = resolveAccessibleEmployee(principal, request.getEmployeeId());
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        Attendance attendance = attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDate(principal.getCompanyId(), employee.getEmployeeId(), today)
                .orElseThrow(() -> new ResourceNotFoundException("Active attendance record not found for today"));

        if (attendance.getClockOutAt() != null) {
            throw new BadRequestException("Employee is already clocked out for today");
        }

        Instant clockOutAt = Instant.now();
        int workingMinutes = calculateWorkingMinutes(attendance.getClockInAt(), clockOutAt);
        attendance.setClockOutAt(clockOutAt);
        attendance.setWorkingMinutes(workingMinutes);
        attendance.setAttendanceStatus(determineAttendanceStatus(attendance.getClockInAt(), workingMinutes, attendance.isWorkFromHome()));
        if (StringUtils.hasText(request.getNotes())) {
            attendance.setNotes(request.getNotes().trim());
        }

        return toResponse(attendanceRepository.save(attendance));
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendance(AuthenticatedUser principal, Long employeeId) {
        if (employeeId != null) {
            Employee employee = resolveAccessibleEmployee(principal, employeeId);
            return attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdOrderByAttendanceDateDescClockInAtDesc(
                            principal.getCompanyId(), employee.getEmployeeId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (hasManagementAccess(principal)) {
            return attendanceRepository.findByCompanyIdOrderByAttendanceDateDescClockInAtDesc(principal.getCompanyId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        Employee employee = resolveEmployeeByAuthenticatedEmail(principal);
        return attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdOrderByAttendanceDateDescClockInAtDesc(
                        principal.getCompanyId(), employee.getEmployeeId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getTodayAttendance(AuthenticatedUser principal, Long employeeId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        if (employeeId != null) {
            Employee employee = resolveAccessibleEmployee(principal, employeeId);
            return attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDate(
                            principal.getCompanyId(), employee.getEmployeeId(), today)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (hasManagementAccess(principal)) {
            return attendanceRepository.findByCompanyIdAndAttendanceDateOrderByClockInAtDesc(principal.getCompanyId(), today)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        Employee employee = resolveEmployeeByAuthenticatedEmail(principal);
        return attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDate(
                        principal.getCompanyId(), employee.getEmployeeId(), today)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceReportResponse getReport(
            AuthenticatedUser principal,
            LocalDate dateFrom,
            LocalDate dateTo,
            Long employeeId
    ) {
        LocalDate normalizedFrom = dateFrom == null ? LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1) : dateFrom;
        LocalDate normalizedTo = dateTo == null ? LocalDate.now(ZoneOffset.UTC) : dateTo;
        if (normalizedTo.isBefore(normalizedFrom)) {
            throw new BadRequestException("Report end date cannot be before start date");
        }

        List<Attendance> records;
        Long scopedEmployeeId = null;
        long totalEmployees;

        if (employeeId != null) {
            Employee employee = resolveAccessibleEmployee(principal, employeeId);
            scopedEmployeeId = employee.getEmployeeId();
            totalEmployees = 1;
            records = attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDescClockInAtDesc(
                    principal.getCompanyId(),
                    employee.getEmployeeId(),
                    normalizedFrom,
                    normalizedTo
            );
        } else if (hasManagementAccess(principal)) {
            totalEmployees = employeeRepository.countByCompanyIdAndDeletedAtIsNullAndActiveTrue(principal.getCompanyId());
            records = attendanceRepository.findByCompanyIdAndAttendanceDateBetweenOrderByAttendanceDateDescClockInAtDesc(
                    principal.getCompanyId(),
                    normalizedFrom,
                    normalizedTo
            );
        } else {
            Employee employee = resolveEmployeeByAuthenticatedEmail(principal);
            scopedEmployeeId = employee.getEmployeeId();
            totalEmployees = 1;
            records = attendanceRepository.findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDescClockInAtDesc(
                    principal.getCompanyId(),
                    employee.getEmployeeId(),
                    normalizedFrom,
                    normalizedTo
            );
        }

        long presentCount = records.stream().filter(item -> item.getAttendanceStatus() == AttendanceStatus.PRESENT).count();
        long lateCount = records.stream().filter(item -> item.getAttendanceStatus() == AttendanceStatus.LATE).count();
        long halfDayCount = records.stream().filter(item -> item.getAttendanceStatus() == AttendanceStatus.HALF_DAY).count();
        long workFromHomeCount = records.stream().filter(item -> item.getAttendanceStatus() == AttendanceStatus.WORK_FROM_HOME).count();
        long totalWorkingMinutes = records.stream()
                .map(Attendance::getWorkingMinutes)
                .filter(java.util.Objects::nonNull)
                .mapToLong(Integer::longValue)
                .sum();
        long trackedDays = ChronoUnit.DAYS.between(normalizedFrom, normalizedTo) + 1;
        long totalTrackedDays = trackedDays * Math.max(totalEmployees, 0);
        long absentCount = Math.max(totalTrackedDays - records.size(), 0);

        return AttendanceReportResponse.builder()
                .companyId(principal.getCompanyId())
                .employeeId(scopedEmployeeId)
                .dateFrom(normalizedFrom)
                .dateTo(normalizedTo)
                .totalEmployees(totalEmployees)
                .totalTrackedDays(totalTrackedDays)
                .totalRecords(records.size())
                .presentCount(presentCount)
                .absentCount(absentCount)
                .lateCount(lateCount)
                .halfDayCount(halfDayCount)
                .workFromHomeCount(workFromHomeCount)
                .totalWorkingMinutes(totalWorkingMinutes)
                .averageWorkingHours(formatAverageWorkingHours(records.size(), totalWorkingMinutes))
                .records(records.stream().map(this::toResponse).toList())
                .build();
    }

    @Transactional
    public AttendanceResponse updateAttendance(AuthenticatedUser principal, Long attendanceId, UpdateAttendanceRequest request) {
        if (!hasManagementAccess(principal)) {
            throw new BadRequestException("You are not allowed to update attendance records");
        }

        Attendance attendance = attendanceRepository.findByAttendanceIdAndCompanyId(attendanceId, principal.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found for the provided tenant"));

        attendance.setAttendanceDate(request.getAttendanceDate());
        attendance.setClockInAt(request.getClockInAt());
        attendance.setClockOutAt(request.getClockOutAt());
        attendance.setWorkFromHome(Boolean.TRUE.equals(request.getWorkFromHome()));
        attendance.setNotes(trimToNull(request.getNotes()));

        if (request.getClockOutAt() != null) {
            int workingMinutes = calculateWorkingMinutes(request.getClockInAt(), request.getClockOutAt());
            attendance.setWorkingMinutes(workingMinutes);
            attendance.setAttendanceStatus(determineAttendanceStatus(request.getClockInAt(), workingMinutes, attendance.isWorkFromHome()));
        } else {
            attendance.setWorkingMinutes(null);
            attendance.setAttendanceStatus(determineAttendanceStatus(request.getClockInAt(), null, attendance.isWorkFromHome()));
        }

        return toResponse(attendanceRepository.save(attendance));
    }

    private Employee resolveAccessibleEmployee(AuthenticatedUser principal, Long employeeId) {
        if (employeeId == null) {
            if (hasManagementAccess(principal)) {
                throw new BadRequestException("Employee is required");
            }
            return resolveEmployeeByAuthenticatedEmail(principal);
        }

        Employee employee = employeeRepository.findByEmployeeIdAndCompanyId(employeeId, principal.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for the provided tenant"));

        if (hasManagementAccess(principal)) {
            return employee;
        }

        if (employee.getEmail().equalsIgnoreCase(principal.getEmail())) {
            return employee;
        }

        throw new BadRequestException("You are not allowed to access attendance for this employee");
    }

    private Employee resolveEmployeeByAuthenticatedEmail(AuthenticatedUser principal) {
        return employeeRepository.findByCompanyIdAndEmailIgnoreCase(principal.getCompanyId(), principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for the authenticated user"));
    }

    private boolean hasManagementAccess(AuthenticatedUser principal) {
        return principal.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(RoleName::valueOf)
                .anyMatch(MANAGEMENT_ROLES::contains);
    }

    private AttendanceResponse toResponse(Attendance attendance) {
        Employee employee = attendance.getEmployee();
        Integer workingMinutes = attendance.getWorkingMinutes();
        return AttendanceResponse.builder()
                .attendanceId(attendance.getAttendanceId())
                .companyId(attendance.getCompanyId())
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .departmentName(employee.getDepartment().getDepartmentName())
                .attendanceDate(attendance.getAttendanceDate())
                .clockInAt(attendance.getClockInAt())
                .clockOutAt(attendance.getClockOutAt())
                .workingMinutes(workingMinutes)
                .workingHours(formatWorkingHours(workingMinutes))
                .attendanceStatus(attendance.getAttendanceStatus())
                .workFromHome(attendance.isWorkFromHome())
                .notes(attendance.getNotes())
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }

    private AttendanceStatus determineAttendanceStatus(Instant clockInAt, Integer workingMinutes, boolean workFromHome) {
        if (workFromHome) {
            return AttendanceStatus.WORK_FROM_HOME;
        }
        if (workingMinutes != null && workingMinutes < HALF_DAY_MINUTES) {
            return AttendanceStatus.HALF_DAY;
        }
        LocalTime clockInTime = clockInAt.atOffset(ZoneOffset.UTC).toLocalTime();
        if (clockInTime.isAfter(LATE_THRESHOLD)) {
            return AttendanceStatus.LATE;
        }
        return AttendanceStatus.PRESENT;
    }

    private int calculateWorkingMinutes(Instant clockInAt, Instant clockOutAt) {
        if (clockOutAt.isBefore(clockInAt)) {
            throw new BadRequestException("Clock-out time cannot be before clock-in time");
        }
        return Math.toIntExact(Duration.between(clockInAt, clockOutAt).toMinutes());
    }

    private String formatWorkingHours(Integer workingMinutes) {
        if (workingMinutes == null) {
            return null;
        }
        long hours = workingMinutes / 60;
        long minutes = workingMinutes % 60;
        return String.format("%02d:%02d", hours, minutes);
    }

    private String formatAverageWorkingHours(int recordCount, long totalWorkingMinutes) {
        if (recordCount == 0) {
            return "00:00";
        }
        long averageMinutes = totalWorkingMinutes / recordCount;
        return formatWorkingHours((int) averageMinutes);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}

