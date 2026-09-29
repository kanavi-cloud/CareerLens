package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FlightOfferDto(
        String provider,
        @JsonProperty("origin_code")
        String originCode,
        @JsonProperty("destination_code")
        String destinationCode,
        @JsonProperty("departure_at")
        String departureAt,
        @JsonProperty("arrival_at")
        String arrivalAt,
        @JsonProperty("carrier_name")
        String carrierName,
        @JsonProperty("carrier_code")
        String carrierCode,
        @JsonProperty("flight_number")
        String flightNumber,
        String duration,
        String currency,
        @JsonProperty("total_price")
        String totalPrice,
        @JsonProperty("bookable_seats")
        Integer bookableSeats
) {
}
