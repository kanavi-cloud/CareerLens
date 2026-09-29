package com.careerlens.backend.dto;

public record FlightApiProviderDto(
        String provider,
        String useCase,
        String integrationStatus,
        String note
) {
}
