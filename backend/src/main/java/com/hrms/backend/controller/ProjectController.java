package com.hrms.backend.controller;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApiResponse;
import com.hrms.backend.dto.CreateProjectRequest;
import com.hrms.backend.dto.CreateTaskCommentRequest;
import com.hrms.backend.dto.CreateTaskRequest;
import com.hrms.backend.dto.ProjectResponse;
import com.hrms.backend.dto.TaskAttachmentResponse;
import com.hrms.backend.dto.TaskCommentResponse;
import com.hrms.backend.dto.TaskResponse;
import com.hrms.backend.dto.UpdateTaskStatusRequest;
import com.hrms.backend.service.ProjectService;
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
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping("/projects")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        ProjectResponse response = projectService.createProject(authenticatedUser, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", response));
    }

    @GetMapping("/projects")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjects(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Projects fetched successfully",
                projectService.getProjects(authenticatedUser)
        ));
    }

    @GetMapping("/projects/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Project fetched successfully",
                projectService.getProjectById(authenticatedUser, projectId)
        ));
    }

    @PostMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long projectId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        TaskResponse response = projectService.createTask(authenticatedUser, projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", response));
    }

    @PutMapping("/tasks/{taskId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task status updated successfully",
                projectService.updateTaskStatus(authenticatedUser, taskId, request)
        ));
    }

    @GetMapping("/tasks/{taskId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TaskCommentResponse>>> getTaskComments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task comments fetched successfully",
                projectService.getTaskComments(authenticatedUser, taskId)
        ));
    }

    @PostMapping("/tasks/{taskId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> addTaskComment(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateTaskCommentRequest request
    ) {
        TaskCommentResponse response = projectService.addComment(authenticatedUser, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task comment added successfully", response));
    }

    @GetMapping("/tasks/{taskId}/attachments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TaskAttachmentResponse>>> getTaskAttachments(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long taskId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Task attachments fetched successfully",
                projectService.getTaskAttachments(authenticatedUser, taskId)
        ));
    }

    @PostMapping(value = "/tasks/{taskId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskAttachmentResponse>> uploadTaskAttachment(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file
    ) {
        TaskAttachmentResponse response = projectService.uploadAttachment(authenticatedUser, taskId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task attachment uploaded successfully", response));
    }

    @GetMapping("/tasks/{taskId}/attachments/{taskAttachmentId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadTaskAttachment(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long taskId,
            @PathVariable Long taskAttachmentId
    ) {
        ProjectService.TaskAttachmentDownload attachment = projectService.downloadAttachment(authenticatedUser, taskId, taskAttachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.fileName() + "\"")
                .body(attachment.resource());
    }
}
