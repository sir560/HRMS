package com.hrms.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TaskAttachmentResponse {

    private final Long taskAttachmentId;
    private final Long taskId;
    private final Long companyId;
    private final String originalFileName;
    private final String contentType;
    private final long fileSize;
    private final String uploadedByName;
    private final String downloadUrl;
    private final Instant createdAt;
}
