package com.careerlens.backend.dto;

public record AvailabilityResponseDto(
        String field,
        String value,
        boolean available,
        String message
) {
}
