package com.careerlens.backend.controller;

import com.careerlens.backend.dto.UserProfileRequestDto;
import com.careerlens.backend.dto.UserProfileSummaryDto;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/{userId}/profile")
    public UserProfileSummaryDto getProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return userProfileService.getProfile(userId);
    }

    @PutMapping("/{userId}/profile")
    public UserProfileSummaryDto saveProfile(
            @PathVariable Long userId,
            @Valid @RequestBody UserProfileRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return userProfileService.saveProfile(userId, request);
    }
}
