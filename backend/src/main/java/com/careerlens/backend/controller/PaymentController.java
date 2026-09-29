package com.careerlens.backend.controller;

import com.careerlens.backend.dto.KakaoPayReadyResponseDto;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.KakaoPayService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/payments/kakao")
public class PaymentController {

    private final KakaoPayService kakaoPayService;

    public PaymentController(KakaoPayService kakaoPayService) {
        this.kakaoPayService = kakaoPayService;
    }

    @PostMapping("/ready")
    public KakaoPayReadyResponseDto ready(@AuthenticationPrincipal JwtClaims claims) {
        return kakaoPayService.ready(claims);
    }

    @GetMapping("/success")
    public RedirectView success(
            @RequestParam("order_id") String orderId,
            @RequestParam("pg_token") String pgToken
    ) {
        return new RedirectView(kakaoPayService.approveAndBuildRedirectUrl(orderId, pgToken));
    }

    @GetMapping("/cancel")
    public RedirectView cancel(@RequestParam("order_id") String orderId) {
        return new RedirectView(kakaoPayService.cancelAndBuildRedirectUrl(orderId));
    }

    @GetMapping("/fail")
    public RedirectView fail(@RequestParam("order_id") String orderId) {
        return new RedirectView(kakaoPayService.failAndBuildRedirectUrl(orderId));
    }
}
