package com.hrms.backend.controller;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApiResponse;
import com.hrms.backend.dto.ApplyLeaveRequest;
import com.hrms.backend.dto.LeaveDecisionRequest;
import com.hrms.backend.dto.LeaveRequestResponse;
import com.hrms.backend.dto.LeaveTypeResponse;
import com.hrms.backend.service.LeaveService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @GetMapping("/leave-types")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LeaveTypeResponse>>> getLeaveTypes(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave types fetched successfully",
                leaveService.getLeaveTypes(authenticatedUser)
        ));
    }

    @PostMapping("/leave/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> applyLeave(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ApplyLeaveRequest request
    ) {
        LeaveRequestResponse response = leaveService.applyLeave(authenticatedUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted successfully", response));
    }

    @GetMapping("/leave/my-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getMyRequests(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave requests fetched successfully",
                leaveService.getMyRequests(authenticatedUser)
        ));
    }

    @GetMapping("/leave/approvals")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getApprovals(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave approvals fetched successfully",
                leaveService.getApprovals(authenticatedUser)
        ));
    }

    @PostMapping("/leave/{leaveRequestId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> approveLeave(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long leaveRequestId,
            @Valid @RequestBody(required = false) LeaveDecisionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave request approved successfully",
                leaveService.approveLeave(
                        authenticatedUser,
                        leaveRequestId,
                        request == null ? null : request.getReviewComment()
                )
        ));
    }

    @PostMapping("/leave/{leaveRequestId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> rejectLeave(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long leaveRequestId,
            @Valid @RequestBody(required = false) LeaveDecisionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Leave request rejected successfully",
                leaveService.rejectLeave(
                        authenticatedUser,
                        leaveRequestId,
                        request == null ? null : request.getReviewComment()
                )
        ));
    }
}
