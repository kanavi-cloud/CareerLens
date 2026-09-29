package com.careerlens.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RecommendationDiagnosisResponseDto(
        Long userId,
        UserProfileSummaryDto profile,
        String criteriaSummary,
        Integer totalCandidateCount,
        Integer returnedRecommendationCount,
        String overallReadinessStatus,
        String overallReadinessLabel,
        List<JobRecommendationDto> recommendations,
        LocalDateTime diagnosedAt
) {
}
