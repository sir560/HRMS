package com.hrms.backend.repository;

import com.hrms.backend.entity.Department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    boolean existsByCompanyIdAndDepartmentCodeIgnoreCase(Long companyId, String departmentCode);

    boolean existsByCompanyIdAndDepartmentNameIgnoreCase(Long companyId, String departmentName);

    Optional<Department> findByDepartmentIdAndCompanyId(Long departmentId, Long companyId);

    List<Department> findByCompanyIdOrderByDepartmentNameAsc(Long companyId);
}