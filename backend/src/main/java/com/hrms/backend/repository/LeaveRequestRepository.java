package com.hrms.backend.repository;

import com.hrms.backend.entity.LeaveRequest;
import com.hrms.backend.entity.LeaveRequestStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    @EntityGraph(attributePaths = {"employee", "employee.department", "leaveType"})
    List<LeaveRequest> findByCompanyIdAndEmployee_EmployeeIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long companyId, Long employeeId);

    @EntityGraph(attributePaths = {"employee", "employee.department", "leaveType"})
    List<LeaveRequest> findByCompanyIdAndStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(Long companyId, Collection<LeaveRequestStatus> statuses);

    @EntityGraph(attributePaths = {"employee", "employee.department", "leaveType"})
    Optional<LeaveRequest> findByLeaveRequestIdAndCompanyIdAndDeletedAtIsNull(Long leaveRequestId, Long companyId);

    boolean existsByCompanyIdAndEmployee_EmployeeIdAndDeletedAtIsNullAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long companyId,
            Long employeeId,
            Collection<LeaveRequestStatus> statuses,
            java.time.LocalDate endDate,
            java.time.LocalDate startDate
    );
}
