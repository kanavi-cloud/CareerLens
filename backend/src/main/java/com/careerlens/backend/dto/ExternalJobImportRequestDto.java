package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;

public record ExternalJobImportRequestDto(
        @NotBlank String boardToken,
        String defaultCountry,
        String defaultJobFamily,
        Integer limit,
        LocalDate defaultDeadline,
        Boolean createPatternProfile,
        List<String> selectedExternalRefs,
        Boolean importNew
) {
}
