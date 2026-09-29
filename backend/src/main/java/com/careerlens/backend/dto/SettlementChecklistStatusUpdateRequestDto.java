package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record SettlementChecklistStatusUpdateRequestDto(
        @NotBlank
        String status
) {
}
