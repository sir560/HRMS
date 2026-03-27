package com.hrms.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
        name = "designations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_designations_company_code", columnNames = {"company_id", "designation_code"}),
                @UniqueConstraint(name = "uk_designations_company_name", columnNames = {"company_id", "designation_name"})
        }
)
public class Designation extends TenantScopedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "designation_id")
    private Long designationId;

    @Column(name = "designation_name", nullable = false, length = 120)
    private String designationName;

    @Column(name = "designation_code", nullable = false, length = 40)
    private String designationCode;

    @Column(name = "description", length = 255)
    private String description;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Builder.Default
    @OneToMany(mappedBy = "designation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Employee> employees = new ArrayList<>();

    @PrePersist
    public void normalize() {
        if (designationCode != null) {
            designationCode = designationCode.trim().toUpperCase();
        }
        if (designationName != null) {
            designationName = designationName.trim();
        }
    }
}
