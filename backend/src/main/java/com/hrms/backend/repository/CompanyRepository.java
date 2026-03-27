package com.hrms.backend.repository;

import com.hrms.backend.entity.Company;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    boolean existsByCompanyCodeIgnoreCase(String companyCode);

    boolean existsByPrimaryEmailIgnoreCase(String primaryEmail);

    Optional<Company> findByCompanyCodeIgnoreCase(String companyCode);
}
