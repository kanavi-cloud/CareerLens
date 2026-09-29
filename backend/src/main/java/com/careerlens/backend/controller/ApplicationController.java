package com.careerlens.backend.controller;

import com.careerlens.backend.dto.ApplicationRecordDto;
import com.careerlens.backend.dto.ApplicationStatusUpdateRequestDto;
import com.careerlens.backend.dto.ApplicationWorkspaceUpdateRequestDto;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/users/{userId}")
    public List<ApplicationRecordDto> getUserApplications(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return applicationService.getUserApplications(userId);
    }

    @GetMapping("/{applicationId}")
    public ApplicationRecordDto getApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return applicationService.getApplication(applicationId, claims);
    }

    @PostMapping("/from-roadmap/{roadmapId}")
    public ApplicationRecordDto createFromRoadmap(
            @PathVariable Long roadmapId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return applicationService.createFromRoadmap(roadmapId, claims);
    }

    @PostMapping("/users/{userId}/jobs/{jobId}")
    public ApplicationRecordDto createFromJob(
            @PathVariable Long userId,
            @PathVariable Long jobId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return applicationService.createFromJob(userId, jobId);
    }

    @PatchMapping("/{applicationId}/status")
    public ApplicationRecordDto updateStatus(
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationStatusUpdateRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return applicationService.updateStatus(applicationId, request.status(), claims);
    }

    @PatchMapping("/{applicationId}/workspace")
    public ApplicationRecordDto updateWorkspace(
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationWorkspaceUpdateRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return applicationService.updateWorkspace(applicationId, request, claims);
    }
}
