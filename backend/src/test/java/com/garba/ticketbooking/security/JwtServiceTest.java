package com.garba.ticketbooking.security;

import com.garba.ticketbooking.entity.Admin;
import com.garba.ticketbooking.entity.enums.AdminRole;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {
    private static final String SECRET = "test-secret-with-at-least-32-characters-long";

    @Test
    void tokenContainsOnlyRequiredNonSensitiveClaimsAndValidSignature() {
        SecretKeySpec key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtService service = new JwtService(NimbusJwtEncoder.withSecretKey(key).build(), 3600);
        Admin admin = mock(Admin.class);
        when(admin.getId()).thenReturn(42L);
        when(admin.getEmail()).thenReturn("admin@example.com");
        when(admin.getRole()).thenReturn(AdminRole.ADMIN);
        when(admin.getPasswordHash()).thenReturn("never-in-token");

        Jwt token = service.issueToken(admin);

        JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        Jwt decoded = decoder.decode(token.getTokenValue());

        assertThat(decoded.getSubject()).isEqualTo("admin@example.com");
        assertThat(decoded.<Long>getClaim("adminId")).isEqualTo(42L);
        assertThat(decoded.getClaimAsString("role")).isEqualTo("ADMIN");
        assertThat(decoded.getClaims()).doesNotContainKey("password");
        assertThat(decoded.getClaims()).doesNotContainKey("passwordHash");
        assertThat(decoded.getClaims()).doesNotContainKey("password_hash");
        assertThat(decoded.getExpiresAt()).isAfter(decoded.getIssuedAt());
    }

    @Test
    void malformedTokenIsRejected() {
        SecretKeySpec key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();

        assertThatThrownBy(() -> decoder.decode("not.a.valid.jwt"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        SecretKeySpec key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtEncoder encoder = NimbusJwtEncoder.withSecretKey(key).build();
        Instant issuedAt = Instant.now().minusSeconds(120);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("garba-ticket-booking")
                .subject("admin@example.com")
                .issuedAt(issuedAt)
                .expiresAt(Instant.now().minusSeconds(60))
                .claim("adminId", 1L)
                .claim("role", "ADMIN")
                .build();
        String token = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();

        assertThatThrownBy(() -> decoder.decode(token))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void shortSecretIsRejected() {
        SecurityConfig config = new SecurityConfig();

        assertThatThrownBy(() -> config.jwtSecretKey("short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32");
    }
}
