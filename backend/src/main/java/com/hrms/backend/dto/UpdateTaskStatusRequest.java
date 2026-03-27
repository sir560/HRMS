package com.hrms.backend.dto;

import com.hrms.backend.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTaskStatusRequest {

    @NotNull(message = "Task status is required")
    private TaskStatus status;
}
