package com.hrms.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAttendanceRequest {

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotNull(message = "Clock-in time is required")
    private Instant clockInAt;

    private Instant clockOutAt;

    private Boolean workFromHome;

    @Size(max = 255, message = "Notes must not exceed 255 characters")
    private String notes;
}
