package com.careerlens.backend.dto;

import java.util.List;

public record JobRecommendationDto(
        Long diagnosisId,
        Long jobId,
        String companyName,
        String country,
        String jobTitle,
        String jobFamily,
        String salaryRange,
        String workType,
        String visaRequirement,
        String patternRef,
        String patternTitle,
        String patternEvidenceSummary,
        String recommendationGrade,
        String primaryRecommendationCategory,
        String readinessStatus,
        String readinessLabel,
        String recommendationSummary,
        String nextActionSummary,
        List<String> missingItems,
        ScoreBreakdownDto scoreBreakdown,
        Integer acceptanceProbabilityScore,
        Integer salaryScore,
        Integer workLifeBalanceScore,
        Integer companyValueScore,
        Integer jobFitScore,
        Integer probabilityWeight,
        Integer salaryWeight,
        Integer workLifeBalanceWeight,
        Integer companyValueWeight,
        Integer jobFitWeight,
        String evaluationRationale
) {
}
