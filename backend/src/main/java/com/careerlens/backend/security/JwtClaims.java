package com.careerlens.backend.security;

public record JwtClaims(
        Long userId,
        String loginId,
        String role,
        Long expiresAt
) {
}
