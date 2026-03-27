package com.hrms.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private final String accessToken;
    private final String refreshToken;
    private final String tokenType;
    private final Instant accessTokenExpiresAt;
    private final Instant refreshTokenExpiresAt;
    private final UserProfileDto user;
}
