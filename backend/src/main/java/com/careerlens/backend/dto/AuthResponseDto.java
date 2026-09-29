package com.careerlens.backend.dto;

import java.time.LocalDateTime;

public record AuthResponseDto(
        Long userId,
        String loginId,
        String displayName,
        String email,
        String role,
        Boolean admin,
        Boolean profileCompleted,
        String accountStatus,
        Boolean emailVerified,
        LocalDateTime lastLoginAt,
        String accessToken,
        String tokenType,
        Long expiresAt,
        String countryDialCode,
        String phoneNumber,
        Boolean marketingOptIn
) {
}
