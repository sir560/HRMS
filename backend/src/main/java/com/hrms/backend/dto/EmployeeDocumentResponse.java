package com.hrms.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmployeeDocumentResponse {

    private final Long employeeDocumentId;
    private final Long employeeId;
    private final Long companyId;
    private final String documentType;
    private final String originalFileName;
    private final String contentType;
    private final long fileSize;
    private final String downloadUrl;
    private final Instant createdAt;
    private final Instant updatedAt;
}
