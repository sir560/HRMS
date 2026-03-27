package com.hrms.backend.dto;

import com.hrms.backend.entity.RoleName;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileDto {

    private final Long userId;
    private final Long companyId;
    private final String companyCode;
    private final String companyName;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final boolean active;
    private final Set<RoleName> roles;
}
