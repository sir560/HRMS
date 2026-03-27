package com.hrms.backend.service;

import com.hrms.backend.entity.User;
import com.hrms.backend.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Objects;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-minutes}")
    private long accessTokenExpirationMinutes;

    @Value("${app.jwt.refresh-token-expiration-days}")
    private long refreshTokenExpirationDays;

    public String generateAccessToken(User user) {
        return buildToken(user, getAccessTokenExpiryInstant(), "access");
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, getRefreshTokenExpiryInstant(), "refresh");
    }

    public Instant getAccessTokenExpiryInstant() {
        return Instant.now().plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES);
    }

    public Instant getRefreshTokenExpiryInstant() {
        return Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS);
    }

    public boolean isAccessToken(String token) {
        return hasTokenType(token, "access");
    }

    public boolean isRefreshToken(String token) {
        return hasTokenType(token, "refresh");
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public Long extractCompanyId(String token) {
        Object value = parseClaims(token).get("companyId");
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.valueOf(String.valueOf(value));
    }

    public boolean isTokenValid(String token, User user) {
        Claims claims = parseClaims(token);
        return Objects.equals(Long.valueOf(claims.getSubject()), user.getUserId())
                && Objects.equals(extractCompanyId(token), user.getCompanyId())
                && claims.getExpiration().after(new Date());
    }

    private String buildToken(User user, Instant expiresAt, String tokenType) {
        Instant now = Instant.now();
        Map<String, Object> claims = Map.of(
                "type", tokenType,
                "companyId", user.getCompanyId(),
                "companyCode", user.getCompany().getCompanyCode(),
                "email", user.getEmail(),
                "roles", user.getRoles().stream().map(role -> role.getRoleName().name()).toList()
        );

        return Jwts.builder()
                .claims(claims)
                .subject(String.valueOf(user.getUserId()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey())
                .compact();
    }

    private boolean hasTokenType(String token, String expectedType) {
        Object tokenType = parseClaims(token).get("type");
        return expectedType.equals(tokenType);
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            throw new UnauthorizedException("Token is invalid or expired");
        }
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
}
