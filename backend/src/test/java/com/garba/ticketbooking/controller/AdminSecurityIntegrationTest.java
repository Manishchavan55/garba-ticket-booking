package com.garba.ticketbooking.controller;

import com.garba.ticketbooking.dto.AuthResponse;
import com.garba.ticketbooking.dto.LoginRequest;
import com.garba.ticketbooking.security.AdminUserDetailsService;
import com.garba.ticketbooking.service.AdminAuthenticationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {AdminController.class, AuthController.class})
@Import(com.garba.ticketbooking.security.SecurityConfig.class)
@TestPropertySource(properties = "app.security.jwt.secret=test-secret-with-at-least-32-characters-long")
class AdminSecurityIntegrationTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean AdminAuthenticationService authenticationService;
    @MockitoBean AdminUserDetailsService adminUserDetailsService;

    @Test
    void unauthenticatedAdminRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedAdminCanAccessProtectedEndpointWithoutPasswordData() throws Exception {
        mockMvc.perform(get("/api/admin/me")
                        .with(jwt().jwt(jwt -> jwt
                                .subject("admin@example.com")
                                .claim("adminId", 42L)
                                .claim("role", "ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.email").value("admin@example.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password_hash").doesNotExist());
    }

    @Test
    void authenticatedNonAdminRoleGets403() throws Exception {
        mockMvc.perform(get("/api/admin/me")
                        .with(jwt().jwt(jwt -> jwt
                                .subject("scanner@example.com")
                                .claim("adminId", 7L)
                                .claim("role", "NOT_A_ROLE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginReturnsTokenWithoutPassword() throws Exception {
        when(authenticationService.login(new LoginRequest("admin@example.com", "secret")))
                .thenReturn(new AuthResponse("signed-token", "Bearer", 3600));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin@example.com\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("signed-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void logoutRequiresAuthenticationAndReturns204() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .with(jwt().jwt(jwt -> jwt.subject("admin@example.com").claim("role", "ADMIN"))))
                .andExpect(status().isNoContent());
    }
}
