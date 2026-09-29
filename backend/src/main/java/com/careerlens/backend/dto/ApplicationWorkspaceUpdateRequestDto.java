package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ApplicationWorkspaceUpdateRequestDto(
        @JsonProperty("candidate_notes")
        String candidateNotes,
        @JsonProperty("next_action")
        String nextAction
) {
}
