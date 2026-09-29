package com.careerlens.backend.controller;

import com.careerlens.backend.dto.MembershipSummaryDto;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.MembershipService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/memberships")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping("/me")
    public MembershipSummaryDto me(@AuthenticationPrincipal JwtClaims claims) {
        return membershipService.getSummary(claims.userId());
    }
}
