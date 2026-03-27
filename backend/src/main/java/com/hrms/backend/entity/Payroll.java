package com.hrms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "payroll",
        uniqueConstraints = @UniqueConstraint(name = "uk_payroll_company_employee_period", columnNames = {"company_id", "employee_id", "payroll_month", "payroll_year"})
)
public class Payroll extends TenantScopedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payroll_id")
    private Long payrollId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_structure_id", nullable = false)
    private SalaryStructure salaryStructure;

    @Column(name = "payroll_month", nullable = false)
    private Integer payrollMonth;

    @Column(name = "payroll_year", nullable = false)
    private Integer payrollYear;

    @Column(name = "days_in_month", nullable = false)
    private Integer daysInMonth;

    @Column(name = "paid_days", nullable = false, precision = 6, scale = 2)
    private BigDecimal paidDays;

    @Column(name = "lop_days", nullable = false, precision = 6, scale = 2)
    private BigDecimal lopDays;

    @Column(name = "gross_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "pf_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal pfAmount;

    @Column(name = "esi_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal esiAmount;

    @Column(name = "tds_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal tdsAmount;

    @Column(name = "lop_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal lopAmount;

    @Column(name = "total_deductions", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PayrollStatus status;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
