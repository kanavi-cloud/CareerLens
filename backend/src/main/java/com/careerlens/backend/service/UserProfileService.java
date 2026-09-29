package com.careerlens.backend.service;

import com.careerlens.backend.dto.UserProfileRequestDto;
import com.careerlens.backend.dto.UserProfileSummaryDto;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private static final String USER_NOT_FOUND_MESSAGE = "User not found: ";
    private static final String USER_PROFILE_NOT_FOUND_MESSAGE = "User profile not found: ";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public UserProfileSummaryDto saveProfile(Long userId, UserProfileRequestDto request) {
        User user = findUser(userId);
        Optional<UserProfile> existingProfile = userProfileRepository.findByUserId(userId);
        UserProfile profile = existingProfile.orElseGet(UserProfile::new);
        applyRequestToProfile(profile, user, request);
        UserProfile savedProfile = saveIfNew(profile, existingProfile);
        return toSummaryDto(user, savedProfile);
    }

    @Transactional(readOnly = true)
    public UserProfileSummaryDto getProfile(Long userId) {
        User user = findUser(userId);
        UserProfile profile = findProfile(userId);
        return toSummaryDto(user, profile);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(USER_NOT_FOUND_MESSAGE + userId));
    }

    private UserProfile findProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(USER_PROFILE_NOT_FOUND_MESSAGE + userId));
    }

    private UserProfile saveIfNew(UserProfile profile, Optional<UserProfile> existingProfile) {
        return existingProfile.isPresent() ? profile : userProfileRepository.save(profile);
    }

    private void applyRequestToProfile(UserProfile profile, User user, UserProfileRequestDto request) {
        profile.setUser(user);
        applyTargetInfo(profile, request);
        applyExperienceInfo(profile, request);
        applyWorkPreferenceInfo(profile, request);
        applyEvidenceInfo(profile, request);
        applyPriorityInfo(profile, request);
        applyDetailSummaries(profile, request);
    }

    private void applyTargetInfo(UserProfile profile, UserProfileRequestDto request) {
        profile.setTargetCountry(request.targetCountry());
        profile.setTargetCity(request.targetCity());
        profile.setTargetJobFamily(request.targetJobFamily());
        profile.setDesiredJobTitle(request.desiredJobTitle());
        profile.setCurrentCountry(request.currentCountry());
        profile.setNationality(request.nationality());
    }

    private void applyExperienceInfo(UserProfile profile, UserProfileRequestDto request) {
        profile.setExperienceYears(request.experienceYears());
        profile.setRelatedExperienceYears(request.relatedExperienceYears());
        profile.setLanguageLevel(request.languageLevel());
        profile.setEnglishLevel(request.englishLevel());
        profile.setJapaneseLevel(request.japaneseLevel());
        profile.setEducation(request.education());
        profile.setMajor(request.major());
        profile.setGraduationStatus(request.graduationStatus());
        profile.setTechStack(normalizedList(request.techStack()));
        profile.setCertifications(normalizedList(request.certifications()));
    }

    private void applyWorkPreferenceInfo(UserProfile profile, UserProfileRequestDto request) {
        profile.setPreferredWorkType(request.preferredWorkType());
        profile.setExpectedSalaryRange(request.expectedSalaryRange());
        profile.setAvailableStartDate(request.availableStartDate());
        profile.setVisaSponsorshipNeeded(booleanValue(request.visaSponsorshipNeeded()));
        profile.setPreferences(normalizedList(request.preferences()));
    }

    private void applyEvidenceInfo(UserProfile profile, UserProfileRequestDto request) {
        profile.setGithubPresent(booleanValue(request.githubPresent()));
        profile.setPortfolioPresent(booleanValue(request.portfolioPresent()));
        profile.setGithubUrl(request.githubUrl());
        profile.setPortfolioUrl(request.portfolioUrl());
    }

    private void applyPriorityInfo(UserProfile profile, UserProfileRequestDto request) {
        profile.setPrioritizeSalary(booleanValue(request.prioritizeSalary()));
        profile.setPrioritizeAcceptanceProbability(booleanValue(request.prioritizeAcceptanceProbability()));
        profile.setPrioritizeWorkLifeBalance(booleanValue(request.prioritizeWorkLifeBalance()));
        profile.setPrioritizeCompanyValue(booleanValue(request.prioritizeCompanyValue()));
        profile.setPrioritizeJobFit(booleanValue(request.prioritizeJobFit()));
    }

    private void applyDetailSummaries(UserProfile profile, UserProfileRequestDto request) {
        profile.setProjectExperienceSummary(request.projectExperienceSummary());
        profile.setDomainExperience(request.domainExperience());
        profile.setCloudExperience(request.cloudExperience());
        profile.setDatabaseExperience(request.databaseExperience());
        profile.setDeploymentExperience(request.deploymentExperience());
        profile.setLanguageTestScores(request.languageTestScores());
    }

    public UserProfileSummaryDto toDto(User user, UserProfile profile) {
        return toSummaryDto(user, profile);
    }

    private UserProfileSummaryDto toSummaryDto(User user, UserProfile profile) {
        return new UserProfileSummaryDto(
                user.getId(),
                user.getDisplayName(),
                profile.getTargetCountry(),
                profile.getTargetCity(),
                profile.getTargetJobFamily(),
                profile.getDesiredJobTitle(),
                profile.getCurrentCountry(),
                profile.getNationality(),
                profile.getExperienceYears(),
                profile.getRelatedExperienceYears(),
                profile.getLanguageLevel(),
                profile.getEnglishLevel(),
                profile.getJapaneseLevel(),
                profile.getEducation(),
                profile.getMajor(),
                profile.getGraduationStatus(),
                profile.getPreferredWorkType(),
                profile.getExpectedSalaryRange(),
                profile.getAvailableStartDate(),
                profile.getVisaSponsorshipNeeded(),
                normalizedList(profile.getTechStack()),
                normalizedList(profile.getCertifications()),
                profile.getGithubPresent(),
                profile.getPortfolioPresent(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl(),
                profile.getPrioritizeSalary(),
                profile.getPrioritizeAcceptanceProbability(),
                profile.getPrioritizeWorkLifeBalance(),
                profile.getPrioritizeCompanyValue(),
                profile.getPrioritizeJobFit(),
                profile.getProjectExperienceSummary(),
                profile.getDomainExperience(),
                profile.getCloudExperience(),
                profile.getDatabaseExperience(),
                profile.getDeploymentExperience(),
                profile.getLanguageTestScores(),
                normalizedList(profile.getPreferences())
        );
    }

    private Boolean booleanValue(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private List<String> normalizedList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
