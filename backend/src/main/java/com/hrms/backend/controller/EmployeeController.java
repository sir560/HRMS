package com.hrms.backend.controller;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApiResponse;
import com.hrms.backend.dto.CreateDepartmentRequest;
import com.hrms.backend.dto.CreateDesignationRequest;
import com.hrms.backend.dto.CreateEmployeeRequest;
import com.hrms.backend.dto.DepartmentResponse;
import com.hrms.backend.dto.DesignationResponse;
import com.hrms.backend.dto.EmployeeDocumentResponse;
import com.hrms.backend.dto.EmployeePageResponse;
import com.hrms.backend.dto.EmployeeResponse;
import com.hrms.backend.dto.UpdateDesignationRequest;
import com.hrms.backend.dto.UpdateEmployeeRequest;
import com.hrms.backend.entity.EmploymentStatus;
import com.hrms.backend.service.EmployeeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping("/departments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateDepartmentRequest request
    ) {
        DepartmentResponse response = employeeService.createDepartment(authenticatedUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created successfully", response));
    }

    @GetMapping("/departments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getDepartments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Departments fetched successfully",
                employeeService.getDepartments(authenticatedUser)
        ));
    }

    @PostMapping("/designations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR')")
    public ResponseEntity<ApiResponse<DesignationResponse>> createDesignation(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateDesignationRequest request
    ) {
        DesignationResponse response = employeeService.createDesignation(authenticatedUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Designation created successfully", response));
    }

    @GetMapping("/designations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<DesignationResponse>>> getDesignations(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Designations fetched successfully",
                employeeService.getDesignations(authenticatedUser)
        ));
    }

    @PutMapping("/designations/{designationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR')")
    public ResponseEntity<ApiResponse<DesignationResponse>> updateDesignation(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long designationId,
            @Valid @RequestBody UpdateDesignationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Designation updated successfully",
                employeeService.updateDesignation(authenticatedUser, designationId, request)
        ));
    }

    @DeleteMapping("/designations/{designationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDesignation(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long designationId
    ) {
        employeeService.deleteDesignation(authenticatedUser, designationId);
        return ResponseEntity.ok(ApiResponse.success("Designation deleted successfully", null));
    }

    @PostMapping("/employees")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        EmployeeResponse response = employeeService.createEmployee(authenticatedUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created successfully", response));
    }

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<EmployeePageResponse>> getEmployees(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long designationId,
            @RequestParam(required = false) EmploymentStatus employmentStatus,
            @RequestParam(required = false) Boolean active
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Employees fetched successfully",
                employeeService.getEmployees(authenticatedUser, page, size, search, departmentId, designationId, employmentStatus, active)
        ));
    }

    @GetMapping("/employees/{employeeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Employee fetched successfully",
                employeeService.getEmployeeById(authenticatedUser, employeeId)
        ));
    }

    @PutMapping("/employees/{employeeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId,
            @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Employee updated successfully",
                employeeService.updateEmployee(authenticatedUser, employeeId, request)
        ));
    }

    @DeleteMapping("/employees/{employeeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId
    ) {
        employeeService.deleteEmployee(authenticatedUser, employeeId);
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully", null));
    }

    @GetMapping("/employees/{employeeId}/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<List<EmployeeDocumentResponse>>> getEmployeeDocuments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Employee documents fetched successfully",
                employeeService.getEmployeeDocuments(authenticatedUser, employeeId)
        ));
    }

    @PostMapping(value = "/employees/{employeeId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<EmployeeDocumentResponse>> uploadEmployeeDocument(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String documentType
    ) {
        EmployeeDocumentResponse response = employeeService.uploadEmployeeDocument(authenticatedUser, employeeId, file, documentType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee document uploaded successfully", response));
    }

    @DeleteMapping("/employees/{employeeId}/documents/{employeeDocumentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployeeDocument(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId,
            @PathVariable Long employeeDocumentId
    ) {
        employeeService.deleteEmployeeDocument(authenticatedUser, employeeId, employeeDocumentId);
        return ResponseEntity.ok(ApiResponse.success("Employee document deleted successfully", null));
    }

    @GetMapping("/employees/{employeeId}/documents/{employeeDocumentId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<Resource> downloadEmployeeDocument(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long employeeId,
            @PathVariable Long employeeDocumentId
    ) {
        EmployeeService.EmployeeDocumentDownload documentDownload = employeeService.downloadEmployeeDocument(
                authenticatedUser,
                employeeId,
                employeeDocumentId
        );

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(documentDownload.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + documentDownload.fileName() + "\"")
                .body(documentDownload.resource());
    }
}
