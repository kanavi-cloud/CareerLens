package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GithubVerificationRequestDto(
        @NotBlank
        @Size(max = 500)
        String githubUrl,
        @Size(max = 2000)
        String note
) {
}
