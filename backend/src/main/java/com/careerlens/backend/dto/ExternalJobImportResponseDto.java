package com.careerlens.backend.dto;

import java.util.List;

public record ExternalJobImportResponseDto(
        String provider,
        String boardToken,
        Integer fetchedCount,
        Integer importedCount,
        Integer updatedCount,
        List<JobPostingDto> jobs
) {
}
