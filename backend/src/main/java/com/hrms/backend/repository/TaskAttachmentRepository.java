package com.hrms.backend.repository;

import com.hrms.backend.entity.TaskAttachment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {

    List<TaskAttachment> findByTask_TaskIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long taskId, Long companyId);

    Optional<TaskAttachment> findByTaskAttachmentIdAndTask_TaskIdAndCompanyIdAndDeletedAtIsNull(Long taskAttachmentId, Long taskId, Long companyId);
}
