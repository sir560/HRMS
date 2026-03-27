package com.hrms.backend.config;

import com.hrms.backend.entity.User;
import java.util.Collection;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
@Builder
public class AuthenticatedUser implements UserDetails {

    private final Long userId;
    private final Long companyId;
    private final String email;
    private final String password;
    private final String firstName;
    private final String lastName;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public static AuthenticatedUser from(User user) {
        return AuthenticatedUser.builder()
                .userId(user.getUserId())
                .companyId(user.getCompanyId())
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .active(user.isActive())
                .authorities(user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName().name()))
                        .collect(Collectors.toSet()))
                .build();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
