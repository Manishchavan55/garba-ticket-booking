package com.garba.ticketbooking.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordSecurityTest {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    @Test
    void passwordIsHashedAndNeverStoredAsPlaintext() {
        String raw = "correct-horse-battery-staple";
        String hash = encoder.encode(raw);

        assertThat(hash).isNotEqualTo(raw);
        assertThat(hash).startsWith("$2");
        assertThat(encoder.matches(raw, hash)).isTrue();
        assertThat(encoder.matches("wrong-password", hash)).isFalse();
    }
}
