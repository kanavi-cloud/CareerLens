package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record ApplicationStatusUpdateRequestDto(
        @NotBlank
        String status
) {
}
