package com.hrms.backend.service;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.PayrollResponse;
import com.hrms.backend.dto.PayrollRunEmployeeRequest;
import com.hrms.backend.dto.PayrollRunRequest;
import com.hrms.backend.dto.PayrollSlipResponse;
import com.hrms.backend.entity.Company;
import com.hrms.backend.entity.Employee;
import com.hrms.backend.entity.Payroll;
import com.hrms.backend.entity.PayrollStatus;
import com.hrms.backend.entity.RoleName;
import com.hrms.backend.entity.SalaryStructure;
import com.hrms.backend.exception.BadRequestException;
import com.hrms.backend.exception.ResourceNotFoundException;
import com.hrms.backend.repository.CompanyRepository;
import com.hrms.backend.repository.EmployeeRepository;
import com.hrms.backend.repository.PayrollRepository;
import com.hrms.backend.repository.SalaryStructureRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private static final Set<RoleName> MANAGEMENT_ROLES = Set.of(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR, RoleName.MANAGER);
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final PayrollRepository payrollRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public List<PayrollResponse> runPayroll(AuthenticatedUser principal, PayrollRunRequest request) {
        YearMonth period = YearMonth.of(request.getYear(), request.getMonth());
        Instant generatedAt = Instant.now();

        return request.getEmployees().stream()
                .map(input -> runPayrollForEmployee(principal, period, input, generatedAt))
                .map(this::toPayrollResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PayrollResponse> getPayrollForPeriod(AuthenticatedUser principal, Integer month, Integer year) {
        validatePeriod(month, year);

        if (hasManagementAccess(principal)) {
            return payrollRepository.findByCompanyIdAndPayrollMonthAndPayrollYearAndDeletedAtIsNullOrderByEmployee_FirstNameAscEmployee_LastNameAsc(
                            principal.getCompanyId(),
                            month,
                            year
                    )
                    .stream()
                    .map(this::toPayrollResponse)
                    .toList();
        }

        Employee employee = resolveOwnEmployee(principal);
        return payrollRepository.findByCompanyIdAndEmployee_EmployeeIdAndPayrollMonthAndPayrollYearAndDeletedAtIsNull(
                        principal.getCompanyId(),
                        employee.getEmployeeId(),
                        month,
                        year
                )
                .stream()
                .map(this::toPayrollResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PayrollSlipResponse getSalarySlip(AuthenticatedUser principal, Long employeeId, Integer month, Integer year) {
        Employee employee = resolveAccessibleEmployee(principal, employeeId);
        Payroll payroll = month != null && year != null
                ? payrollRepository.findByCompanyIdAndEmployee_EmployeeIdAndPayrollMonthAndPayrollYearAndDeletedAtIsNull(
                                principal.getCompanyId(),
                                employee.getEmployeeId(),
                                month,
                                year
                        )
                        .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found for the selected period"))
                : payrollRepository.findFirstByCompanyIdAndEmployee_EmployeeIdAndDeletedAtIsNullOrderByPayrollYearDescPayrollMonthDesc(
                                principal.getCompanyId(),
                                employee.getEmployeeId()
                        )
                        .orElseThrow(() -> new ResourceNotFoundException("Payroll record not found for the selected employee"));

        Company company = companyRepository.findById(principal.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found for the provided tenant"));
        return toPayrollSlipResponse(company, payroll);
    }

    private Payroll runPayrollForEmployee(
            AuthenticatedUser principal,
            YearMonth period,
            PayrollRunEmployeeRequest input,
            Instant generatedAt
    ) {
        Employee employee = employeeRepository.findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(input.getEmployeeId(), principal.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for the provided tenant"));

        SalaryStructure salaryStructure = upsertSalaryStructure(principal.getCompanyId(), employee, input, period.atDay(1));
        BigDecimal grossSalary = amount(input.getBasicSalary())
                .add(amount(input.getHra()))
                .add(amount(input.getSpecialAllowance()))
                .add(amount(input.getOtherAllowance()));
        BigDecimal pfAmount = percentageOf(amount(input.getBasicSalary()), input.getPfPercentage());
        BigDecimal esiAmount = percentageOf(grossSalary, input.getEsiPercentage());
        BigDecimal tdsAmount = percentageOf(grossSalary, input.getTdsPercentage());
        BigDecimal lopDays = scale(amount(input.getLopDays()));
        int daysInMonth = period.lengthOfMonth();
        BigDecimal lopAmount = scale(grossSalary.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP).multiply(lopDays));
        BigDecimal totalDeductions = scale(pfAmount.add(esiAmount).add(tdsAmount).add(lopAmount));
        BigDecimal netSalary = scale(grossSalary.subtract(totalDeductions).max(ZERO));
        BigDecimal paidDays = scale(BigDecimal.valueOf(daysInMonth).subtract(lopDays).max(BigDecimal.ZERO));

        Payroll payroll = payrollRepository.findByCompanyIdAndEmployee_EmployeeIdAndPayrollMonthAndPayrollYearAndDeletedAtIsNull(
                        principal.getCompanyId(),
                        employee.getEmployeeId(),
                        period.getMonthValue(),
                        period.getYear()
                )
                .orElseGet(() -> Payroll.builder()
                        .employee(employee)
                        .salaryStructure(salaryStructure)
                        .payrollMonth(period.getMonthValue())
                        .payrollYear(period.getYear())
                        .build());

        payroll.setCompanyId(principal.getCompanyId());
        payroll.setEmployee(employee);
        payroll.setSalaryStructure(salaryStructure);
        payroll.setDaysInMonth(daysInMonth);
        payroll.setPaidDays(paidDays);
        payroll.setLopDays(lopDays);
        payroll.setGrossSalary(scale(grossSalary));
        payroll.setPfAmount(pfAmount);
        payroll.setEsiAmount(esiAmount);
        payroll.setTdsAmount(tdsAmount);
        payroll.setLopAmount(lopAmount);
        payroll.setTotalDeductions(totalDeductions);
        payroll.setNetSalary(netSalary);
        payroll.setStatus(PayrollStatus.GENERATED);
        payroll.setNotes(trimToNull(input.getNotes()));
        payroll.setGeneratedAt(generatedAt);

        return payrollRepository.save(payroll);
    }

    private SalaryStructure upsertSalaryStructure(Long companyId, Employee employee, PayrollRunEmployeeRequest input, LocalDate effectiveFrom) {
        SalaryStructure salaryStructure = salaryStructureRepository.findByCompanyIdAndEmployee_EmployeeIdAndActiveTrueAndDeletedAtIsNull(
                        companyId,
                        employee.getEmployeeId()
                )
                .orElseGet(() -> SalaryStructure.builder()
                        .employee(employee)
                        .active(true)
                        .build());

        salaryStructure.setCompanyId(companyId);
        salaryStructure.setEmployee(employee);
        salaryStructure.setBasicSalary(scale(amount(input.getBasicSalary())));
        salaryStructure.setHra(scale(amount(input.getHra())));
        salaryStructure.setSpecialAllowance(scale(amount(input.getSpecialAllowance())));
        salaryStructure.setOtherAllowance(scale(amount(input.getOtherAllowance())));
        salaryStructure.setPfPercentage(scale(amount(input.getPfPercentage())));
        salaryStructure.setEsiPercentage(scale(amount(input.getEsiPercentage())));
        salaryStructure.setTdsPercentage(scale(amount(input.getTdsPercentage())));
        salaryStructure.setEffectiveFrom(effectiveFrom);
        salaryStructure.setActive(true);
        return salaryStructureRepository.save(salaryStructure);
    }

    private Employee resolveAccessibleEmployee(AuthenticatedUser principal, Long employeeId) {
        Employee employee = employeeRepository.findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(employeeId, principal.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for the provided tenant"));

        if (hasManagementAccess(principal)) {
            return employee;
        }
        if (employee.getEmail().equalsIgnoreCase(principal.getEmail())) {
            return employee;
        }
        throw new BadRequestException("You are not allowed to access payroll for this employee");
    }

    private Employee resolveOwnEmployee(AuthenticatedUser principal) {
        return employeeRepository.findByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(principal.getCompanyId(), principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for the authenticated user"));
    }

    private boolean hasManagementAccess(AuthenticatedUser principal) {
        return principal.getAuthorities().stream()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(RoleName::valueOf)
                .anyMatch(MANAGEMENT_ROLES::contains);
    }

    private PayrollResponse toPayrollResponse(Payroll payroll) {
        SalaryStructure salaryStructure = payroll.getSalaryStructure();
        Employee employee = payroll.getEmployee();
        return PayrollResponse.builder()
                .payrollId(payroll.getPayrollId())
                .companyId(payroll.getCompanyId())
                .payrollMonth(payroll.getPayrollMonth())
                .payrollYear(payroll.getPayrollYear())
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .departmentName(employee.getDepartment().getDepartmentName())
                .designation(employee.getDesignation())
                .basicSalary(salaryStructure.getBasicSalary())
                .hra(salaryStructure.getHra())
                .specialAllowance(salaryStructure.getSpecialAllowance())
                .otherAllowance(salaryStructure.getOtherAllowance())
                .pfPercentage(salaryStructure.getPfPercentage())
                .esiPercentage(salaryStructure.getEsiPercentage())
                .tdsPercentage(salaryStructure.getTdsPercentage())
                .paidDays(payroll.getPaidDays())
                .lopDays(payroll.getLopDays())
                .grossSalary(payroll.getGrossSalary())
                .pfAmount(payroll.getPfAmount())
                .esiAmount(payroll.getEsiAmount())
                .tdsAmount(payroll.getTdsAmount())
                .lopAmount(payroll.getLopAmount())
                .totalDeductions(payroll.getTotalDeductions())
                .netSalary(payroll.getNetSalary())
                .status(payroll.getStatus())
                .notes(payroll.getNotes())
                .generatedAt(payroll.getGeneratedAt())
                .build();
    }

    private PayrollSlipResponse toPayrollSlipResponse(Company company, Payroll payroll) {
        Employee employee = payroll.getEmployee();
        SalaryStructure salaryStructure = payroll.getSalaryStructure();
        return PayrollSlipResponse.builder()
                .companyId(company.getCompanyId())
                .companyName(company.getCompanyName())
                .payrollMonth(payroll.getPayrollMonth())
                .payrollYear(payroll.getPayrollYear())
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .departmentName(employee.getDepartment().getDepartmentName())
                .designation(employee.getDesignation())
                .basicSalary(salaryStructure.getBasicSalary())
                .hra(salaryStructure.getHra())
                .specialAllowance(salaryStructure.getSpecialAllowance())
                .otherAllowance(salaryStructure.getOtherAllowance())
                .grossSalary(payroll.getGrossSalary())
                .pfAmount(payroll.getPfAmount())
                .esiAmount(payroll.getEsiAmount())
                .tdsAmount(payroll.getTdsAmount())
                .lopAmount(payroll.getLopAmount())
                .totalDeductions(payroll.getTotalDeductions())
                .netSalary(payroll.getNetSalary())
                .paidDays(payroll.getPaidDays())
                .lopDays(payroll.getLopDays())
                .status(payroll.getStatus())
                .notes(payroll.getNotes())
                .generatedAt(payroll.getGeneratedAt())
                .build();
    }

    private void validatePeriod(Integer month, Integer year) {
        if (month == null || month < 1 || month > 12) {
            throw new BadRequestException("Payroll month must be between 1 and 12");
        }
        if (year == null || year < 2000 || year > 2100) {
            throw new BadRequestException("Payroll year is invalid");
        }
    }

    private BigDecimal percentageOf(BigDecimal amount, BigDecimal percentage) {
        return scale(amount.multiply(scale(percentage)).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP));
    }

    private BigDecimal amount(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
