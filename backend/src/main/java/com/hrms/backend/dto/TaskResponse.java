package com.hrms.backend.dto;

import com.hrms.backend.entity.TaskPriority;
import com.hrms.backend.entity.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TaskResponse {

    private final Long taskId;
    private final Long companyId;
    private final Long projectId;
    private final String title;
    private final String description;
    private final TaskStatus status;
    private final TaskPriority priority;
    private final LocalDate dueDate;
    private final Long assigneeEmployeeId;
    private final String assigneeName;
    private final List<TaskCommentResponse> comments;
    private final List<TaskAttachmentResponse> attachments;
    private final Instant createdAt;
    private final Instant updatedAt;
}
