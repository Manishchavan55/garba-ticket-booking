package com.garba.ticketbooking.dto;

public record AuthResponse(String token, String tokenType, long expiresIn) {}
