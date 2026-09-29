package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ResourceQuestionRequestDto(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 1000) String content,
        @Size(max = 60) String category,
        @Size(max = 80) String author,
        List<String> tags
) {
}
