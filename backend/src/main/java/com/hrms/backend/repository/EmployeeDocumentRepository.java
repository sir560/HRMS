package com.hrms.backend.repository;

import com.hrms.backend.entity.EmployeeDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, Long> {

    List<EmployeeDocument> findByEmployee_EmployeeIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long employeeId, Long companyId);

    Optional<EmployeeDocument> findByEmployeeDocumentIdAndEmployee_EmployeeIdAndCompanyIdAndDeletedAtIsNull(
            Long employeeDocumentId,
            Long employeeId,
            Long companyId
    );
}
