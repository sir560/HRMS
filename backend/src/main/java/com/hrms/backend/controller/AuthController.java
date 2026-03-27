package com.hrms.backend.controller;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.ApiResponse;
import com.hrms.backend.dto.AuthResponse;
import com.hrms.backend.dto.ForgotPasswordRequest;
import com.hrms.backend.dto.ForgotPasswordResponse;
import com.hrms.backend.dto.LoginRequest;
import com.hrms.backend.dto.LogoutRequest;
import com.hrms.backend.dto.RefreshTokenRequest;
import com.hrms.backend.dto.RegisterCompanyRequest;
import com.hrms.backend.dto.ResetPasswordRequest;
import com.hrms.backend.dto.UserProfileDto;
import com.hrms.backend.service.AuthService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register-company")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCompany(@Valid @RequestBody RegisterCompanyRequest request) {
        AuthResponse response = authService.registerCompany(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Company registered successfully",
                response,
                Map.of("tenant", response.getUser().getCompanyCode())
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Login successful",
                response,
                Map.of("tenant", response.getUser().getCompanyCode())
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Token refreshed successfully",
                response,
                Map.of("tenant", response.getUser().getCompanyCode())
        ));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody(required = false) LogoutRequest request
    ) {
        authService.logout(authenticatedUser, request == null ? new LogoutRequest() : request);
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = authService.forgotPassword(request);
        Map<String, Object> meta = new HashMap<>();
        meta.put("tenant", response.getCompanyCode());
        meta.put("delivery", response.getOtp() == null ? "masked" : "development-preview");
        return ResponseEntity.ok(ApiResponse.success(
                "Password reset OTP generated successfully",
                response,
                meta
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileDto>> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        UserProfileDto response = authService.me(authenticatedUser);
        return ResponseEntity.ok(ApiResponse.success(
                "Authenticated user fetched successfully",
                response,
                Map.of("tenant", response.getCompanyCode())
        ));
    }
}