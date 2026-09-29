package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record PlannerTaskStatusUpdateRequestDto(
        @NotBlank String status
) {
}
