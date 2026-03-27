package com.hrms.backend.repository;

import com.hrms.backend.entity.RefreshToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update RefreshToken rt set rt.revoked = true where rt.user.userId = :userId and rt.revoked = false")
    int revokeAllActiveTokensByUserId(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update RefreshToken rt set rt.revoked = true where rt.token = :token and rt.revoked = false")
    int revokeByToken(@Param("token") String token);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from RefreshToken rt where rt.expiresAt < :cutoff")
    int deleteExpiredTokens(@Param("cutoff") Instant cutoff);
}
