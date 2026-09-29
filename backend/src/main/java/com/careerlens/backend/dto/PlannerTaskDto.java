package com.careerlens.backend.dto;

public record PlannerTaskDto(
        Long taskId,
        Integer weekNumber,
        String category,
        String title,
        String description,
        String expectedOutputs,
        String verificationCriteria,
        Integer estimatedHours,
        String difficulty,
        String status,
        Integer sortOrder
) {
}
