package com.careerlens.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PlannerRoadmapDto(
        Long roadmapId,
        Long userId,
        Long diagnosisId,
        String title,
        String summary,
        String targetCompany,
        String targetJobTitle,
        String readinessStatus,
        Integer totalScore,
        Integer durationWeeks,
        String generationMode,
        LocalDateTime createdAt,
        Integer totalTaskCount,
        Integer completedTaskCount,
        Integer inProgressTaskCount,
        Integer completionRate,
        String nextAction,
        List<PlannerTaskDto> tasks
) {
}
