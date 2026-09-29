package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public record SettlementChecklistDto(
        @JsonProperty("item_id")
        Long itemId,
        @JsonProperty("user_id")
        Long userId,
        String country,
        String category,
        @JsonProperty("checklist_title")
        String checklistTitle,
        String description,
        String status,
        @JsonProperty("sort_order")
        Integer sortOrder,
        @JsonProperty("created_at")
        LocalDateTime createdAt,
        @JsonProperty("updated_at")
        LocalDateTime updatedAt
) {
}
