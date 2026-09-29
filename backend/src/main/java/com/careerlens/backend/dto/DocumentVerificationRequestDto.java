package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DocumentVerificationRequestDto(
        String documentType,
        @NotBlank
        @Size(max = 12000)
        String submittedText
) {
}
