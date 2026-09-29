package com.careerlens.backend.dto;

import java.util.List;

public record ExternalJobPreviewDto(
        String provider,
        String boardToken,
        String externalRef,
        String companyName,
        String country,
        String jobTitle,
        String jobFamily,
        String location,
        String sourceUrl,
        List<String> requiredSkills,
        List<String> preferredSkills,
        List<String> requiredLanguages,
        Integer minExperienceYears,
        String degreeRequirement,
        Boolean portfolioRequired,
        String visaRequirement,
        String salaryRange,
        String workType,
        String contentSummary,
        Boolean alreadyImported
) {
}
