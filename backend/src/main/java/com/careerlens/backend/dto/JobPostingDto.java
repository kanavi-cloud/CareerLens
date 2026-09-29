package com.careerlens.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record JobPostingDto(
        Long jobId,
        String externalRef,
        String companyName,
        String country,
        String jobTitle,
        String jobFamily,
        List<String> requiredSkills,
        List<String> preferredSkills,
        List<String> requiredLanguages,
        Integer minExperienceYears,
        String degreeRequirement,
        Boolean portfolioRequired,
        String visaRequirement,
        String salaryRange,
        String workType,
        LocalDate applicationDeadline,
        String deadlineStatus,
        Integer daysUntilDeadline,
        Integer salaryScore,
        Integer workLifeBalanceScore,
        Integer companyValueScore,
        String evaluationRationale
) {
}
