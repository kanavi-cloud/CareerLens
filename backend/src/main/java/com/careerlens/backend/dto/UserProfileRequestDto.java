package com.careerlens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UserProfileRequestDto(
        Long userId,
        String displayName,
        String email,
        @NotBlank String targetCountry,
        String targetCity,
        @NotBlank String targetJobFamily,
        String desiredJobTitle,
        String currentCountry,
        String nationality,
        @NotNull Integer experienceYears,
        Integer relatedExperienceYears,
        @NotBlank String languageLevel,
        String englishLevel,
        String japaneseLevel,
        String education,
        String major,
        String graduationStatus,
        String preferredWorkType,
        String expectedSalaryRange,
        String availableStartDate,
        Boolean visaSponsorshipNeeded,
        List<String> techStack,
        List<String> certifications,
        Boolean githubPresent,
        Boolean portfolioPresent,
        String githubUrl,
        String portfolioUrl,
        Boolean prioritizeSalary,
        Boolean prioritizeAcceptanceProbability,
        Boolean prioritizeWorkLifeBalance,
        Boolean prioritizeCompanyValue,
        Boolean prioritizeJobFit,
        String projectExperienceSummary,
        String domainExperience,
        String cloudExperience,
        String databaseExperience,
        String deploymentExperience,
        String languageTestScores,
        List<String> preferences
) {
}
