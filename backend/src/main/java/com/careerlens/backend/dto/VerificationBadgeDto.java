package com.careerlens.backend.dto;

import java.time.LocalDateTime;

public record VerificationBadgeDto(
        Long badgeId,
        Long taskId,
        Long verificationId,
        String badgeType,
        String label,
        String description,
        Integer scoreAtIssue,
        LocalDateTime issuedAt
) {
}
