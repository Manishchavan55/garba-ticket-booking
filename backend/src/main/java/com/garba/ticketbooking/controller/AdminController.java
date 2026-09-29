package com.garba.ticketbooking.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/me")
    public Map<String, Object> currentAdmin(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
                "id", jwt.getClaim("adminId"),
                "email", jwt.getSubject(),
                "role", jwt.getClaimAsString("role")
        );
    }
}
