package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ApplicationDocumentStatusDto(
        String key,
        String label,
        String status,
        @JsonProperty("helper_text")
        String helperText
) {
}
