package com.careerlens.backend.controller;

import com.careerlens.backend.dto.DocumentVerificationRequestDto;
import com.careerlens.backend.dto.GithubVerificationRequestDto;
import com.careerlens.backend.dto.VerificationBadgeDto;
import com.careerlens.backend.dto.VerificationRequestDto;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.VerificationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/verifications")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping("/tasks/{taskId}/text")
    public VerificationRequestDto verifyTaskText(
            @PathVariable Long taskId,
            @Valid @RequestBody DocumentVerificationRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return verificationService.verifyTaskText(taskId, request, claims);
    }

    @PostMapping("/tasks/{taskId}/github")
    public VerificationRequestDto verifyTaskGithub(
            @PathVariable Long taskId,
            @Valid @RequestBody GithubVerificationRequestDto request,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return verificationService.verifyTaskGithub(taskId, request, claims);
    }

    @PostMapping(value = "/tasks/{taskId}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public VerificationRequestDto verifyTaskFile(
            @PathVariable Long taskId,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return verificationService.verifyTaskFile(taskId, documentType, file, claims);
    }

    @GetMapping("/tasks/{taskId}")
    public List<VerificationRequestDto> getTaskVerifications(
            @PathVariable Long taskId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return verificationService.getTaskVerifications(taskId, claims);
    }

    @GetMapping("/users/{userId}/badges")
    public List<VerificationBadgeDto> getUserBadges(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtClaims claims
    ) {
        return verificationService.getUserBadges(userId, claims);
    }
}
