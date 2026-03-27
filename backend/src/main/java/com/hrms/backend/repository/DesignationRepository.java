package com.hrms.backend.repository;

import com.hrms.backend.entity.Designation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DesignationRepository extends JpaRepository<Designation, Long> {

    boolean existsByCompanyIdAndDesignationCodeIgnoreCaseAndDeletedAtIsNull(Long companyId, String designationCode);

    boolean existsByCompanyIdAndDesignationNameIgnoreCaseAndDeletedAtIsNull(Long companyId, String designationName);

    Optional<Designation> findByDesignationIdAndCompanyIdAndDeletedAtIsNull(Long designationId, Long companyId);

    List<Designation> findByCompanyIdAndDeletedAtIsNullOrderByDesignationNameAsc(Long companyId);
}
