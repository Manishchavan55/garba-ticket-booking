package com.garba.ticketbooking.controller;

import com.garba.ticketbooking.security.AdminPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/me")
    public Map<String, Object> currentAdmin(@AuthenticationPrincipal AdminPrincipal principal) {
        return Map.of(
                "id", principal.getId(),
                "email", principal.getEmail(),
                "role", principal.getRole()
        );
    }
}
