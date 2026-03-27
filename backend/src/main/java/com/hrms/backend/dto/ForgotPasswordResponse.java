package com.hrms.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ForgotPasswordResponse {

    private final String companyCode;
    private final String email;
    private final String otp;
}