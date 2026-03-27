package com.hrms.backend.repository;

import com.hrms.backend.entity.Role;
import com.hrms.backend.entity.RoleName;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    List<Role> findByCompanyId(Long companyId);

    Optional<Role> findByCompanyIdAndRoleName(Long companyId, RoleName roleName);
}
