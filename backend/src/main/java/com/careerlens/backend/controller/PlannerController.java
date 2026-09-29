package com.careerlens.backend.controller;

import com.careerlens.backend.dto.PlannerRoadmapDto;
import com.careerlens.backend.dto.PlannerTaskStatusUpdateRequestDto;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.PlannerService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/planner")
public class PlannerController {

    private final PlannerService plannerService;

    public PlannerController(PlannerService plannerService) {
        this.plannerService = plannerService;
    }

    @PostMapping("/roadmaps/from-diagnosis/{diagnosisId}")
    public PlannerRoadmapDto createFromDiagnosis(
            @PathVariable Long diagnosisId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return plannerService.createFromDiagnosis(diagnosisId, claims);
    }

    @GetMapping("/roadmaps/{roadmapId}")
    public PlannerRoadmapDto getRoadmap(
            @PathVariable Long roadmapId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return plannerService.getRoadmap(roadmapId, claims);
    }

    @GetMapping("/users/{userId}/roadmaps")
    public List<PlannerRoadmapDto> getUserRoadmaps(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return plannerService.getUserRoadmaps(userId);
    }

    @PatchMapping("/tasks/{taskId}/status")
    public PlannerRoadmapDto updateTaskStatus(
            @PathVariable Long taskId,
            @Valid @RequestBody PlannerTaskStatusUpdateRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return plannerService.updateTaskStatus(taskId, request.status(), claims);
    }

    @DeleteMapping("/roadmaps/{roadmapId}")
    public void deleteRoadmap(
            @PathVariable Long roadmapId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        plannerService.deleteRoadmap(roadmapId, claims);
    }
}
