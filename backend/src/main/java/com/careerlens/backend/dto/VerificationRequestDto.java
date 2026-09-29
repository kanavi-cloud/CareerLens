package com.careerlens.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record VerificationRequestDto(
        Long verificationId,
        Long taskId,
        Long userId,
        String requestType,
        String status,
        Integer verificationScore,
        String analysisSummary,
        String strengths,
        String improvementItems,
        String reviewerMode,
        LocalDateTime requestedAt,
        LocalDateTime completedAt,
        List<VerificationBadgeDto> issuedBadges
) {
}
