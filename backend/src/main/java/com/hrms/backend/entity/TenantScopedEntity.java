package com.hrms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@MappedSuperclass
public abstract class TenantScopedEntity extends AuditableEntity {

    @Column(name = "company_id", nullable = false)
    private Long companyId;
}
