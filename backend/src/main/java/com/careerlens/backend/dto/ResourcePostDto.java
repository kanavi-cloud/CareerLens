package com.careerlens.backend.dto;

import java.util.List;

public record ResourcePostDto(
        Long id,
        String type,
        String category,
        String title,
        String date,
        String summary,
        List<String> body,
        String author,
        Integer views,
        String priority,
        String status,
        Boolean pinned,
        List<String> tags,
        String relatedHref
) {
}
