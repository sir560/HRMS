package com.hrms.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TaskCommentResponse {

    private final Long taskCommentId;
    private final Long taskId;
    private final Long companyId;
    private final String commentText;
    private final Long commentedByUserId;
    private final String commentedByName;
    private final Instant createdAt;
}
