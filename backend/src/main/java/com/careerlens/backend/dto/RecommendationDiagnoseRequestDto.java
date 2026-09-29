package com.careerlens.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record RecommendationDiagnoseRequestDto(
        @Valid @NotNull UserProfileRequestDto userProfile
) {
}
