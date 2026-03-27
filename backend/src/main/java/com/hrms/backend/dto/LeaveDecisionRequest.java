package com.hrms.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeaveDecisionRequest {

    @Size(max = 255, message = "Review comment must not exceed 255 characters")
    private String reviewComment;
}
