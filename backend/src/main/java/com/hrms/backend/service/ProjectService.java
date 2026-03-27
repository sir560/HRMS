package com.hrms.backend.service;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.CreateProjectRequest;
import com.hrms.backend.dto.CreateTaskCommentRequest;
import com.hrms.backend.dto.CreateTaskRequest;
import com.hrms.backend.dto.ProjectResponse;
import com.hrms.backend.dto.TaskAttachmentResponse;
import com.hrms.backend.dto.TaskCommentResponse;
import com.hrms.backend.dto.TaskResponse;
import com.hrms.backend.dto.UpdateTaskStatusRequest;
import com.hrms.backend.entity.Employee;
import com.hrms.backend.entity.Project;
import com.hrms.backend.entity.RoleName;
import com.hrms.backend.entity.Task;
import com.hrms.backend.entity.TaskAttachment;
import com.hrms.backend.entity.TaskComment;
import com.hrms.backend.entity.TaskStatus;
import com.hrms.backend.exception.BadRequestException;
import com.hrms.backend.exception.ResourceNotFoundException;
import com.hrms.backend.repository.EmployeeRepository;
import com.hrms.backend.repository.ProjectRepository;
import com.hrms.backend.repository.TaskAttachmentRepository;
import com.hrms.backend.repository.TaskCommentRepository;
import com.hrms.backend.repository.TaskRepository;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final Set<RoleName> MANAGEMENT_ROLES = Set.of(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR, RoleName.MANAGER);
    private static final Set<String> ALLOWED_ATTACHMENT_EXTENSIONS = Set.of("pdf", "png", "jpg", "jpeg", "doc", "docx", "xlsx", "xls", "txt");

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.storage.task-attachments-dir}")
    private String taskAttachmentsDir;

    @Value("${app.storage.task-attachment-max-size-bytes}")
    private long taskAttachmentMaxSizeBytes;

    @Transactional
    public ProjectResponse createProject(AuthenticatedUser principal, CreateProjectRequest request) {
        requireManagementAccess(principal);
        validateProjectDates(request.getStartDate(), request.getEndDate());
        String projectCode = request.getProjectCode().trim().toUpperCase(Locale.ROOT);

        if (projectRepository.existsByCompanyIdAndProjectCodeIgnoreCaseAndDeletedAtIsNull(principal.getCompanyId(), projectCode)) {
            throw new BadRequestException("Project code already exists for this company");
        }

        Employee owner = request.getOwnerEmployeeId() == null ? null : getEmployeeForCompany(request.getOwnerEmployeeId(), principal.getCompanyId());

        Project project = Project.builder()
                .projectName(request.getProjectName().trim())
                .projectCode(projectCode)
                .description(trimToNull(request.getDescription()))
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .owner(owner)
                .build();
        project.setCompanyId(principal.getCompanyId());

        return toProjectResponse(projectRepository.save(project), List.of());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(AuthenticatedUser principal) {
        return projectRepository.findByCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(principal.getCompanyId()).stream()
                .map(project -> toProjectResponse(project, getTasksForProject(project.getProjectId(), principal.getCompanyId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(AuthenticatedUser principal, Long projectId) {
        Project project = getProjectForCompany(projectId, principal.getCompanyId());
        return toProjectResponse(project, getTasksForProject(projectId, principal.getCompanyId()));
    }

    @Transactional
    public TaskResponse createTask(AuthenticatedUser principal, Long projectId, CreateTaskRequest request) {
        requireManagementAccess(principal);
        Project project = getProjectForCompany(projectId, principal.getCompanyId());
        Employee assignee = request.getAssigneeEmployeeId() == null ? null : getEmployeeForCompany(request.getAssigneeEmployeeId(), principal.getCompanyId());

        Task task = Task.builder()
                .project(project)
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .status(TaskStatus.TODO)
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .assignee(assignee)
                .build();
        task.setCompanyId(principal.getCompanyId());
        return toTaskResponse(taskRepository.save(task), List.of(), List.of());
    }

    @Transactional
    public TaskResponse updateTaskStatus(AuthenticatedUser principal, Long taskId, UpdateTaskStatusRequest request) {
        Task task = getTaskForCompany(taskId, principal.getCompanyId());
        ensureTaskAccess(principal, task, true);
        task.setStatus(request.getStatus());
        return toTaskResponse(
                taskRepository.save(task),
                getComments(task.getTaskId(), principal.getCompanyId()),
                getAttachments(task.getTaskId(), principal.getCompanyId())
        );
    }

    @Transactional
    public TaskCommentResponse addComment(AuthenticatedUser principal, Long taskId, CreateTaskCommentRequest request) {
        Task task = getTaskForCompany(taskId, principal.getCompanyId());
        ensureTaskAccess(principal, task, false);

        TaskComment comment = TaskComment.builder()
                .task(task)
                .commentText(request.getCommentText().trim())
                .commentedByUserId(principal.getUserId())
                .commentedByName(principal.getFirstName() + " " + principal.getLastName())
                .build();
        comment.setCompanyId(principal.getCompanyId());
        return toTaskCommentResponse(taskCommentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<TaskCommentResponse> getTaskComments(AuthenticatedUser principal, Long taskId) {
        Task task = getTaskForCompany(taskId, principal.getCompanyId());
        ensureTaskAccess(principal, task, false);
        return getComments(taskId, principal.getCompanyId());
    }

    @Transactional
    public TaskAttachmentResponse uploadAttachment(AuthenticatedUser principal, Long taskId, MultipartFile file) {
        Task task = getTaskForCompany(taskId, principal.getCompanyId());
        ensureTaskAccess(principal, task, false);
        validateAttachment(file);

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String extension = fileExtension(originalFileName);
        String storedFileName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
        Path taskDirectory = Paths.get(taskAttachmentsDir, String.valueOf(principal.getCompanyId()), String.valueOf(taskId)).normalize();
        Path storedFilePath = taskDirectory.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(taskDirectory);
            Files.copy(file.getInputStream(), storedFilePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Unable to store task attachment");
        }

        TaskAttachment attachment = TaskAttachment.builder()
                .task(task)
                .originalFileName(originalFileName)
                .storedFileName(storedFileName)
                .contentType(resolveContentType(file))
                .fileSize(file.getSize())
                .storagePath(storedFilePath.toString())
                .uploadedByUserId(principal.getUserId())
                .uploadedByName(principal.getFirstName() + " " + principal.getLastName())
                .build();
        attachment.setCompanyId(principal.getCompanyId());
        return toTaskAttachmentResponse(taskAttachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public List<TaskAttachmentResponse> getTaskAttachments(AuthenticatedUser principal, Long taskId) {
        Task task = getTaskForCompany(taskId, principal.getCompanyId());
        ensureTaskAccess(principal, task, false);
        return getAttachments(taskId, principal.getCompanyId());
    }

    @Transactional(readOnly = true)
    public TaskAttachmentDownload downloadAttachment(AuthenticatedUser principal, Long taskId, Long taskAttachmentId) {
        Task task = getTaskForCompany(taskId, principal.getCompanyId());
        ensureTaskAccess(principal, task, false);
        TaskAttachment attachment = taskAttachmentRepository.findByTaskAttachmentIdAndTask_TaskIdAndCompanyIdAndDeletedAtIsNull(
                        taskAttachmentId,
                        taskId,
                        principal.getCompanyId()
                )
                .orElseThrow(() -> new ResourceNotFoundException("Task attachment not found for the provided tenant"));

        try {
            Resource resource = new UrlResource(Paths.get(attachment.getStoragePath()).normalize().toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Task attachment file was not found");
            }
            return new TaskAttachmentDownload(resource, attachment.getContentType(), attachment.getOriginalFileName());
        } catch (MalformedURLException exception) {
            throw new ResourceNotFoundException("Task attachment file was not found");
        }
    }

    private List<TaskResponse> getTasksForProject(Long projectId, Long companyId) {
        return taskRepository.findByProject_ProjectIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(projectId, companyId).stream()
                .map(task -> toTaskResponse(task, getComments(task.getTaskId(), companyId), getAttachments(task.getTaskId(), companyId)))
                .toList();
    }

    private List<TaskCommentResponse> getComments(Long taskId, Long companyId) {
        return taskCommentRepository.findByTask_TaskIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtAsc(taskId, companyId).stream()
                .map(this::toTaskCommentResponse)
                .toList();
    }

    private List<TaskAttachmentResponse> getAttachments(Long taskId, Long companyId) {
        return taskAttachmentRepository.findByTask_TaskIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(taskId, companyId).stream()
                .map(this::toTaskAttachmentResponse)
                .toList();
    }

    private Project getProjectForCompany(Long projectId, Long companyId) {
        return projectRepository.findByProjectIdAndCompanyIdAndDeletedAtIsNull(projectId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found for the provided tenant"));
    }

    private Task getTaskForCompany(Long taskId, Long companyId) {
        return taskRepository.findByTaskIdAndCompanyIdAndDeletedAtIsNull(taskId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found for the provided tenant"));
    }

    private Employee getEmployeeForCompany(Long employeeId, Long companyId) {
        return employeeRepository.findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(employeeId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for the provided tenant"));
    }

    private void ensureTaskAccess(AuthenticatedUser principal, Task task, boolean requireStatusWrite) {
        if (hasManagementAccess(principal)) {
            return;
        }
        if (task.getAssignee() != null && task.getAssignee().getEmail().equalsIgnoreCase(principal.getEmail())) {
            return;
        }
        throw new BadRequestException(requireStatusWrite
                ? "You are not allowed to update status for this task"
                : "You are not allowed to access this task");
    }

    private void requireManagementAccess(AuthenticatedUser principal) {
        if (!hasManagementAccess(principal)) {
            throw new BadRequestException("You are not allowed to manage projects and tasks");
        }
    }

    private boolean hasManagementAccess(AuthenticatedUser principal) {
        return principal.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(RoleName::valueOf)
                .anyMatch(MANAGEMENT_ROLES::contains);
    }

    private void validateProjectDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("Project end date cannot be before start date");
        }
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Task attachment file is required");
        }
        if (file.getSize() > taskAttachmentMaxSizeBytes) {
            throw new BadRequestException("Task attachment exceeds the maximum allowed size");
        }
        String extension = fileExtension(sanitizeFileName(file.getOriginalFilename()));
        if (!ALLOWED_ATTACHMENT_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Task attachment type is not supported");
        }
    }

    private String sanitizeFileName(String fileName) {
        String cleaned = StringUtils.hasText(fileName) ? fileName.trim() : "attachment";
        return cleaned.replace('\\', '_').replace('/', '_').replace("..", "_");
    }

    private String fileExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(extensionIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String resolveContentType(MultipartFile file) {
        return StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private ProjectResponse toProjectResponse(Project project, List<TaskResponse> tasks) {
        Employee owner = project.getOwner();
        return ProjectResponse.builder()
                .projectId(project.getProjectId())
                .companyId(project.getCompanyId())
                .projectName(project.getProjectName())
                .projectCode(project.getProjectCode())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .active(project.isActive())
                .ownerEmployeeId(owner == null ? null : owner.getEmployeeId())
                .ownerEmployeeName(owner == null ? null : owner.getFirstName() + " " + owner.getLastName())
                .tasks(tasks)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private TaskResponse toTaskResponse(Task task, List<TaskCommentResponse> comments, List<TaskAttachmentResponse> attachments) {
        Employee assignee = task.getAssignee();
        return TaskResponse.builder()
                .taskId(task.getTaskId())
                .companyId(task.getCompanyId())
                .projectId(task.getProject().getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .assigneeEmployeeId(assignee == null ? null : assignee.getEmployeeId())
                .assigneeName(assignee == null ? null : assignee.getFirstName() + " " + assignee.getLastName())
                .comments(comments)
                .attachments(attachments)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private TaskCommentResponse toTaskCommentResponse(TaskComment comment) {
        return TaskCommentResponse.builder()
                .taskCommentId(comment.getTaskCommentId())
                .taskId(comment.getTask().getTaskId())
                .companyId(comment.getCompanyId())
                .commentText(comment.getCommentText())
                .commentedByUserId(comment.getCommentedByUserId())
                .commentedByName(comment.getCommentedByName())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private TaskAttachmentResponse toTaskAttachmentResponse(TaskAttachment attachment) {
        return TaskAttachmentResponse.builder()
                .taskAttachmentId(attachment.getTaskAttachmentId())
                .taskId(attachment.getTask().getTaskId())
                .companyId(attachment.getCompanyId())
                .originalFileName(attachment.getOriginalFileName())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .uploadedByName(attachment.getUploadedByName())
                .downloadUrl("/api/v1/tasks/" + attachment.getTask().getTaskId() + "/attachments/" + attachment.getTaskAttachmentId() + "/download")
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    public record TaskAttachmentDownload(Resource resource, String contentType, String fileName) {
    }
}
