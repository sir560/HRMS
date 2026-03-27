package com.hrms.backend.repository;

import com.hrms.backend.entity.Payroll;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.designationEntity", "salaryStructure"})
    List<Payroll> findByCompanyIdAndPayrollMonthAndPayrollYearAndDeletedAtIsNullOrderByEmployee_FirstNameAscEmployee_LastNameAsc(
            Long companyId,
            Integer payrollMonth,
            Integer payrollYear
    );

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.designationEntity", "salaryStructure"})
    Optional<Payroll> findByCompanyIdAndEmployee_EmployeeIdAndPayrollMonthAndPayrollYearAndDeletedAtIsNull(
            Long companyId,
            Long employeeId,
            Integer payrollMonth,
            Integer payrollYear
    );

    @EntityGraph(attributePaths = {"employee", "employee.department", "employee.designationEntity", "salaryStructure"})
    Optional<Payroll> findFirstByCompanyIdAndEmployee_EmployeeIdAndDeletedAtIsNullOrderByPayrollYearDescPayrollMonthDesc(
            Long companyId,
            Long employeeId
    );
}
