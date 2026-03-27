package com.hrms.backend.service;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApplyLeaveRequest;
import com.hrms.backend.dto.LeaveRequestResponse;
import com.hrms.backend.dto.LeaveTypeResponse;
import com.hrms.backend.entity.Employee;
import com.hrms.backend.entity.LeaveRequest;
import com.hrms.backend.entity.LeaveRequestStatus;
import com.hrms.backend.entity.LeaveType;
import com.hrms.backend.entity.RoleName;
import com.hrms.backend.exception.BadRequestException;
import com.hrms.backend.exception.ResourceNotFoundException;
import com.hrms.backend.repository.EmployeeRepository;
import com.hrms.backend.repository.LeaveRequestRepository;
import com.hrms.backend.repository.LeaveTypeRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private static final Set<LeaveRequestStatus> ACTIVE_REQUEST_STATUSES = Set.of(
            LeaveRequestStatus.PENDING_MANAGER,
            LeaveRequestStatus.PENDING_HR,
            LeaveRequestStatus.PENDING_ADMIN,
            LeaveRequestStatus.APPROVED
    );

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> getLeaveTypes(AuthenticatedUser principal) {
        return leaveTypeRepository.findByCompanyIdAndDeletedAtIsNullAndActiveTrueOrderByLeaveNameAsc(principal.getCompanyId())
                .stream()
                .map(this::toLeaveTypeResponse)
                .toList();
    }

    @Transactional
    public LeaveRequestResponse applyLeave(AuthenticatedUser principal, ApplyLeaveRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }

        Employee employee = resolveTargetEmployee(principal, request.getEmployeeId());
        LeaveType leaveType = leaveTypeRepository.findByLeaveTypeIdAndCompanyIdAndDeletedAtIsNullAndActiveTrue(
                        request.getLeaveTypeId(),
                        principal.getCompanyId()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Leave type not found for the provided tenant"));

        if (leaveRequestRepository.existsByCompanyIdAndEmployee_EmployeeIdAndDeletedAtIsNullAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                principal.getCompanyId(),
                employee.getEmployeeId(),
                ACTIVE_REQUEST_STATUSES,
                request.getEndDate(),
                request.getStartDate()
        )) {
            throw new BadRequestException("Employee already has an overlapping leave request for the selected period");
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(Math.toIntExact(ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1))
                .reason(request.getReason().trim())
                .status(LeaveRequestStatus.PENDING_MANAGER)
                .build();
        leaveRequest.setCompanyId(principal.getCompanyId());

        return toLeaveRequestResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getMyRequests(AuthenticatedUser principal) {
        Employee employee = resolveOwnEmployee(principal);
        return leaveRequestRepository.findByCompanyIdAndEmployee_EmployeeIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                        principal.getCompanyId(),
                        employee.getEmployeeId()
                )
                .stream()
                .map(this::toLeaveRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getApprovals(AuthenticatedUser principal) {
        Set<LeaveRequestStatus> visibleStatuses = switch (resolveHighestApprovalRole(principal)) {
            case MANAGER -> Set.of(LeaveRequestStatus.PENDING_MANAGER);
            case HR -> Set.of(LeaveRequestStatus.PENDING_MANAGER, LeaveRequestStatus.PENDING_HR);
            case ADMIN, SUPER_ADMIN -> Set.of(
                    LeaveRequestStatus.PENDING_MANAGER,
                    LeaveRequestStatus.PENDING_HR,
                    LeaveRequestStatus.PENDING_ADMIN
            );
            default -> throw new BadRequestException("You are not allowed to approve leave requests");
        };

        return leaveRequestRepository.findByCompanyIdAndStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(
                        principal.getCompanyId(),
                        visibleStatuses
                )
                .stream()
                .map(this::toLeaveRequestResponse)
                .toList();
    }

    @Transactional
    public LeaveRequestResponse approveLeave(AuthenticatedUser principal, Long leaveRequestId, String reviewComment) {
        LeaveRequest leaveRequest = getAccessibleApproval(principal, leaveRequestId);
        LeaveRequestStatus nextStatus = determineNextStatus(principal, leaveRequest.getStatus());
        Instant now = Instant.now();

        switch (leaveRequest.getStatus()) {
            case PENDING_MANAGER -> leaveRequest.setManagerReviewedAt(now);
            case PENDING_HR -> leaveRequest.setHrReviewedAt(now);
            case PENDING_ADMIN -> leaveRequest.setAdminReviewedAt(now);
            default -> throw new BadRequestException("Leave request cannot be approved in its current state");
        }

        leaveRequest.setReviewComment(trimToNull(reviewComment));
        leaveRequest.setStatus(nextStatus);
        return toLeaveRequestResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestResponse rejectLeave(AuthenticatedUser principal, Long leaveRequestId, String reviewComment) {
        LeaveRequest leaveRequest = getAccessibleApproval(principal, leaveRequestId);
        Instant now = Instant.now();

        switch (leaveRequest.getStatus()) {
            case PENDING_MANAGER -> leaveRequest.setManagerReviewedAt(now);
            case PENDING_HR -> leaveRequest.setHrReviewedAt(now);
            case PENDING_ADMIN -> leaveRequest.setAdminReviewedAt(now);
            default -> throw new BadRequestException("Leave request cannot be rejected in its current state");
        }

        leaveRequest.setStatus(LeaveRequestStatus.REJECTED);
        leaveRequest.setRejectedAt(now);
        leaveRequest.setReviewComment(trimToNull(reviewComment));
        return toLeaveRequestResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public void seedDefaultLeaveTypes(Long companyId) {
        createLeaveTypeIfMissing(companyId, "CL", "Casual Leave", "Casual leave allocation", 12);
        createLeaveTypeIfMissing(companyId, "SL", "Sick Leave", "Medical or sick leave allocation", 10);
        createLeaveTypeIfMissing(companyId, "EL", "Earned Leave", "Earned leave allocation", 15);
    }

    private void createLeaveTypeIfMissing(Long companyId, String code, String name, String description, int defaultDays) {
        if (leaveTypeRepository.existsByCompanyIdAndLeaveCodeIgnoreCaseAndDeletedAtIsNull(companyId, code)) {
            return;
        }
        LeaveType leaveType = LeaveType.builder()
                .leaveCode(code)
                .leaveName(name)
                .description(description)
                .defaultDays(defaultDays)
                .active(true)
                .build();
        leaveType.setCompanyId(companyId);
        leaveTypeRepository.save(leaveType);
    }

    private Employee resolveTargetEmployee(AuthenticatedUser principal, Long employeeId) {
        if (employeeId == null) {
            return resolveOwnEmployee(principal);
        }

        Employee employee = employeeRepository.findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(employeeId, principal.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for the provided tenant"));

        if (hasManagementRole(principal)) {
            return employee;
        }
        if (employee.getEmail().equalsIgnoreCase(principal.getEmail())) {
            return employee;
        }
        throw new BadRequestException("You are not allowed to apply leave for this employee");
    }

    private Employee resolveOwnEmployee(AuthenticatedUser principal) {
        return employeeRepository.findByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(principal.getCompanyId(), principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for the authenticated user"));
    }

    private LeaveRequest getAccessibleApproval(AuthenticatedUser principal, Long leaveRequestId) {
        LeaveRequest leaveRequest = leaveRequestRepository.findByLeaveRequestIdAndCompanyIdAndDeletedAtIsNull(
                        leaveRequestId,
                        principal.getCompanyId()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found for the provided tenant"));

        switch (leaveRequest.getStatus()) {
            case PENDING_MANAGER -> requireManagerAccess(principal);
            case PENDING_HR -> requireHrAccess(principal);
            case PENDING_ADMIN -> requireAdminAccess(principal);
            default -> throw new BadRequestException("Leave request is not pending approval");
        }
        return leaveRequest;
    }

    private LeaveRequestStatus determineNextStatus(AuthenticatedUser principal, LeaveRequestStatus currentStatus) {
        return switch (currentStatus) {
            case PENDING_MANAGER -> {
                requireManagerAccess(principal);
                yield LeaveRequestStatus.PENDING_HR;
            }
            case PENDING_HR -> {
                requireHrAccess(principal);
                yield LeaveRequestStatus.PENDING_ADMIN;
            }
            case PENDING_ADMIN -> {
                requireAdminAccess(principal);
                yield LeaveRequestStatus.APPROVED;
            }
            default -> throw new BadRequestException("Leave request cannot be approved in its current state");
        };
    }

    private void requireManagerAccess(AuthenticatedUser principal) {
        RoleName role = resolveHighestApprovalRole(principal);
        if (!(role == RoleName.MANAGER || role == RoleName.HR || role == RoleName.ADMIN || role == RoleName.SUPER_ADMIN)) {
            throw new BadRequestException("You are not allowed to approve leave requests at manager stage");
        }
    }

    private void requireHrAccess(AuthenticatedUser principal) {
        RoleName role = resolveHighestApprovalRole(principal);
        if (!(role == RoleName.HR || role == RoleName.ADMIN || role == RoleName.SUPER_ADMIN)) {
            throw new BadRequestException("You are not allowed to approve leave requests at HR stage");
        }
    }

    private void requireAdminAccess(AuthenticatedUser principal) {
        RoleName role = resolveHighestApprovalRole(principal);
        if (!(role == RoleName.ADMIN || role == RoleName.SUPER_ADMIN)) {
            throw new BadRequestException("You are not allowed to approve leave requests at admin stage");
        }
    }

    private boolean hasManagementRole(AuthenticatedUser principal) {
        return principal.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(RoleName::valueOf)
                .anyMatch(role -> role == RoleName.MANAGER || role == RoleName.HR || role == RoleName.ADMIN || role == RoleName.SUPER_ADMIN);
    }

    private RoleName resolveHighestApprovalRole(AuthenticatedUser principal) {
        Set<RoleName> roles = principal.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(RoleName::valueOf)
                .collect(java.util.stream.Collectors.toSet());

        if (roles.contains(RoleName.SUPER_ADMIN)) {
            return RoleName.SUPER_ADMIN;
        }
        if (roles.contains(RoleName.ADMIN)) {
            return RoleName.ADMIN;
        }
        if (roles.contains(RoleName.HR)) {
            return RoleName.HR;
        }
        if (roles.contains(RoleName.MANAGER)) {
            return RoleName.MANAGER;
        }
        return RoleName.EMPLOYEE;
    }

    private LeaveTypeResponse toLeaveTypeResponse(LeaveType leaveType) {
        return LeaveTypeResponse.builder()
                .leaveTypeId(leaveType.getLeaveTypeId())
                .companyId(leaveType.getCompanyId())
                .leaveCode(leaveType.getLeaveCode())
                .leaveName(leaveType.getLeaveName())
                .description(leaveType.getDescription())
                .defaultDays(leaveType.getDefaultDays())
                .active(leaveType.isActive())
                .build();
    }

    private LeaveRequestResponse toLeaveRequestResponse(LeaveRequest leaveRequest) {
        Employee employee = leaveRequest.getEmployee();
        return LeaveRequestResponse.builder()
                .leaveRequestId(leaveRequest.getLeaveRequestId())
                .companyId(leaveRequest.getCompanyId())
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .departmentName(employee.getDepartment().getDepartmentName())
                .leaveTypeId(leaveRequest.getLeaveType().getLeaveTypeId())
                .leaveTypeCode(leaveRequest.getLeaveType().getLeaveCode())
                .leaveTypeName(leaveRequest.getLeaveType().getLeaveName())
                .startDate(leaveRequest.getStartDate())
                .endDate(leaveRequest.getEndDate())
                .totalDays(leaveRequest.getTotalDays())
                .reason(leaveRequest.getReason())
                .status(leaveRequest.getStatus())
                .reviewComment(leaveRequest.getReviewComment())
                .nextActionRole(resolveNextActionRole(leaveRequest.getStatus()))
                .managerReviewedAt(leaveRequest.getManagerReviewedAt())
                .hrReviewedAt(leaveRequest.getHrReviewedAt())
                .adminReviewedAt(leaveRequest.getAdminReviewedAt())
                .rejectedAt(leaveRequest.getRejectedAt())
                .createdAt(leaveRequest.getCreatedAt())
                .updatedAt(leaveRequest.getUpdatedAt())
                .build();
    }

    private String resolveNextActionRole(LeaveRequestStatus status) {
        return switch (status) {
            case PENDING_MANAGER -> "MANAGER";
            case PENDING_HR -> "HR";
            case PENDING_ADMIN -> "ADMIN";
            default -> null;
        };
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
