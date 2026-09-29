package com.garba.ticketbooking.security;

import com.garba.ticketbooking.entity.Admin;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;

    public JwtService(JwtEncoder jwtEncoder, @Value("${app.security.jwt.expiration:3600}") long expirationSeconds) {
        if (expirationSeconds <= 0) {
            throw new IllegalArgumentException("JWT expiration must be positive");
        }
        this.jwtEncoder = jwtEncoder;
        this.expirationSeconds = expirationSeconds;
    }

    public Jwt issueToken(Admin admin) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(expirationSeconds);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("garba-ticket-booking")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(admin.getEmail())
                .claim("adminId", admin.getId())
                .claim("role", admin.getRole().name())
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims));
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
