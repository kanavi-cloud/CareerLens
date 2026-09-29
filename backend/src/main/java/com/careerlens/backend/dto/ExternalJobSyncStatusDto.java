package com.careerlens.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ExternalJobSyncStatusDto(
        Boolean enabled,
        List<String> boardTokens,
        Integer fixedDelayMinutes,
        LocalDateTime lastStartedAt,
        LocalDateTime lastFinishedAt,
        String lastStatus,
        Integer lastFetchedCount,
        Integer lastImportedCount,
        Integer lastUpdatedCount,
        String lastMessage
) {
}
