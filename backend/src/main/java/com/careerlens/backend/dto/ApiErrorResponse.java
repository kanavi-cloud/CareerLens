package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public record ApiErrorResponse(
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        @JsonProperty("status")
        int status,
        @JsonProperty("error")
        String error,
        @JsonProperty("message")
        String message,
        @JsonProperty("path")
        String path,
        @JsonProperty("details")
        List<String> details
) {
}
