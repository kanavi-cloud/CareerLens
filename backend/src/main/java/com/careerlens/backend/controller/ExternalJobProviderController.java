package com.careerlens.backend.controller;

import com.careerlens.backend.dto.ExternalJobImportRequestDto;
import com.careerlens.backend.dto.ExternalJobImportResponseDto;
import com.careerlens.backend.dto.ExternalJobPreviewDto;
import com.careerlens.backend.dto.ExternalJobSyncStatusDto;
import com.careerlens.backend.service.GreenhouseJobProviderService;
import com.careerlens.backend.service.GreenhouseJobSyncService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs/external")
@PreAuthorize("hasRole('ADMIN')")
public class ExternalJobProviderController {

    private final GreenhouseJobProviderService greenhouseJobProviderService;
    private final GreenhouseJobSyncService greenhouseJobSyncService;

    public ExternalJobProviderController(
            GreenhouseJobProviderService greenhouseJobProviderService,
            GreenhouseJobSyncService greenhouseJobSyncService
    ) {
        this.greenhouseJobProviderService = greenhouseJobProviderService;
        this.greenhouseJobSyncService = greenhouseJobSyncService;
    }

    @GetMapping("/greenhouse/preview")
    public List<ExternalJobPreviewDto> previewGreenhouseJobs(
            @RequestParam String boardToken,
            @RequestParam(required = false) String defaultCountry,
            @RequestParam(required = false) String defaultJobFamily,
            @RequestParam(required = false) Integer limit
    ) {
        return greenhouseJobProviderService.preview(boardToken, defaultCountry, defaultJobFamily, limit);
    }

    @PostMapping("/greenhouse/import")
    public ExternalJobImportResponseDto importGreenhouseJobs(@Valid @RequestBody ExternalJobImportRequestDto request) {
        return greenhouseJobProviderService.importJobs(request);
    }

    @PostMapping("/greenhouse/sync/run")
    public ExternalJobSyncStatusDto runGreenhouseSync() {
        return greenhouseJobSyncService.runSync();
    }

    @GetMapping("/greenhouse/sync/status")
    public ExternalJobSyncStatusDto getGreenhouseSyncStatus() {
        return greenhouseJobSyncService.status();
    }
}
