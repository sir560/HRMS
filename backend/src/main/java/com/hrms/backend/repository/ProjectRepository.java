package com.hrms.backend.repository;

import com.hrms.backend.entity.Project;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByCompanyIdAndProjectCodeIgnoreCaseAndDeletedAtIsNull(Long companyId, String projectCode);

    @EntityGraph(attributePaths = {"owner"})
    List<Project> findByCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long companyId);

    @EntityGraph(attributePaths = {"owner"})
    Optional<Project> findByProjectIdAndCompanyIdAndDeletedAtIsNull(Long projectId, Long companyId);
}
