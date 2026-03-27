package com.hrms.backend.service;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.AuthResponse;
import com.hrms.backend.dto.ForgotPasswordRequest;
import com.hrms.backend.dto.ForgotPasswordResponse;
import com.hrms.backend.dto.LoginRequest;
import com.hrms.backend.dto.LogoutRequest;
import com.hrms.backend.dto.RefreshTokenRequest;
import com.hrms.backend.dto.RegisterCompanyRequest;
import com.hrms.backend.dto.ResetPasswordRequest;
import com.hrms.backend.dto.UserProfileDto;
import com.hrms.backend.entity.Company;
import com.hrms.backend.entity.RefreshToken;
import com.hrms.backend.entity.Role;
import com.hrms.backend.entity.RoleName;
import com.hrms.backend.entity.User;
import com.hrms.backend.exception.BadRequestException;
import com.hrms.backend.exception.ResourceNotFoundException;
import com.hrms.backend.exception.UnauthorizedException;
import com.hrms.backend.repository.CompanyRepository;
import com.hrms.backend.repository.RefreshTokenRepository;
import com.hrms.backend.repository.RoleRepository;
import com.hrms.backend.repository.UserRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LeaveService leaveService;

    @Value("${app.auth.password-reset-otp-expiration-minutes}")
    private long passwordResetOtpExpirationMinutes;

    @Value("${app.auth.expose-reset-otp}")
    private boolean exposeResetOtp;

    @Transactional
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
        String normalizedCompanyCode = normalizeCompanyCode(request.getCompanyCode());
        String normalizedAdminEmail = normalizeEmail(request.getAdminEmail());

        if (companyRepository.existsByCompanyCodeIgnoreCase(normalizedCompanyCode)) {
            throw new BadRequestException("Company code already exists");
        }
        if (companyRepository.existsByPrimaryEmailIgnoreCase(normalizedAdminEmail)) {
            throw new BadRequestException("Primary company email already exists");
        }

        Company company = companyRepository.save(Company.builder()
                .companyName(request.getCompanyName().trim())
                .companyCode(normalizedCompanyCode)
                .primaryEmail(normalizedAdminEmail)
                .phoneNumber(trimToNull(request.getPhoneNumber()))
                .active(true)
                .build());

        Map<RoleName, Role> rolesByName = roleRepository.saveAll(Arrays.stream(RoleName.values())
                        .map(roleName -> {
                            Role role = Role.builder()
                                    .roleName(roleName)
                                    .description(roleName.name().replace('_', ' ') + " role")
                                    .build();
                            role.setCompanyId(company.getCompanyId());
                            return role;
                        })
                        .collect(Collectors.toList()))
                .stream()
                .collect(Collectors.toMap(Role::getRoleName, Function.identity()));

        User adminUser = User.builder()
                .firstName(request.getAdminFirstName().trim())
                .lastName(request.getAdminLastName().trim())
                .email(normalizedAdminEmail)
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .active(true)
                .roles(new HashSet<>())
                .build();
        adminUser.setCompanyId(company.getCompanyId());
        adminUser.setCompany(company);
        adminUser.setRoles(Set.of(rolesByName.get(RoleName.SUPER_ADMIN)));
        adminUser = userRepository.save(adminUser);
        leaveService.seedDefaultLeaveTypes(company.getCompanyId());

        return issueTokens(adminUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCaseAndCompany_CompanyCodeIgnoreCaseAndActiveTrue(
                        normalizeEmail(request.getEmail()), normalizeCompanyCode(request.getCompanyCode()))
                .orElseThrow(() -> new UnauthorizedException("Invalid company code, email, or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid company code, email, or password");
        }

        user.setLastLoginAt(Instant.now());
        user = userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken storedRefreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid or revoked"));

        if (storedRefreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.revokeByToken(request.getRefreshToken());
            throw new UnauthorizedException("Refresh token has expired");
        }

        if (!jwtService.isRefreshToken(request.getRefreshToken())) {
            throw new UnauthorizedException("Refresh token is invalid");
        }

        Long userId = jwtService.extractUserId(request.getRefreshToken());
        Long companyId = jwtService.extractCompanyId(request.getRefreshToken());
        User user = loadActiveUser(userId, companyId);

        if (!storedRefreshToken.getUser().getUserId().equals(user.getUserId())) {
            throw new UnauthorizedException("Refresh token does not belong to the authenticated user");
        }

        refreshTokenRepository.revokeByToken(request.getRefreshToken());
        return issueTokens(user);
    }

    @Transactional
    public void logout(AuthenticatedUser principal, LogoutRequest request) {
        User user = loadActiveUser(principal.getUserId(), principal.getCompanyId());
        refreshTokenRepository.revokeAllActiveTokensByUserId(user.getUserId());

        if (request != null && StringUtils.hasText(request.getRefreshToken())) {
            refreshTokenRepository.findByToken(request.getRefreshToken()).ifPresent(token -> {
                if (token.getUser().getUserId().equals(user.getUserId())) {
                    refreshTokenRepository.revokeByToken(request.getRefreshToken());
                }
            });
        }
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCaseAndCompany_CompanyCodeIgnoreCase(
                        normalizeEmail(request.getEmail()), normalizeCompanyCode(request.getCompanyCode()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found for the provided company"));

        String otp = generateOtp();
        user.setPasswordResetOtp(otp);
        user.setPasswordResetExpiresAt(Instant.now().plus(passwordResetOtpExpirationMinutes, ChronoUnit.MINUTES));
        userRepository.save(user);

        return ForgotPasswordResponse.builder()
                .companyCode(user.getCompany().getCompanyCode())
                .email(user.getEmail())
                .otp(exposeResetOtp ? otp : null)
                .build();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCaseAndCompany_CompanyCodeIgnoreCase(
                        normalizeEmail(request.getEmail()), normalizeCompanyCode(request.getCompanyCode()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found for the provided company"));

        if (!StringUtils.hasText(user.getPasswordResetOtp()) || user.getPasswordResetExpiresAt() == null) {
            throw new BadRequestException("Password reset OTP has not been generated");
        }
        if (user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            user.setPasswordResetOtp(null);
            user.setPasswordResetExpiresAt(null);
            userRepository.save(user);
            throw new BadRequestException("Password reset OTP has expired");
        }
        if (!user.getPasswordResetOtp().equals(request.getOtp().trim())) {
            throw new BadRequestException("Invalid password reset OTP");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetOtp(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);
        refreshTokenRepository.revokeAllActiveTokensByUserId(user.getUserId());
    }

    @Transactional(readOnly = true)
    public UserProfileDto me(AuthenticatedUser principal) {
        User user = loadActiveUser(principal.getUserId(), principal.getCompanyId());
        return toUserProfile(user);
    }

    @Transactional(readOnly = true)
    public User loadActiveUser(Long userId, Long companyId) {
        return userRepository.findByUserIdAndCompanyIdAndActiveTrue(userId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for the provided tenant"));
    }

    private AuthResponse issueTokens(User user) {
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
        refreshTokenRepository.revokeAllActiveTokensByUserId(user.getUserId());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = jwtService.generateRefreshToken(user);
        Instant accessExpiresAt = jwtService.getAccessTokenExpiryInstant();
        Instant refreshExpiresAt = jwtService.getRefreshTokenExpiryInstant();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(refreshExpiresAt)
                .revoked(false)
                .build();
        refreshToken.setCompanyId(user.getCompanyId());
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .accessTokenExpiresAt(accessExpiresAt)
                .refreshTokenExpiresAt(refreshExpiresAt)
                .user(toUserProfile(user))
                .build();
    }

    private UserProfileDto toUserProfile(User user) {
        return UserProfileDto.builder()
                .userId(user.getUserId())
                .companyId(user.getCompanyId())
                .companyCode(user.getCompany().getCompanyCode())
                .companyName(user.getCompany().getCompanyName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .active(user.isActive())
                .roles(user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toSet()))
                .build();
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String normalizeCompanyCode(String companyCode) {
        return companyCode.trim().toUpperCase();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
