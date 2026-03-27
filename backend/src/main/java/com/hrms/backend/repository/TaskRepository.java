package com.hrms.backend.repository;

import com.hrms.backend.entity.Task;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = {"project", "assignee"})
    List<Task> findByProject_ProjectIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long projectId, Long companyId);

    @EntityGraph(attributePaths = {"project", "assignee"})
    Optional<Task> findByTaskIdAndCompanyIdAndDeletedAtIsNull(Long taskId, Long companyId);
}
