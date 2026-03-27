package com.hrms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "leave_types",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_leave_types_company_code", columnNames = {"company_id", "leave_code"}),
                @UniqueConstraint(name = "uk_leave_types_company_name", columnNames = {"company_id", "leave_name"})
        }
)
public class LeaveType extends TenantScopedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leave_type_id")
    private Long leaveTypeId;

    @Column(name = "leave_code", nullable = false, length = 20)
    private String leaveCode;

    @Column(name = "leave_name", nullable = false, length = 120)
    private String leaveName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "default_days", nullable = false)
    private Integer defaultDays;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @PrePersist
    public void normalize() {
        if (leaveCode != null) {
            leaveCode = leaveCode.trim().toUpperCase();
        }
        if (leaveName != null) {
            leaveName = leaveName.trim();
        }
    }
}
