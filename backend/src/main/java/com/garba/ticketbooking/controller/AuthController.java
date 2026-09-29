package com.garba.ticketbooking.controller;

import com.garba.ticketbooking.dto.AuthResponse;
import com.garba.ticketbooking.dto.LoginRequest;
import com.garba.ticketbooking.service.AdminAuthenticationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AdminAuthenticationService authenticationService;

    public AuthController(AdminAuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT access tokens are stateless. Logout is completed by the client discarding its token.
        // Server-side revocation is intentionally not claimed or implemented in this module.
        return ResponseEntity.noContent().build();
    }
}
