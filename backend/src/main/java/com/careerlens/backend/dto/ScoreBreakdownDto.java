package com.careerlens.backend.dto;

public record ScoreBreakdownDto(
        Integer totalScore,
        Integer skillScore,
        Integer experienceScore,
        Integer languageScore,
        Integer educationScore,
        Integer portfolioScore
) {
}
