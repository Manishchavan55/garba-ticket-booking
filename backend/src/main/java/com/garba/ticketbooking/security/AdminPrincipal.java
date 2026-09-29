package com.garba.ticketbooking.security;

import com.garba.ticketbooking.entity.Admin;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public final class AdminPrincipal implements UserDetails {
    private final Long id;
    private final String email;
    private final String passwordHash;
    private final String role;
    private final boolean active;

    private AdminPrincipal(Long id, String email, String passwordHash, String role, boolean active) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
    }

    public static AdminPrincipal from(Admin admin) {
        return new AdminPrincipal(admin.getId(), admin.getEmail(), admin.getPasswordHash(), admin.getRole().name(), admin.isActive());
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}
