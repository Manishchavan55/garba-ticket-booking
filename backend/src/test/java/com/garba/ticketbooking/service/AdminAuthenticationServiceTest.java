package com.garba.ticketbooking.service;

import com.garba.ticketbooking.dto.AuthResponse;
import com.garba.ticketbooking.dto.LoginRequest;
import com.garba.ticketbooking.entity.Admin;
import com.garba.ticketbooking.entity.enums.AdminRole;
import com.garba.ticketbooking.repository.AdminRepository;
import com.garba.ticketbooking.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminAuthenticationServiceTest {
    @Mock AuthenticationManager authenticationManager;
    @Mock AdminRepository adminRepository;
    @Mock JwtService jwtService;
    @Mock Authentication authentication;

    private AdminAuthenticationService service;

    @BeforeEach
    void setUp() {
        service = new AdminAuthenticationService(authenticationManager, adminRepository, jwtService);
    }

    @Test
    void successfulLoginReturnsBearerTokenAndUpdatesLastLogin() {
        Admin admin = admin("admin@example.com", true);
        Jwt jwt = Jwt.withTokenValue("signed-token")
                .header("alg", "HS256")
                .subject(admin.getEmail())
                .build();

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getName()).thenReturn(admin.getEmail());
        when(adminRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));
        when(jwtService.issueToken(admin)).thenReturn(jwt);
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        AuthResponse response = service.login(new LoginRequest(admin.getEmail(), "secret"));

        assertThat(response.token()).isEqualTo("signed-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(3600L);
        assertThat(admin.getLastLoginAt()).isNotNull();
        verify(adminRepository).save(admin);
    }

    @Test
    void invalidPasswordProducesGenericAuthenticationFailure() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad credentials"));

        assertThatThrownBy(() -> service.login(new LoginRequest("admin@example.com", "wrong")))
                .hasMessage("Authentication failed");
        verifyNoInteractions(jwtService);
    }

    @Test
    void unknownUsernameProducesGenericAuthenticationFailure() {
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getName()).thenReturn("missing@example.com");
        when(adminRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("missing@example.com", "secret")))
                .hasMessage("Authentication failed");
        verifyNoInteractions(jwtService);
    }

    @Test
    void disabledAdminProducesGenericAuthenticationFailure() {
        Admin admin = admin("disabled@example.com", false);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getName()).thenReturn(admin.getEmail());
        when(adminRepository.findByEmailIgnoreCase(admin.getEmail())).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.login(new LoginRequest(admin.getEmail(), "secret")))
                .hasMessage("Authentication failed");
        verify(adminRepository, never()).save(any());
        verifyNoInteractions(jwtService);
    }

    private Admin admin(String email, boolean active) {
        Admin admin = new Admin();
        admin.setEmail(email);
        admin.setPasswordHash("$2a$12$not-a-real-test-hash");
        admin.setRole(AdminRole.ADMIN);
        admin.setActive(active);
        return admin;
    }
}
