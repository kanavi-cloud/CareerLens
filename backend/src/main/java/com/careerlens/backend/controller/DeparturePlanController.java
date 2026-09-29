package com.careerlens.backend.controller;

import com.careerlens.backend.dto.DeparturePlanDto;
import com.careerlens.backend.dto.DeparturePlanRequestDto;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.DeparturePlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departure")
public class DeparturePlanController {

    private final DeparturePlanService departurePlanService;

    public DeparturePlanController(DeparturePlanService departurePlanService) {
        this.departurePlanService = departurePlanService;
    }

    @PostMapping("/plan")
    public DeparturePlanDto generatePlan(
            @Valid @RequestBody DeparturePlanRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return departurePlanService.generatePlan(request, claims);
    }

    @PostMapping("/roadmaps/{roadmapId}/plan")
    public DeparturePlanDto generatePlanFromRoadmap(
            @PathVariable Long roadmapId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return departurePlanService.generatePlanFromRoadmap(roadmapId, claims);
    }

    @GetMapping("/roadmaps/{roadmapId}/plan")
    public DeparturePlanDto getPlanFromRoadmap(
            @PathVariable Long roadmapId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return departurePlanService.getPlanFromRoadmap(roadmapId, claims);
    }

    @PostMapping("/roadmaps/{roadmapId}/plan/refresh")
    public DeparturePlanDto refreshPlanFromRoadmap(
            @PathVariable Long roadmapId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return departurePlanService.refreshPlanFromRoadmap(roadmapId, claims);
    }
}
