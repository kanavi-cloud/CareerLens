package com.careerlens.backend.service;

public record PlannerTaskDraft(
        Integer weekNumber,
        String category,
        String title,
        String description,
        String expectedOutputs,
        String verificationCriteria,
        Integer estimatedHours,
        String difficulty
) {
}
