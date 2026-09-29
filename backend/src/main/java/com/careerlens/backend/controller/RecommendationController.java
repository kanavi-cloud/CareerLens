package com.careerlens.backend.controller;

import com.careerlens.backend.dto.RecommendationDiagnoseRequestDto;
import com.careerlens.backend.dto.RecommendationDiagnosisResponseDto;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.RecommendationServiceV2;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationServiceV2 recommendationServiceV2;

    public RecommendationController(RecommendationServiceV2 recommendationServiceV2) {
        this.recommendationServiceV2 = recommendationServiceV2;
    }

    @PostMapping("/diagnose")
    public RecommendationDiagnosisResponseDto diagnose(
            @Valid @RequestBody RecommendationDiagnoseRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        if (request.userProfile().userId() == null) {
            throw new IllegalArgumentException("user_id가 포함된 프로필로 진단을 요청해야 합니다.");
        }
        AccessGuard.requireUserOrAdmin(claims, request.userProfile().userId());
        return recommendationServiceV2.diagnose(request);
    }

    @PostMapping("/diagnose/users/{userId}")
    public RecommendationDiagnosisResponseDto diagnoseStoredProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return recommendationServiceV2.diagnoseStoredProfile(userId);
    }

    @PostMapping("/diagnose/users/{userId}/jobs/{jobId}")
    public RecommendationDiagnosisResponseDto diagnoseStoredProfileForJob(
            @PathVariable Long userId,
            @PathVariable Long jobId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return recommendationServiceV2.diagnoseStoredProfileForJob(userId, jobId);
    }

    @GetMapping("/{userId}")
    public RecommendationDiagnosisResponseDto getRecommendations(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return recommendationServiceV2.getLatestRecommendations(userId);
    }
}
