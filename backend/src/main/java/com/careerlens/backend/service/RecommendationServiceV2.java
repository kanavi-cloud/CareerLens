package com.careerlens.backend.service;

import com.careerlens.backend.dto.JobRecommendationDto;
import com.careerlens.backend.dto.RecommendationDiagnoseRequestDto;
import com.careerlens.backend.dto.RecommendationDiagnosisResponseDto;
import com.careerlens.backend.dto.ScoreBreakdownDto;
import com.careerlens.backend.dto.UserProfileRequestDto;
import com.careerlens.backend.dto.UserProfileSummaryDto;
import com.careerlens.backend.entity.DiagnosisResult;
import com.careerlens.backend.entity.DiagnosisResult.ReadinessStatus;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PatternProfile;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.DiagnosisResultRepository;
import com.careerlens.backend.repository.JobPostingRepository;
import com.careerlens.backend.repository.PatternProfileRepository;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationServiceV2 {

    private static final int MAX_RECOMMENDATIONS = 5;
    private static final int MAX_MISSING_CORE_SKILLS = 4;
    private static final int MAX_LANGUAGE_LEVEL_GAP = 1;
    private static final int MAX_EXPERIENCE_YEAR_GAP = 2;

    private static final int DEFAULT_LANGUAGE_RANK = 1;
    private static final int DEFAULT_TOTAL_WEIGHT = 20;
    private static final int PRIORITY_WEIGHT_BONUS = 12;

    private static final int FULL_SCORE = 100;
    private static final int DEFAULT_SALARY_SCORE = 60;
    private static final int DEFAULT_WORK_LIFE_BALANCE_SCORE = 60;
    private static final int DEFAULT_COMPANY_VALUE_SCORE = 75;

    private static final int DEFAULT_PROBABILITY_WEIGHT = 30;
    private static final int DEFAULT_SALARY_WEIGHT = 15;
    private static final int DEFAULT_WORK_LIFE_BALANCE_WEIGHT = 15;
    private static final int DEFAULT_COMPANY_VALUE_WEIGHT = 15;
    private static final int DEFAULT_JOB_FIT_WEIGHT = 25;

    private static final double CORE_SKILL_SCORE_WEIGHT = 0.75;
    private static final double PREFERRED_SKILL_SCORE_WEIGHT = 0.25;
    private static final double JOB_FIT_SKILL_WEIGHT = 0.55;
    private static final double JOB_FIT_EXPERIENCE_WEIGHT = 0.30;
    private static final double JOB_FIT_PORTFOLIO_WEIGHT = 0.15;
    private static final double ACCEPTANCE_JOB_FIT_WEIGHT = 0.55;
    private static final double ACCEPTANCE_LANGUAGE_WEIGHT = 0.20;
    private static final double ACCEPTANCE_EDUCATION_WEIGHT = 0.15;
    private static final double ACCEPTANCE_PORTFOLIO_WEIGHT = 0.10;

    private static final int EXPERIENCE_GAP_PENALTY = 22;
    private static final int LANGUAGE_GAP_PENALTY = 25;
    private static final int LANGUAGE_MISSING_THRESHOLD = 75;
    private static final int EDUCATION_MISSING_THRESHOLD = 80;
    private static final int PORTFOLIO_MISSING_THRESHOLD = 80;

    private static final int IMMEDIATE_APPLY_THRESHOLD = 80;
    private static final int PREPARE_THEN_APPLY_THRESHOLD = 60;
    private static final int GRADE_A_THRESHOLD = 85;
    private static final int GRADE_B_THRESHOLD = 70;
    private static final int GRADE_C_THRESHOLD = 55;

    private static final String DEMO_EMAIL = "demo@careerlens.local";
    private static final String DEMO_DISPLAY_NAME = "CareerLens Demo User";
    private static final String DEFAULT_EDUCATION = "Bachelor";
    private static final String CATEGORY_SALARY = "연봉";
    private static final String CATEGORY_ACCEPTANCE_PROBABILITY = "합격 가능성";
    private static final String CATEGORY_WORK_LIFE_BALANCE = "워라밸";
    private static final String CATEGORY_COMPANY_VALUE = "기업 가치";
    private static final String CATEGORY_JOB_FIT = "직무 적합도";

    private static final Map<String, Integer> LANGUAGE_RANK = Map.of(
            "BASIC", 1,
            "CONVERSATIONAL", 2,
            "BUSINESS", 3,
            "FLUENT", 4,
            "NATIVE", 5
    );

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final JobPostingRepository jobPostingRepository;
    private final PatternProfileRepository patternProfileRepository;
    private final DiagnosisResultRepository diagnosisResultRepository;
    private final AiExplanationService aiExplanationService;

    public RecommendationServiceV2(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            JobPostingRepository jobPostingRepository,
            PatternProfileRepository patternProfileRepository,
            DiagnosisResultRepository diagnosisResultRepository,
            AiExplanationService aiExplanationService
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.patternProfileRepository = patternProfileRepository;
        this.diagnosisResultRepository = diagnosisResultRepository;
        this.aiExplanationService = aiExplanationService;
    }

    @Transactional
    public RecommendationDiagnosisResponseDto diagnose(RecommendationDiagnoseRequestDto request) {
        UserProfileRequestDto profileRequest = request.userProfile();
        User user = upsertUser(profileRequest);
        UserProfile profile = upsertProfile(user, profileRequest);
        return diagnoseProfile(user, profile);
    }

    @Transactional(readOnly = true)
    public RecommendationDiagnosisResponseDto getLatestRecommendations(Long userId) {
        User user = findUser(userId);
        UserProfile profile = findProfile(userId);
        List<DiagnosisResult> results = findLatestUsableResults(userId);
        return buildResponse(user, profile, results.size(), results, LocalDateTime.now());
    }

    @Transactional
    public RecommendationDiagnosisResponseDto diagnoseStoredProfile(Long userId) {
        User user = findUser(userId);
        UserProfile profile = findProfile(userId);
        return diagnoseProfile(user, profile);
    }

    @Transactional
    public RecommendationDiagnosisResponseDto diagnoseStoredProfileForJob(Long userId, Long jobId) {
        User user = findUser(userId);
        UserProfile profile = findProfile(userId);
        JobPosting job = findJob(jobId);
        DiagnosisResult result = diagnoseJob(user, profile, job);
        if (result == null) {
            throw new IllegalStateException("PatternProfile not found for job posting: " + jobId);
        }
        DiagnosisResult savedResult = diagnosisResultRepository.save(result);
        List<DiagnosisResult> results = new ArrayList<>();
        results.add(savedResult);
        return buildResponse(user, profile, 1, results, LocalDateTime.now());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private UserProfile findProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + userId));
    }

    private JobPosting findJob(Long jobId) {
        return jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found: " + jobId));
    }

    private List<DiagnosisResult> findLatestUsableResults(Long userId) {
        return diagnosisResultRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(this::hasUsableRecommendationResult)
                .sorted(Comparator.comparing(DiagnosisResult::getTotalScore).reversed())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private User upsertUser(UserProfileRequestDto request) {
        if (request.userId() != null) {
            return findUser(request.userId());
        }

        String email = valueOrDefault(request.email(), DEMO_EMAIL);
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setDisplayName(valueOrDefault(request.displayName(), DEMO_DISPLAY_NAME));
        return userRepository.save(user);
    }

    private UserProfile upsertProfile(User user, UserProfileRequestDto request) {
        Optional<UserProfile> existingProfile = userProfileRepository.findByUserId(user.getId());
        UserProfile profile = existingProfile.orElseGet(UserProfile::new);
        applyProfileRequest(profile, user, request);
        return existingProfile.isPresent() ? profile : userProfileRepository.save(profile);
    }

    private void applyProfileRequest(UserProfile profile, User user, UserProfileRequestDto request) {
        profile.setUser(user);
        profile.setTargetCountry(request.targetCountry());
        profile.setTargetCity(request.targetCity());
        profile.setTargetJobFamily(request.targetJobFamily());
        profile.setDesiredJobTitle(request.desiredJobTitle());
        profile.setCurrentCountry(request.currentCountry());
        profile.setNationality(request.nationality());
        profile.setExperienceYears(request.experienceYears());
        profile.setRelatedExperienceYears(request.relatedExperienceYears());
        profile.setLanguageLevel(valueOrDefault(request.languageLevel(), request.englishLevel()));
        profile.setEnglishLevel(request.englishLevel());
        profile.setJapaneseLevel(request.japaneseLevel());
        profile.setEducation(valueOrDefault(request.education(), DEFAULT_EDUCATION));
        profile.setMajor(request.major());
        profile.setGraduationStatus(request.graduationStatus());
        profile.setPreferredWorkType(request.preferredWorkType());
        profile.setExpectedSalaryRange(request.expectedSalaryRange());
        profile.setAvailableStartDate(request.availableStartDate());
        profile.setVisaSponsorshipNeeded(Boolean.TRUE.equals(request.visaSponsorshipNeeded()));
        profile.setTechStack(normalizeList(request.techStack()));
        profile.setCertifications(normalizeList(request.certifications()));
        profile.setGithubPresent(Boolean.TRUE.equals(request.githubPresent()));
        profile.setPortfolioPresent(Boolean.TRUE.equals(request.portfolioPresent()));
        profile.setGithubUrl(request.githubUrl());
        profile.setPortfolioUrl(request.portfolioUrl());
        profile.setPrioritizeSalary(Boolean.TRUE.equals(request.prioritizeSalary()));
        profile.setPrioritizeAcceptanceProbability(Boolean.TRUE.equals(request.prioritizeAcceptanceProbability()));
        profile.setPrioritizeWorkLifeBalance(Boolean.TRUE.equals(request.prioritizeWorkLifeBalance()));
        profile.setPrioritizeCompanyValue(Boolean.TRUE.equals(request.prioritizeCompanyValue()));
        profile.setPrioritizeJobFit(Boolean.TRUE.equals(request.prioritizeJobFit()));
        profile.setProjectExperienceSummary(request.projectExperienceSummary());
        profile.setDomainExperience(request.domainExperience());
        profile.setCloudExperience(request.cloudExperience());
        profile.setDatabaseExperience(request.databaseExperience());
        profile.setDeploymentExperience(request.deploymentExperience());
        profile.setLanguageTestScores(request.languageTestScores());
        profile.setPreferences(normalizeList(request.preferences()));
    }

    private RecommendationDiagnosisResponseDto diagnoseProfile(User user, UserProfile profile) {
        List<JobPosting> candidates = findCandidateJobs(profile);
        List<DiagnosisResult> savedResults = diagnoseAndSaveTopResults(user, profile, candidates);
        return buildResponse(user, profile, candidates.size(), savedResults, LocalDateTime.now());
    }

    private List<JobPosting> findCandidateJobs(UserProfile profile) {
        return jobPostingRepository.findByCountryIgnoreCaseAndJobFamilyIgnoreCase(
                        profile.getTargetCountry(),
                        profile.getTargetJobFamily()
                ).stream()
                .filter(job -> passesHardFilter(profile, job))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private List<DiagnosisResult> diagnoseAndSaveTopResults(User user, UserProfile profile, List<JobPosting> candidates) {
        return candidates.stream()
                .map(job -> diagnoseJob(user, profile, job))
                .filter(result -> result != null)
                .sorted(Comparator.comparing(DiagnosisResult::getTotalScore).reversed())
                .limit(MAX_RECOMMENDATIONS)
                .map(diagnosisResultRepository::save)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private boolean passesHardFilter(UserProfile profile, JobPosting job) {
        if (!same(profile.getTargetCountry(), job.getCountry()) || !same(profile.getTargetJobFamily(), job.getJobFamily())) {
            return false;
        }
        if (languageGap(profile, job) > MAX_LANGUAGE_LEVEL_GAP) {
            return false;
        }
        int userExperience = safe(profile.getExperienceYears());
        int minExperience = safe(job.getMinExperienceYears());
        return minExperience - userExperience <= MAX_EXPERIENCE_YEAR_GAP;
    }

    private int languageGap(UserProfile profile, JobPosting job) {
        int userLanguage = languageRank(profile.getLanguageLevel());
        int requiredLanguage = requiredLanguageRank(job);
        return requiredLanguage - userLanguage;
    }

    private int requiredLanguageRank(JobPosting job) {
        return job.getRequiredLanguages().stream()
                .mapToInt(this::languageRankFromRequirement)
                .max()
                .orElse(DEFAULT_LANGUAGE_RANK);
    }

    private DiagnosisResult diagnoseJob(User user, UserProfile profile, JobPosting job) {
        PatternScore bestScore = findBestPatternScore(profile, job);
        if (bestScore == null) {
            return null;
        }

        return buildDiagnosisResult(user, profile, job, bestScore);
    }

    private PatternScore findBestPatternScore(UserProfile profile, JobPosting job) {
        List<PatternProfile> patterns = patternProfileRepository.findByJobPostingId(job.getId());
        if (patterns.isEmpty()) {
            patterns = new ArrayList<>();
            patterns.add(createFallbackPattern(job));
        }

        return patterns.stream()
                .map(pattern -> scorePattern(profile, job, pattern))
                .max(Comparator.comparing(PatternScore::totalScore))
                .orElse(null);
    }

    private DiagnosisResult buildDiagnosisResult(User user, UserProfile profile, JobPosting job, PatternScore bestScore) {
        ReadinessStatus readinessStatus = readinessStatus(bestScore.totalScore());
        DiagnosisResult result = new DiagnosisResult();
        result.setUser(user);
        result.setJobPosting(job);
        result.setPatternProfile(bestScore.pattern());
        result.setPatternRef(bestScore.pattern().getPatternRef());
        result.setPatternTitle(bestScore.pattern().getPatternTitle());
        result.setPatternEvidenceSummary(bestScore.pattern().getEvidenceSummary());
        result.setTotalScore(bestScore.totalScore());
        result.setSkillScore(bestScore.skillScore());
        result.setExperienceScore(bestScore.experienceScore());
        result.setLanguageScore(bestScore.languageScore());
        result.setEducationScore(bestScore.educationScore());
        result.setPortfolioScore(bestScore.portfolioScore());
        result.setAcceptanceProbabilityScore(bestScore.acceptanceProbabilityScore());
        result.setSalaryScore(bestScore.salaryScore());
        result.setWorkLifeBalanceScore(bestScore.workLifeBalanceScore());
        result.setCompanyValueScore(bestScore.companyValueScore());
        result.setJobFitScore(bestScore.jobFitScore());
        result.setProbabilityWeight(bestScore.weights().probabilityWeight());
        result.setSalaryWeight(bestScore.weights().salaryWeight());
        result.setWorkLifeBalanceWeight(bestScore.weights().workLifeBalanceWeight());
        result.setCompanyValueWeight(bestScore.weights().companyValueWeight());
        result.setJobFitWeight(bestScore.weights().jobFitWeight());
        result.setRecommendationGrade(grade(bestScore.totalScore()));
        result.setPrimaryRecommendationCategory(primaryCategory(profile, bestScore));
        result.setReadinessStatus(readinessStatus);
        result.setMissingItems(bestScore.missingItems());
        result.setRecommendationSummary(aiExplanationService.buildRecommendationSummary(
                job,
                bestScore.totalScore(),
                bestScore.matchedSkills(),
                bestScore.missingItems()
        ));
        result.setNextActionSummary(aiExplanationService.buildNextActionSummary(readinessStatus, bestScore.missingItems()));
        result.setCreatedAt(LocalDateTime.now());
        return result;
    }

    private PatternProfile createFallbackPattern(JobPosting job) {
        PatternProfile pattern = new PatternProfile();
        pattern.setPatternRef("fallback-pattern:job:" + job.getId());
        pattern.setJobPosting(job);
        pattern.setPatternTitle(valueOrDefault(job.getCompanyName(), "회사 미기재") + " "
                + valueOrDefault(job.getJobFamily(), "직무") + " 공고 기반 기본 패턴");
        pattern.setJobFamily(job.getJobFamily());
        pattern.setTargetExperienceYears(job.getMinExperienceYears() == null ? 0 : job.getMinExperienceYears());
        pattern.setLanguageBenchmark(job.getRequiredLanguages() == null || job.getRequiredLanguages().isEmpty()
                ? "English Business"
                : String.join(", ", job.getRequiredLanguages()));
        pattern.setEducationBenchmark(valueOrDefault(job.getDegreeRequirement(), "Degree not explicitly required"));
        pattern.setGithubExpected(true);
        pattern.setPortfolioExpected(Boolean.TRUE.equals(job.getPortfolioRequired()));
        pattern.setProjectExperienceBenchmark(valueOrDefault(job.getJobFamily(), "직무") + " 직무의 핵심 기술을 활용한 프로젝트 경험");
        pattern.setEvidenceSummary("이 공고는 연결된 직원 표본/가상 합격자 패턴이 아직 없어 공고의 요구 기술과 경력 조건을 기반으로 임시 진단 패턴을 생성했습니다.");
        pattern.setCoreSkills(normalizeList(job.getRequiredSkills()));
        pattern.setPreferredSkills(normalizeList(job.getPreferredSkills()));
        pattern.setCertifications(new ArrayList<>());
        return patternProfileRepository.save(pattern);
    }

    private PatternScore scorePattern(UserProfile profile, JobPosting job, PatternProfile pattern) {
        Set<String> userSkills = normalizedSet(profile.getTechStack());
        List<String> coreSkills = normalizeList(pattern.getCoreSkills());
        List<String> preferredSkills = normalizeList(pattern.getPreferredSkills());

        List<String> matchedCore = matchingSkills(coreSkills, userSkills);
        List<String> matchedPreferred = matchingSkills(preferredSkills, userSkills);
        List<String> missingItems = new ArrayList<>();

        addMissingCoreSkills(missingItems, coreSkills, userSkills);

        int skillScore = skillScore(coreSkills, matchedCore, preferredSkills, matchedPreferred);

        int experienceGap = experienceGap(profile, pattern);
        int experienceScore = clamp(FULL_SCORE - experienceGap * EXPERIENCE_GAP_PENALTY);
        addExperienceMissingItem(missingItems, experienceGap);

        int languageScore = languageScore(profile.getLanguageLevel(), pattern.getLanguageBenchmark());
        addLanguageMissingItem(missingItems, pattern, languageScore);

        int educationScore = educationScore(profile, pattern);
        addEducationMissingItem(missingItems, pattern, educationScore);

        int portfolioScore = portfolioScore(profile, job, pattern);
        addPortfolioMissingItems(missingItems, profile, job, pattern, portfolioScore);

        int jobFitScore = jobFitScore(skillScore, experienceScore, portfolioScore);
        int acceptanceProbabilityScore = acceptanceProbabilityScore(
                jobFitScore,
                languageScore,
                educationScore,
                portfolioScore
        );
        int salaryScore = scoreOrDefault(job.getSalaryScore(), DEFAULT_SALARY_SCORE);
        int workLifeBalanceScore = scoreOrDefault(job.getWorkLifeBalanceScore(), DEFAULT_WORK_LIFE_BALANCE_SCORE);
        int companyValueScore = scoreOrDefault(job.getCompanyValueScore(), DEFAULT_COMPANY_VALUE_SCORE);
        WeightSet weights = adjustedWeights(profile, job);

        int totalScore = totalScore(
                acceptanceProbabilityScore,
                salaryScore,
                workLifeBalanceScore,
                companyValueScore,
                jobFitScore,
                weights
        );

        return new PatternScore(
                pattern,
                totalScore,
                skillScore,
                experienceScore,
                languageScore,
                educationScore,
                portfolioScore,
                acceptanceProbabilityScore,
                salaryScore,
                workLifeBalanceScore,
                companyValueScore,
                jobFitScore,
                weights,
                deduplicate(missingItems),
                deduplicateSkills(matchedCore, matchedPreferred)
        );
    }

    private List<String> matchingSkills(List<String> candidateSkills, Set<String> userSkills) {
        return candidateSkills.stream()
                .filter(skill -> containsIgnoreCase(userSkills, skill))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private void addMissingCoreSkills(List<String> missingItems, List<String> coreSkills, Set<String> userSkills) {
        coreSkills.stream()
                .filter(skill -> !containsIgnoreCase(userSkills, skill))
                .limit(MAX_MISSING_CORE_SKILLS)
                .forEach(skill -> missingItems.add("핵심 기술 보완: " + skill));
    }

    private int skillScore(
            List<String> coreSkills,
            List<String> matchedCore,
            List<String> preferredSkills,
            List<String> matchedPreferred
    ) {
        int coreScore = listMatchScore(matchedCore.size(), coreSkills.size());
        int preferredScore = listMatchScore(matchedPreferred.size(), preferredSkills.size());
        return clamp((int) Math.round(
                coreScore * CORE_SKILL_SCORE_WEIGHT
                        + preferredScore * PREFERRED_SKILL_SCORE_WEIGHT
        ));
    }

    private int listMatchScore(int matchedCount, int totalCount) {
        return totalCount == 0 ? FULL_SCORE : (matchedCount * FULL_SCORE) / totalCount;
    }

    private int experienceGap(UserProfile profile, PatternProfile pattern) {
        return Math.max(0, safe(pattern.getTargetExperienceYears()) - relatedExperienceYears(profile));
    }

    private int relatedExperienceYears(UserProfile profile) {
        return profile.getRelatedExperienceYears() == null
                ? safe(profile.getExperienceYears())
                : profile.getRelatedExperienceYears();
    }

    private void addExperienceMissingItem(List<String> missingItems, int experienceGap) {
        if (experienceGap > 0) {
            missingItems.add("직무 관련 경력 보완: " + experienceGap + "년 이상 추가 경험 필요");
        }
    }

    private void addLanguageMissingItem(List<String> missingItems, PatternProfile pattern, int languageScore) {
        if (languageScore < LANGUAGE_MISSING_THRESHOLD) {
            missingItems.add("언어 수준 보완: " + pattern.getLanguageBenchmark() + " 기준 필요");
        }
    }

    private void addEducationMissingItem(List<String> missingItems, PatternProfile pattern, int educationScore) {
        if (educationScore < EDUCATION_MISSING_THRESHOLD) {
            missingItems.add("학력/자격 보완: " + pattern.getEducationBenchmark() + " 또는 관련 자격 필요");
        }
    }

    private void addPortfolioMissingItems(
            List<String> missingItems,
            UserProfile profile,
            JobPosting job,
            PatternProfile pattern,
            int portfolioScore
    ) {
        if (portfolioScore >= PORTFOLIO_MISSING_THRESHOLD) {
            return;
        }
        if (Boolean.TRUE.equals(pattern.getGithubExpected()) && !Boolean.TRUE.equals(profile.getGithubPresent())) {
            missingItems.add("GitHub 공개 저장소 보완");
        }
        if ((Boolean.TRUE.equals(pattern.getPortfolioExpected()) || Boolean.TRUE.equals(job.getPortfolioRequired()))
                && !Boolean.TRUE.equals(profile.getPortfolioPresent())) {
            missingItems.add("포트폴리오 대표 프로젝트 정리");
        }
    }

    private int jobFitScore(int skillScore, int experienceScore, int portfolioScore) {
        return clamp((int) Math.round(
                skillScore * JOB_FIT_SKILL_WEIGHT
                        + experienceScore * JOB_FIT_EXPERIENCE_WEIGHT
                        + portfolioScore * JOB_FIT_PORTFOLIO_WEIGHT
        ));
    }

    private int acceptanceProbabilityScore(
            int jobFitScore,
            int languageScore,
            int educationScore,
            int portfolioScore
    ) {
        return clamp((int) Math.round(
                jobFitScore * ACCEPTANCE_JOB_FIT_WEIGHT
                        + languageScore * ACCEPTANCE_LANGUAGE_WEIGHT
                        + educationScore * ACCEPTANCE_EDUCATION_WEIGHT
                        + portfolioScore * ACCEPTANCE_PORTFOLIO_WEIGHT
        ));
    }

    private int totalScore(
            int acceptanceProbabilityScore,
            int salaryScore,
            int workLifeBalanceScore,
            int companyValueScore,
            int jobFitScore,
            WeightSet weights
    ) {
        return clamp((int) Math.round(
                acceptanceProbabilityScore * weights.probabilityWeight() / 100.0
                        + salaryScore * weights.salaryWeight() / 100.0
                        + workLifeBalanceScore * weights.workLifeBalanceWeight() / 100.0
                        + companyValueScore * weights.companyValueWeight() / 100.0
                        + jobFitScore * weights.jobFitWeight() / 100.0
        ));
    }

    private RecommendationDiagnosisResponseDto buildResponse(
            User user,
            UserProfile profile,
            int candidateCount,
            List<DiagnosisResult> results,
            LocalDateTime diagnosedAt
    ) {
        List<JobRecommendationDto> recommendations = results.stream()
                .map(this::toRecommendationDto)
                .collect(Collectors.toCollection(ArrayList::new));
        ReadinessStatus overall = results.stream()
                .map(DiagnosisResult::getReadinessStatus)
                .min(Comparator.comparingInt(this::readinessOrder))
                .orElse(ReadinessStatus.LONG_TERM_PREPARE);

        return new RecommendationDiagnosisResponseDto(
                user.getId(),
                toProfileDto(user, profile),
                criteriaSummary(profile),
                candidateCount,
                recommendations.size(),
                overall.name(),
                readinessLabel(overall),
                recommendations,
                diagnosedAt
        );
    }

    private JobRecommendationDto toRecommendationDto(DiagnosisResult result) {
        JobPosting job = result.getJobPosting();
        ReadinessStatus readinessStatus = result.getReadinessStatus() == null
                ? ReadinessStatus.LONG_TERM_PREPARE
                : result.getReadinessStatus();
        return new JobRecommendationDto(
                result.getId(),
                job.getId(),
                job.getCompanyName(),
                job.getCountry(),
                job.getJobTitle(),
                job.getJobFamily(),
                job.getSalaryRange(),
                job.getWorkType(),
                job.getVisaRequirement(),
                result.getPatternRef(),
                result.getPatternTitle(),
                result.getPatternEvidenceSummary(),
                result.getRecommendationGrade(),
                result.getPrimaryRecommendationCategory(),
                readinessStatus.name(),
                readinessLabel(readinessStatus),
                result.getRecommendationSummary(),
                result.getNextActionSummary(),
                normalizeList(result.getMissingItems()),
                new ScoreBreakdownDto(
                        result.getTotalScore(),
                        result.getSkillScore(),
                        result.getExperienceScore(),
                        result.getLanguageScore(),
                        result.getEducationScore(),
                        result.getPortfolioScore()
                ),
                result.getAcceptanceProbabilityScore(),
                result.getSalaryScore(),
                result.getWorkLifeBalanceScore(),
                result.getCompanyValueScore(),
                result.getJobFitScore(),
                scoreOrDefault(result.getProbabilityWeight(), scoreOrDefault(job.getProbabilityWeight(), DEFAULT_PROBABILITY_WEIGHT)),
                scoreOrDefault(result.getSalaryWeight(), scoreOrDefault(job.getSalaryWeight(), DEFAULT_SALARY_WEIGHT)),
                scoreOrDefault(result.getWorkLifeBalanceWeight(), scoreOrDefault(job.getWorkLifeBalanceWeight(), DEFAULT_WORK_LIFE_BALANCE_WEIGHT)),
                scoreOrDefault(result.getCompanyValueWeight(), scoreOrDefault(job.getCompanyValueWeight(), DEFAULT_COMPANY_VALUE_WEIGHT)),
                scoreOrDefault(result.getJobFitWeight(), scoreOrDefault(job.getJobFitWeight(), DEFAULT_JOB_FIT_WEIGHT)),
                job.getEvaluationRationale()
        );
    }

    private boolean hasUsableRecommendationResult(DiagnosisResult result) {
        return result != null
                && result.getJobPosting() != null
                && result.getTotalScore() != null;
    }

    private UserProfileSummaryDto toProfileDto(User user, UserProfile profile) {
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
                normalizeList(profile.getTechStack()),
                normalizeList(profile.getCertifications()),
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
                normalizeList(profile.getPreferences())
        );
    }

    private int languageScore(String userLevel, String benchmark) {
        int gap = Math.max(0, languageRank(benchmark) - languageRank(userLevel));
        return clamp(FULL_SCORE - gap * LANGUAGE_GAP_PENALTY);
    }

    private String criteriaSummary(UserProfile profile) {
        String jobFamily = valueOrDefault(profile.getTargetJobFamily(), "직무군");
        if ("AI/ML".equalsIgnoreCase(jobFamily) || "Data".equalsIgnoreCase(jobFamily)) {
            return "국가, 직무군, 언어, 최소 경력으로 공고를 1차 필터링한 뒤 " + jobFamily
                    + " 공고의 PatternProfile과 사용자 프로필을 비교했습니다. 외부 API 공고는 공개 공고 본문 기반 기본 패턴을 사용하므로, 직원 표본 기반 seed-data보다 추천 근거가 제한될 수 있습니다.";
        }
        return "국가, 직무군, 언어, 최소 경력으로 공고를 1차 필터링한 뒤 공고별 PatternProfile과 사용자 프로필을 비교했습니다. 최종 점수는 공고별 평가 가중치와 사용자가 선택한 우선순위를 함께 반영합니다.";
    }

    private int educationScore(UserProfile profile, PatternProfile pattern) {
        if (containsAny(profile.getEducation(), "master", "phd", "석사", "박사")) {
            return 100;
        }
        if (containsAny(pattern.getEducationBenchmark(), "master", "석사")) {
            boolean hasCert = profile.getCertifications() != null && !profile.getCertifications().isEmpty();
            return hasCert ? 80 : 62;
        }
        return 90;
    }

    private int portfolioScore(UserProfile profile, JobPosting job, PatternProfile pattern) {
        int checks = 0;
        int passed = 0;
        if (Boolean.TRUE.equals(pattern.getGithubExpected())) {
            checks++;
            if (Boolean.TRUE.equals(profile.getGithubPresent())) {
                passed++;
            }
        }
        if (Boolean.TRUE.equals(pattern.getPortfolioExpected()) || Boolean.TRUE.equals(job.getPortfolioRequired())) {
            checks++;
            if (Boolean.TRUE.equals(profile.getPortfolioPresent())) {
                passed++;
            }
        }
        return checks == 0 ? 100 : (passed * 100) / checks;
    }

    private WeightSet adjustedWeights(UserProfile profile, JobPosting job) {
        int probability = scoreOrDefault(job.getProbabilityWeight(), DEFAULT_PROBABILITY_WEIGHT);
        int salary = scoreOrDefault(job.getSalaryWeight(), DEFAULT_SALARY_WEIGHT);
        int workLife = scoreOrDefault(job.getWorkLifeBalanceWeight(), DEFAULT_WORK_LIFE_BALANCE_WEIGHT);
        int company = scoreOrDefault(job.getCompanyValueWeight(), DEFAULT_COMPANY_VALUE_WEIGHT);
        int fit = scoreOrDefault(job.getJobFitWeight(), DEFAULT_JOB_FIT_WEIGHT);

        if (Boolean.TRUE.equals(profile.getPrioritizeAcceptanceProbability())) {
            probability += PRIORITY_WEIGHT_BONUS;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeSalary())) {
            salary += PRIORITY_WEIGHT_BONUS;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeWorkLifeBalance())) {
            workLife += PRIORITY_WEIGHT_BONUS;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeCompanyValue())) {
            company += PRIORITY_WEIGHT_BONUS;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeJobFit())) {
            fit += PRIORITY_WEIGHT_BONUS;
        }

        int total = probability + salary + workLife + company + fit;
        int normalizedProbability = normalizeWeight(probability, total);
        int normalizedSalary = normalizeWeight(salary, total);
        int normalizedWorkLife = normalizeWeight(workLife, total);
        int normalizedCompany = normalizeWeight(company, total);
        return new WeightSet(
                normalizedProbability,
                normalizedSalary,
                normalizedWorkLife,
                normalizedCompany,
                Math.max(1, FULL_SCORE - normalizedProbability - normalizedSalary - normalizedWorkLife - normalizedCompany)
        );
    }

    private int normalizeWeight(int value, int total) {
        if (total <= 0) {
            return DEFAULT_TOTAL_WEIGHT;
        }
        return Math.max(1, (int) Math.round(value * (double) FULL_SCORE / total));
    }

    private int scoreOrDefault(Integer value, int fallback) {
        return value == null ? fallback : clamp(value);
    }

    private String primaryCategory(UserProfile profile, PatternScore score) {
        String prioritizedCategory = prioritizedCategory(profile);
        if (prioritizedCategory != null) {
            return prioritizedCategory;
        }

        int highestCategoryScore = highestCategoryScore(score);
        if (highestCategoryScore == score.acceptanceProbabilityScore()) {
            return CATEGORY_ACCEPTANCE_PROBABILITY;
        }
        if (highestCategoryScore == score.salaryScore()) {
            return CATEGORY_SALARY;
        }
        if (highestCategoryScore == score.workLifeBalanceScore()) {
            return CATEGORY_WORK_LIFE_BALANCE;
        }
        if (highestCategoryScore == score.companyValueScore()) {
            return CATEGORY_COMPANY_VALUE;
        }
        return CATEGORY_JOB_FIT;
    }

    private String prioritizedCategory(UserProfile profile) {
        if (Boolean.TRUE.equals(profile.getPrioritizeSalary())) {
            return CATEGORY_SALARY;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeAcceptanceProbability())) {
            return CATEGORY_ACCEPTANCE_PROBABILITY;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeWorkLifeBalance())) {
            return CATEGORY_WORK_LIFE_BALANCE;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeCompanyValue())) {
            return CATEGORY_COMPANY_VALUE;
        }
        if (Boolean.TRUE.equals(profile.getPrioritizeJobFit())) {
            return CATEGORY_JOB_FIT;
        }
        return null;
    }

    private int highestCategoryScore(PatternScore score) {
        return Math.max(
                score.acceptanceProbabilityScore(),
                Math.max(
                        score.salaryScore(),
                        Math.max(score.workLifeBalanceScore(), Math.max(score.companyValueScore(), score.jobFitScore()))
                )
        );
    }

    private ReadinessStatus readinessStatus(int totalScore) {
        if (totalScore >= IMMEDIATE_APPLY_THRESHOLD) {
            return ReadinessStatus.IMMEDIATE_APPLY;
        }
        if (totalScore >= PREPARE_THEN_APPLY_THRESHOLD) {
            return ReadinessStatus.PREPARE_THEN_APPLY;
        }
        return ReadinessStatus.LONG_TERM_PREPARE;
    }

    private String grade(int totalScore) {
        if (totalScore >= GRADE_A_THRESHOLD) {
            return "A";
        }
        if (totalScore >= GRADE_B_THRESHOLD) {
            return "B";
        }
        if (totalScore >= GRADE_C_THRESHOLD) {
            return "C";
        }
        return "D";
    }

    private String readinessLabel(ReadinessStatus status) {
        return switch (status) {
            case IMMEDIATE_APPLY -> "즉시 지원 가능";
            case PREPARE_THEN_APPLY -> "준비 후 지원 가능";
            case LONG_TERM_PREPARE -> "장기 준비 필요";
        };
    }

    private int readinessOrder(ReadinessStatus status) {
        return switch (status) {
            case IMMEDIATE_APPLY -> 1;
            case PREPARE_THEN_APPLY -> 2;
            case LONG_TERM_PREPARE -> 3;
        };
    }

    private int languageRankFromRequirement(String requirement) {
        if (requirement == null) {
            return DEFAULT_LANGUAGE_RANK;
        }
        String[] tokens = requirement.split(":");
        return languageRank(tokens[tokens.length - 1].trim());
    }

    private int languageRank(String value) {
        if (value == null) {
            return DEFAULT_LANGUAGE_RANK;
        }
        return LANGUAGE_RANK.getOrDefault(value.trim().toUpperCase(Locale.ROOT), DEFAULT_LANGUAGE_RANK);
    }

    private boolean same(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }

    private boolean containsAny(String source, String... values) {
        if (source == null) {
            return false;
        }
        String lower = source.toLowerCase(Locale.ROOT);
        for (String value : values) {
            if (lower.contains(value.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private boolean containsIgnoreCase(Set<String> values, String target) {
        return values.contains(normalize(target));
    }

    private Set<String> normalizedSet(List<String> values) {
        Set<String> set = new LinkedHashSet<>();
        normalizeList(values).forEach(value -> set.add(normalize(value)));
        return set;
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private List<String> deduplicate(List<String> values) {
        return new ArrayList<>(new LinkedHashSet<>(values));
    }

    private List<String> deduplicateSkills(List<String> first, List<String> second) {
        List<String> combined = new ArrayList<>();
        combined.addAll(first);
        combined.addAll(second);
        return deduplicate(combined);
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record PatternScore(
            PatternProfile pattern,
            int totalScore,
            int skillScore,
            int experienceScore,
            int languageScore,
            int educationScore,
            int portfolioScore,
            int acceptanceProbabilityScore,
            int salaryScore,
            int workLifeBalanceScore,
            int companyValueScore,
            int jobFitScore,
            WeightSet weights,
            List<String> missingItems,
            List<String> matchedSkills
    ) {
    }

    private record WeightSet(
            int probabilityWeight,
            int salaryWeight,
            int workLifeBalanceWeight,
            int companyValueWeight,
            int jobFitWeight
    ) {
    }
}
