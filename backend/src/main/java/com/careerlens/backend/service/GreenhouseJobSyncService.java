package com.careerlens.backend.service;

import com.careerlens.backend.dto.ExternalJobImportRequestDto;
import com.careerlens.backend.dto.ExternalJobImportResponseDto;
import com.careerlens.backend.dto.ExternalJobSyncStatusDto;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class GreenhouseJobSyncService {

    private final GreenhouseJobProviderService greenhouseJobProviderService;
    private final boolean enabled;
    private final List<String> boardTokens;
    private final String defaultCountry;
    private final String defaultJobFamily;
    private final Integer limitPerBoard;
    private final boolean createPatternProfile;
    private final Integer defaultDeadlineOffsetDays;
    private final Integer fixedDelayMinutes;
    private final AtomicBoolean running = new AtomicBoolean(false);

    private volatile LocalDateTime lastStartedAt;
    private volatile LocalDateTime lastFinishedAt;
    private volatile String lastStatus = "IDLE";
    private volatile Integer lastFetchedCount = 0;
    private volatile Integer lastImportedCount = 0;
    private volatile Integer lastUpdatedCount = 0;
    private volatile String lastMessage = "자동 동기화가 아직 실행되지 않았습니다.";

    public GreenhouseJobSyncService(
            GreenhouseJobProviderService greenhouseJobProviderService,
            @Value("${app.external-jobs.greenhouse.sync.enabled:false}") boolean enabled,
            @Value("${app.external-jobs.greenhouse.sync.board-tokens:}") String boardTokens,
            @Value("${app.external-jobs.greenhouse.sync.default-country:United States}") String defaultCountry,
            @Value("${app.external-jobs.greenhouse.sync.default-job-family:Backend}") String defaultJobFamily,
            @Value("${app.external-jobs.greenhouse.sync.limit-per-board:20}") Integer limitPerBoard,
            @Value("${app.external-jobs.greenhouse.sync.create-pattern-profile:true}") boolean createPatternProfile,
            @Value("${app.external-jobs.greenhouse.sync.default-deadline-offset-days:45}") Integer defaultDeadlineOffsetDays,
            @Value("${app.external-jobs.greenhouse.sync.fixed-delay-minutes:360}") Integer fixedDelayMinutes
    ) {
        this.greenhouseJobProviderService = greenhouseJobProviderService;
        this.enabled = enabled;
        this.boardTokens = parseBoardTokens(boardTokens);
        this.defaultCountry = defaultCountry;
        this.defaultJobFamily = defaultJobFamily;
        this.limitPerBoard = limitPerBoard;
        this.createPatternProfile = createPatternProfile;
        this.defaultDeadlineOffsetDays = defaultDeadlineOffsetDays;
        this.fixedDelayMinutes = fixedDelayMinutes;
    }

    @Scheduled(
            fixedDelayString = "${app.external-jobs.greenhouse.sync.fixed-delay-millis:21600000}",
            initialDelayString = "${app.external-jobs.greenhouse.sync.initial-delay-millis:60000}"
    )
    public void scheduledSync() {
        if (!enabled) {
            return;
        }
        runSync();
    }

    public ExternalJobSyncStatusDto runSync() {
        if (!running.compareAndSet(false, true)) {
            lastStatus = "RUNNING";
            lastMessage = "이미 Greenhouse 동기화가 실행 중입니다.";
            return status();
        }

        lastStartedAt = LocalDateTime.now();
        lastStatus = "RUNNING";
        lastFetchedCount = 0;
        lastImportedCount = 0;
        lastUpdatedCount = 0;

        try {
            if (boardTokens.isEmpty()) {
                lastStatus = "SKIPPED";
                lastMessage = "GREENHOUSE_SYNC_BOARD_TOKENS가 비어 있어 동기화를 건너뜁니다.";
                return status();
            }

            List<String> failedTokens = new ArrayList<>();
            for (String boardToken : boardTokens) {
                try {
                    ExternalJobImportResponseDto response = greenhouseJobProviderService.importJobs(new ExternalJobImportRequestDto(
                            boardToken,
                            defaultCountry,
                            defaultJobFamily,
                            limitPerBoard,
                            defaultDeadline(),
                            createPatternProfile,
                            null,
                            false
                    ));
                    lastFetchedCount += safe(response.fetchedCount());
                    lastImportedCount += safe(response.importedCount());
                    lastUpdatedCount += safe(response.updatedCount());
                } catch (RuntimeException exception) {
                    failedTokens.add(boardToken);
                }
            }

            lastStatus = failedTokens.isEmpty() ? "SUCCESS" : "PARTIAL_SUCCESS";
            lastMessage = failedTokens.isEmpty()
                    ? "Greenhouse board " + boardTokens.size() + "개를 동기화했습니다."
                    : "일부 Greenhouse board token 동기화를 건너뛰었습니다: " + String.join(", ", failedTokens);
            return status();
        } catch (RuntimeException exception) {
            lastStatus = "FAILED";
            lastMessage = exception.getMessage() == null ? "Greenhouse 동기화 중 오류가 발생했습니다." : exception.getMessage();
            return status();
        } finally {
            lastFinishedAt = LocalDateTime.now();
            running.set(false);
        }
    }

    public ExternalJobSyncStatusDto status() {
        return new ExternalJobSyncStatusDto(
                enabled,
                new ArrayList<>(boardTokens),
                fixedDelayMinutes,
                lastStartedAt,
                lastFinishedAt,
                lastStatus,
                lastFetchedCount,
                lastImportedCount,
                lastUpdatedCount,
                lastMessage
        );
    }

    private LocalDate defaultDeadline() {
        if (defaultDeadlineOffsetDays == null || defaultDeadlineOffsetDays <= 0) {
            return null;
        }
        int offset = Math.max(1, defaultDeadlineOffsetDays);
        return LocalDate.now().plusDays(offset);
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private List<String> parseBoardTokens(String value) {
        List<String> tokens = new ArrayList<>();
        if (value == null || value.isBlank()) {
            return tokens;
        }
        String[] parts = value.split(",");
        for (String part : parts) {
            String token = part.trim();
            if (!token.isBlank()) {
                tokens.add(token);
            }
        }
        return tokens;
    }
}
