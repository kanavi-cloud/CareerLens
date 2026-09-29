package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public record SettlementGuidanceDto(
        @JsonProperty("guidance_id")
        Long guidanceId,
        @JsonProperty("overall_status")
        String overallStatus,
        @JsonProperty("completion_rate")
        Integer completionRate,
        String summary,
        @JsonProperty("priority_actions")
        List<String> priorityActions,
        @JsonProperty("country_summaries")
        List<SettlementCountrySummaryDto> countrySummaries,
        @JsonProperty("generation_mode")
        String generationMode,
        String disclaimer,
        @JsonProperty("created_at")
        LocalDateTime createdAt,
        @JsonProperty("updated_at")
        LocalDateTime updatedAt,
        @JsonProperty("refreshed_at")
        LocalDateTime refreshedAt
) {
    public SettlementGuidanceDto(
            String overallStatus,
            Integer completionRate,
            String summary,
            List<String> priorityActions,
            List<SettlementCountrySummaryDto> countrySummaries,
            String generationMode,
            String disclaimer
    ) {
        this(
                null,
                overallStatus,
                completionRate,
                summary,
                priorityActions,
                countrySummaries,
                generationMode,
                disclaimer,
                null,
                null,
                null
        );
    }
}
