package com.careerlens.backend.dto;

import java.time.LocalDateTime;

public record MembershipSummaryDto(
        Long userId,
        String plan,
        boolean proActive,
        LocalDateTime proExpiresAt,
        String periodMonth,
        Integer roadmapLimit,
        Integer roadmapUsed,
        Integer roadmapRemaining,
        Integer aiDocumentAnalysisLimit,
        Integer aiDocumentAnalysisUsed,
        Integer aiDocumentAnalysisRemaining,
        String priceLabel
) {
}
