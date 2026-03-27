package com.hrms.backend.controller;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApiResponse;
import com.hrms.backend.dto.PayrollResponse;
import com.hrms.backend.dto.PayrollRunRequest;
import com.hrms.backend.dto.PayrollSlipResponse;
import com.hrms.backend.service.PayrollService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> runPayroll(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody PayrollRunRequest request
    ) {
        List<PayrollResponse> response = payrollService.runPayroll(authenticatedUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payroll generated successfully", response));
    }

    @GetMapping("/{month}/{year}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPayrollForPeriod(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Integer month,
            @PathVariable Integer year
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Payroll fetched successfully",
                payrollService.getPayrollForPeriod(authenticatedUser, month, year)
        ));
    }

    @GetMapping("/slip/{employeeId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PayrollSlipResponse>> getSalarySlip(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Salary slip fetched successfully",
                payrollService.getSalarySlip(authenticatedUser, employeeId, month, year)
        ));
    }
}
