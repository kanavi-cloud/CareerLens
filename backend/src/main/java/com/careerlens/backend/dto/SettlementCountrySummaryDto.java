package com.careerlens.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record SettlementCountrySummaryDto(
        String country,
        @JsonProperty("completion_rate")
        Integer completionRate,
        @JsonProperty("risk_level")
        String riskLevel,
        @JsonProperty("next_actions")
        List<String> nextActions
) {
}
