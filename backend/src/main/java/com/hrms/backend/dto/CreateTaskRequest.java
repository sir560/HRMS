package com.hrms.backend.dto;

import com.hrms.backend.entity.TaskPriority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 160, message = "Task title must not exceed 160 characters")
    private String title;

    @Size(max = 1000, message = "Task description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Task priority is required")
    private TaskPriority priority;

    private Long assigneeEmployeeId;

    @FutureOrPresent(message = "Due date cannot be in the past")
    private LocalDate dueDate;
}
