package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ResourcePostRequestDto(
        @NotBlank @Size(max = 30) String type,
        @NotBlank @Size(max = 60) String category,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 1000) String summary,
        List<String> body,
        @Size(max = 80) String author,
        @Size(max = 30) String priority,
        @Size(max = 30) String status,
        Boolean pinned,
        Integer views,
        List<String> tags,
        @Size(max = 500) String relatedHref
) {
}
