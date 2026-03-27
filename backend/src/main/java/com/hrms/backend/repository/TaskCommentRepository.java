package com.hrms.backend.repository;

import com.hrms.backend.entity.TaskComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    List<TaskComment> findByTask_TaskIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long taskId, Long companyId);
}
