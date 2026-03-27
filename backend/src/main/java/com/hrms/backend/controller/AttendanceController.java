package com.hrms.backend.controller;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApiResponse;
import com.hrms.backend.dto.AttendanceReportResponse;
import com.hrms.backend.dto.AttendanceResponse;
import com.hrms.backend.dto.ClockInRequest;
import com.hrms.backend.dto.ClockOutRequest;
import com.hrms.backend.dto.UpdateAttendanceRequest;
import com.hrms.backend.service.AttendanceService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/clock-in")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> clockIn(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ClockInRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Clock-in recorded successfully",
                attendanceService.clockIn(authenticatedUser, request)
        ));
    }

    @PostMapping("/clock-out")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> clockOut(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ClockOutRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Clock-out recorded successfully",
                attendanceService.clockOut(authenticatedUser, request)
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendance(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance fetched successfully",
                attendanceService.getAttendance(authenticatedUser, employeeId)
        ));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getTodayAttendance(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Today's attendance fetched successfully",
                attendanceService.getTodayAttendance(authenticatedUser, employeeId)
        ));
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceReportResponse>> getAttendanceReport(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance report fetched successfully",
                attendanceService.getReport(authenticatedUser, dateFrom, dateTo, employeeId)
        ));
    }

    @PutMapping("/{attendanceId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateAttendance(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long attendanceId,
            @Valid @RequestBody UpdateAttendanceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Attendance updated successfully",
                attendanceService.updateAttendance(authenticatedUser, attendanceId, request)
        ));
    }
}
