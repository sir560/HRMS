package com.hrms.backend.repository;

import com.hrms.backend.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByCompanyIdAndEmailIgnoreCase(Long companyId, String email);

    @EntityGraph(attributePaths = {"company", "roles"})
    Optional<User> findByEmailIgnoreCaseAndCompany_CompanyCodeIgnoreCaseAndActiveTrue(String email, String companyCode);

    @EntityGraph(attributePaths = {"company", "roles"})
    Optional<User> findByUserIdAndCompanyIdAndActiveTrue(Long userId, Long companyId);

    @EntityGraph(attributePaths = {"company", "roles"})
    Optional<User> findByEmailIgnoreCaseAndCompany_CompanyCodeIgnoreCase(String email, String companyCode);
}
