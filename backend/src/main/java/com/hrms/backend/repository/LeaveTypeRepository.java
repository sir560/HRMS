package com.hrms.backend.repository;

import com.hrms.backend.entity.LeaveType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    List<LeaveType> findByCompanyIdAndDeletedAtIsNullAndActiveTrueOrderByLeaveNameAsc(Long companyId);

    Optional<LeaveType> findByLeaveTypeIdAndCompanyIdAndDeletedAtIsNullAndActiveTrue(Long leaveTypeId, Long companyId);

    boolean existsByCompanyIdAndLeaveCodeIgnoreCaseAndDeletedAtIsNull(Long companyId, String leaveCode);
}
