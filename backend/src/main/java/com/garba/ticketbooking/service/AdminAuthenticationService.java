package com.garba.ticketbooking.service;

import com.garba.ticketbooking.dto.AuthResponse;
import com.garba.ticketbooking.dto.LoginRequest;
import com.garba.ticketbooking.entity.Admin;
import com.garba.ticketbooking.repository.AdminRepository;
import com.garba.ticketbooking.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AdminAuthenticationService {
    private static final String GENERIC_AUTHENTICATION_FAILURE = "Authentication failed";

    private final AuthenticationManager authenticationManager;
    private final AdminRepository adminRepository;
    private final JwtService jwtService;

    public AdminAuthenticationService(AuthenticationManager authenticationManager,
                                      AdminRepository adminRepository,
                                      JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(request.username().trim(), request.password()));
        } catch (AuthenticationException ex) {
            throw new AuthenticationServiceException(GENERIC_AUTHENTICATION_FAILURE);
        }

        Admin admin = adminRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new AuthenticationServiceException(GENERIC_AUTHENTICATION_FAILURE));

        if (!admin.isActive()) {
            throw new AuthenticationServiceException(GENERIC_AUTHENTICATION_FAILURE);
        }

        admin.setLastLoginAt(Instant.now());
        adminRepository.save(admin);

        var jwt = jwtService.issueToken(admin);
        return new AuthResponse(jwt.getTokenValue(), "Bearer", jwtService.getExpirationSeconds());
    }
}
