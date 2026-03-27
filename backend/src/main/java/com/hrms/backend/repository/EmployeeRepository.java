package com.hrms.backend.repository;

import com.hrms.backend.entity.Employee;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    boolean existsByCompanyIdAndEmployeeCodeIgnoreCaseAndDeletedAtIsNull(Long companyId, String employeeCode);

    boolean existsByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(Long companyId, String email);

    @EntityGraph(attributePaths = {"department", "designationEntity"})
    Optional<Employee> findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(Long employeeId, Long companyId);

    default Optional<Employee> findByEmployeeIdAndCompanyId(Long employeeId, Long companyId) {
        return findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(employeeId, companyId);
    }

    Optional<Employee> findByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(Long companyId, String email);

    default Optional<Employee> findByCompanyIdAndEmailIgnoreCase(Long companyId, String email) {
        return findByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(companyId, email);
    }

    long countByDesignationEntity_DesignationIdAndCompanyIdAndDeletedAtIsNull(Long designationId, Long companyId);

    long countByCompanyIdAndDeletedAtIsNullAndActiveTrue(Long companyId);
}
