package com.careerlens.backend.dto;

import java.time.LocalDateTime;

public record KakaoPayReadyResponseDto(
        String orderId,
        String status,
        String redirectUrl,
        LocalDateTime expiresAt
) {
}
