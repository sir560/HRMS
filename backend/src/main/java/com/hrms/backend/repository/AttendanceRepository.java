package com.hrms.backend.repository;

import com.hrms.backend.entity.Attendance;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDate(Long companyId, Long employeeId, LocalDate attendanceDate);

    Optional<Attendance> findByAttendanceIdAndCompanyId(Long attendanceId, Long companyId);

    List<Attendance> findByCompanyIdOrderByAttendanceDateDescClockInAtDesc(Long companyId);

    List<Attendance> findByCompanyIdAndAttendanceDateOrderByClockInAtDesc(Long companyId, LocalDate attendanceDate);

    List<Attendance> findByCompanyIdAndEmployee_EmployeeIdOrderByAttendanceDateDescClockInAtDesc(Long companyId, Long employeeId);

    List<Attendance> findByCompanyIdAndAttendanceDateBetweenOrderByAttendanceDateDescClockInAtDesc(
            Long companyId,
            LocalDate dateFrom,
            LocalDate dateTo
    );

    List<Attendance> findByCompanyIdAndEmployee_EmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDescClockInAtDesc(
            Long companyId,
            Long employeeId,
            LocalDate dateFrom,
            LocalDate dateTo
    );
}
