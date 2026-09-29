package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record DeparturePlanRequestDto(
        @NotBlank
        @JsonProperty("target_country")
        String targetCountry,
        @NotBlank
        @JsonProperty("destination_city")
        String destinationCity,
        @NotBlank
        @Pattern(regexp = "^[A-Za-z]{3}$", message = "origin_airport는 3자리 IATA 공항 코드여야 합니다.")
        @JsonProperty("origin_airport")
        String originAirport,
        @NotBlank
        @Pattern(regexp = "^[A-Za-z]{3}$", message = "destination_airport는 3자리 IATA 공항 코드여야 합니다.")
        @JsonProperty("destination_airport")
        String destinationAirport,
        @NotNull
        @JsonProperty("start_date")
        LocalDate startDate,
        @Min(value = 3, message = "arrival_buffer_days는 최소 3일 이상이어야 합니다.")
        @Max(value = 45, message = "arrival_buffer_days는 최대 45일까지 입력할 수 있습니다.")
        @JsonProperty("arrival_buffer_days")
        Integer arrivalBufferDays,
        @JsonProperty("visa_status")
        String visaStatus,
        @JsonProperty("housing_status")
        String housingStatus
) {
}
