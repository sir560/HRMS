package com.hrms.backend.repository;

import com.hrms.backend.entity.SalaryStructure;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {

    Optional<SalaryStructure> findByCompanyIdAndEmployee_EmployeeIdAndActiveTrueAndDeletedAtIsNull(Long companyId, Long employeeId);
}
