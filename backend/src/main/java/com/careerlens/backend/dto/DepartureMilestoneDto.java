package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public record DepartureMilestoneDto(
        String phase,
        String title,
        String description,
        @JsonProperty("due_date")
        LocalDate dueDate,
        String status
) {
}
