package com.careerlens.backend.config;

import com.careerlens.backend.entity.EmployeeProfileSample;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PatternProfile;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.EmployeeProfileSampleRepository;
import com.careerlens.backend.repository.JobPostingRepository;
import com.careerlens.backend.repository.PatternProfileRepository;
import com.careerlens.backend.repository.ApplicationRecordRepository;
import com.careerlens.backend.repository.DiagnosisResultRepository;
import com.careerlens.backend.repository.PlannerRoadmapRepository;
import com.careerlens.backend.repository.PlannerTaskRepository;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.repository.VerificationRequestRepository;
import com.careerlens.backend.repository.VerificationBadgeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class SeedDataLoader implements ApplicationRunner {

    private static final Pattern INTEGER_PATTERN = Pattern.compile("\\d+");

    private final ObjectMapper objectMapper;
    private final JobPostingRepository jobPostingRepository;
    private final EmployeeProfileSampleRepository employeeProfileSampleRepository;
    private final PatternProfileRepository patternProfileRepository;
    private final ApplicationRecordRepository applicationRecordRepository;
    private final DiagnosisResultRepository diagnosisResultRepository;
    private final PlannerRoadmapRepository plannerRoadmapRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final VerificationBadgeRepository verificationBadgeRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final String seedPath;
    private final String processedSeedPath;
    private final boolean seedResetEnabled;

    public SeedDataLoader(
            ObjectMapper objectMapper,
            JobPostingRepository jobPostingRepository,
            EmployeeProfileSampleRepository employeeProfileSampleRepository,
            PatternProfileRepository patternProfileRepository,
            ApplicationRecordRepository applicationRecordRepository,
            DiagnosisResultRepository diagnosisResultRepository,
            PlannerRoadmapRepository plannerRoadmapRepository,
            PlannerTaskRepository plannerTaskRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            VerificationRequestRepository verificationRequestRepository,
            VerificationBadgeRepository verificationBadgeRepository,
            @Value("${careerlens.seed.path}") String seedPath,
            @Value("${careerlens.seed.processed-path:../seed-data/processed}") String processedSeedPath,
            @Value("${app.seed.reset-enabled:false}") boolean seedResetEnabled
    ) {
        this.objectMapper = objectMapper;
        this.jobPostingRepository = jobPostingRepository;
        this.employeeProfileSampleRepository = employeeProfileSampleRepository;
        this.patternProfileRepository = patternProfileRepository;
        this.applicationRecordRepository = applicationRecordRepository;
        this.diagnosisResultRepository = diagnosisResultRepository;
        this.plannerRoadmapRepository = plannerRoadmapRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.verificationRequestRepository = verificationRequestRepository;
        this.verificationBadgeRepository = verificationBadgeRepository;
        this.seedPath = seedPath;
        this.processedSeedPath = processedSeedPath;
        this.seedResetEnabled = seedResetEnabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (hasProcessedCsvSeed()) {
            loadProcessedCsvSeed();
            ensureDemoUserProfile();
            return;
        }

        SeedPayload payload = readJsonPayload();
        Map<String, JobPosting> jobsByRef = saveJobs(payload.jobPostings);
        Map<String, EmployeeProfileSample> samplesByRef = saveSamples(payload.employeeProfileSamples);
        savePatterns(payload.patternProfiles, jobsByRef, samplesByRef);
        ensureDemoUserProfile();
    }

    private Path resolveProcessedSeedBasePath() {
        Path configuredBase = Path.of(processedSeedPath);
        if (Files.isDirectory(configuredBase)) {
            return configuredBase;
        }
        Path rootRelativeBase = Path.of("seed-data/processed");
        if (Files.isDirectory(rootRelativeBase)) {
            return rootRelativeBase;
        }
        return configuredBase;
    }

    private boolean hasProcessedCsvSeed() {
        Path basePath = resolveProcessedSeedBasePath();
        Path jobsPath = basePath.resolve("job-postings.csv");
        Path samplesPath = basePath.resolve("employee-samples.csv");
        Path patternsPath = basePath.resolve("pattern-profiles.csv");
        Path acceptedPatternsPath = basePath.resolve("accepted-candidate-patterns.csv");
        return Files.isRegularFile(jobsPath)
                && Files.isRegularFile(samplesPath)
                && (Files.isRegularFile(patternsPath) || Files.isRegularFile(acceptedPatternsPath));
    }

    private void loadProcessedCsvSeed() throws IOException {
        Path basePath = resolveProcessedSeedBasePath();
        if (seedResetEnabled) {
            resetRecommendationSeedData();
        }
        Map<String, JobPosting> jobsByRef = saveJobs(readJobCsv(basePath.resolve("job-postings.csv")));
        Map<String, EmployeeProfileSample> samplesByRef = saveSamples(readEmployeeCsv(basePath.resolve("employee-samples.csv")));

        Path patternsPath = basePath.resolve("pattern-profiles.csv");
        if (Files.isRegularFile(patternsPath)) {
            savePatterns(readPatternCsv(patternsPath), jobsByRef, samplesByRef);
            return;
        }

        Path acceptedPatternsPath = basePath.resolve("accepted-candidate-patterns.csv");
        savePatterns(readAcceptedCandidatePatternCsv(acceptedPatternsPath), jobsByRef, samplesByRef);
    }

    private void resetRecommendationSeedData() {
        applicationRecordRepository.deleteAll();
        verificationBadgeRepository.deleteAll();
        verificationRequestRepository.deleteAll();
        plannerTaskRepository.deleteAll();
        plannerRoadmapRepository.deleteAll();
        diagnosisResultRepository.deleteAll();
        patternProfileRepository.deleteAll();
        employeeProfileSampleRepository.deleteAll();
        jobPostingRepository.deleteAll();
    }

    private void ensureDemoUserProfile() {
        User demoUser = userRepository.findByLoginId("demo")
                .or(() -> userRepository.findByEmail("demo@careerlens.local"))
                .orElseGet(User::new);
        boolean newUser = demoUser.getId() == null;
        demoUser.setLoginId("demo");
        demoUser.setDisplayName("CareerLens Demo");
        demoUser.setEmail("demo@careerlens.local");
        if (newUser || demoUser.getPasswordHash() == null || demoUser.getPasswordHash().isBlank()) {
            demoUser.setPasswordHash(passwordEncoder.encode("CareerLens123!"));
        }
        if (demoUser.getCreatedAt() == null) {
            demoUser.setCreatedAt(java.time.LocalDateTime.now());
        }
        User savedUser = userRepository.save(demoUser);

        if (userProfileRepository.findByUserId(savedUser.getId()).isPresent()) {
            return;
        }

        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        profile.setTargetCountry("United States");
        profile.setTargetCity("Seattle");
        profile.setTargetJobFamily("Backend");
        profile.setDesiredJobTitle("Backend Software Engineer");
        profile.setCurrentCountry("South Korea");
        profile.setNationality("South Korea");
        profile.setExperienceYears(3);
        profile.setRelatedExperienceYears(2);
        profile.setLanguageLevel("BUSINESS");
        profile.setEnglishLevel("BUSINESS");
        profile.setJapaneseLevel("BASIC");
        profile.setEducation("Bachelor in Computer Science");
        profile.setMajor("Computer Science");
        profile.setGraduationStatus("Graduated");
        profile.setPreferredWorkType("Hybrid");
        profile.setExpectedSalaryRange("USD 100k-130k");
        profile.setAvailableStartDate("Within 3 months");
        profile.setVisaSponsorshipNeeded(true);
        profile.setGithubPresent(true);
        profile.setPortfolioPresent(true);
        profile.setGithubUrl("https://github.com/careerlens-demo");
        profile.setPortfolioUrl("https://portfolio.example.com");
        profile.setPrioritizeSalary(false);
        profile.setPrioritizeAcceptanceProbability(true);
        profile.setPrioritizeWorkLifeBalance(false);
        profile.setPrioritizeCompanyValue(false);
        profile.setPrioritizeJobFit(true);
        profile.setProjectExperienceSummary("Built REST APIs, database-backed services, and deployment-ready backend projects.");
        profile.setDomainExperience("Cloud backend and career platform prototype");
        profile.setCloudExperience("AWS EC2, RDS, S3 basics");
        profile.setDatabaseExperience("MySQL schema design and query optimization");
        profile.setDeploymentExperience("Docker-based local deployment and CI/CD basics");
        profile.setLanguageTestScores("TOEIC 860");
        profile.setTechStack(mutableValues("Java", "Spring Boot", "MySQL", "REST API", "Docker"));
        profile.setCertifications(mutableValues("AWS Cloud Practitioner"));
        profile.setPreferences(mutableValues("Hybrid", "Visa support", "Cloud backend"));
        userProfileRepository.save(profile);
    }

    private List<String> mutableValues(String... values) {
        List<String> result = new ArrayList<>();
        for (String value : values) {
            result.add(value);
        }
        return result;
    }

    private SeedPayload readJsonPayload() throws IOException {
        File configuredFile = new File(seedPath);
        if (configuredFile.exists()) {
            return objectMapper.readValue(configuredFile, SeedPayload.class);
        }
        File rootRelativeFile = new File("seed-data/recommendation-seed.json");
        if (rootRelativeFile.exists()) {
            return objectMapper.readValue(rootRelativeFile, SeedPayload.class);
        }
        ClassPathResource resource = new ClassPathResource("recommendation-seed.json");
        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, SeedPayload.class);
        }
    }

    private List<JobPostingSeed> readJobCsv(Path path) throws IOException {
        List<JobPostingSeed> seeds = new ArrayList<>();
        for (CSVRecord record : parseCsv(path)) {
            if (!parseBoolean(value(record, "active"), true)) {
                continue;
            }
            if (blank(value(record, "external_ref"))) {
                continue;
            }

            JobPostingSeed seed = new JobPostingSeed();
            seed.externalRef = value(record, "external_ref");
            seed.companyName = value(record, "company_name");
            seed.country = value(record, "country");
            seed.jobTitle = value(record, "job_title");
            seed.jobFamily = value(record, "job_family");
            seed.requiredSkills = splitList(value(record, "required_skills"));
            seed.preferredSkills = splitList(value(record, "preferred_skills"));
            seed.requiredLanguages = splitList(value(record, "required_languages"));
            seed.minExperienceYears = parseInteger(value(record, "min_experience_years"));
            seed.degreeRequirement = value(record, "degree_requirement");
            seed.portfolioRequired = parseBoolean(value(record, "portfolio_required"), false);
            seed.visaRequirement = value(record, "visa_requirement");
            seed.salaryRange = value(record, "salary_range");
            seed.workType = value(record, "work_type");
            seed.applicationDeadline = parseDate(value(record, "application_deadline"));
            seed.salaryScore = firstPresentInteger(value(record, "salary_score"), inferSalaryScore(seed.salaryRange));
            seed.workLifeBalanceScore = firstPresentInteger(value(record, "work_life_balance_score"), inferWorkLifeBalanceScore(seed.workType));
            seed.companyValueScore = firstPresentInteger(value(record, "company_value_score"), "75");
            seed.probabilityWeight = firstPresentInteger(value(record, "probability_weight"), "30");
            seed.salaryWeight = firstPresentInteger(value(record, "salary_weight"), "15");
            seed.workLifeBalanceWeight = firstPresentInteger(value(record, "work_life_balance_weight"), "15");
            seed.companyValueWeight = firstPresentInteger(value(record, "company_value_weight"), "15");
            seed.jobFitWeight = firstPresentInteger(value(record, "job_fit_weight"), "25");
            seed.evaluationRationale = value(record, "evaluation_rationale");
            seeds.add(seed);
        }
        return seeds;
    }

    private List<EmployeeProfileSampleSeed> readEmployeeCsv(Path path) throws IOException {
        List<EmployeeProfileSampleSeed> seeds = new ArrayList<>();
        for (CSVRecord record : parseCsv(path)) {
            if (!parseBoolean(value(record, "public_safe"), true)) {
                continue;
            }
            if (blank(value(record, "sample_ref"))) {
                continue;
            }

            EmployeeProfileSampleSeed seed = new EmployeeProfileSampleSeed();
            seed.sampleRef = value(record, "sample_ref");
            seed.currentCompany = value(record, "current_company");
            seed.matchedJobFamily = value(record, "matched_job_family");
            seed.education = value(record, "education");
            seed.major = value(record, "major");
            seed.experienceYears = firstPresentInteger(
                    value(record, "related_experience_years"),
                    value(record, "total_experience_years")
            );
            seed.techStack = splitList(value(record, "tech_stack"));
            seed.certifications = splitList(value(record, "certifications"));
            seed.languages = value(record, "languages");
            seed.githubPresent = parseBoolean(value(record, "github_present"), false);
            seed.portfolioPresent = parseBoolean(value(record, "portfolio_present"), false);
            seed.projectExperienceNotes = value(record, "project_experience_notes");
            seeds.add(seed);
        }
        return seeds;
    }

    private List<PatternProfileSeed> readPatternCsv(Path path) throws IOException {
        List<PatternProfileSeed> seeds = new ArrayList<>();
        for (CSVRecord record : parseCsv(path)) {
            if (!parseBoolean(value(record, "active"), true)) {
                continue;
            }
            if (blank(value(record, "pattern_ref")) || blank(value(record, "job_external_ref"))) {
                continue;
            }

            PatternProfileSeed seed = new PatternProfileSeed();
            seed.patternRef = value(record, "pattern_ref");
            seed.jobExternalRef = value(record, "job_external_ref");
            seed.employeeSampleRef = value(record, "employee_sample_ref");
            seed.patternTitle = value(record, "pattern_title");
            seed.jobFamily = value(record, "job_family");
            seed.coreSkills = splitList(value(record, "core_skills"));
            seed.preferredSkills = splitList(value(record, "preferred_skills"));
            seed.targetExperienceYears = parseInteger(value(record, "target_experience_years"));
            seed.languageBenchmark = normalizeLanguageBenchmark(value(record, "language_benchmark"));
            seed.educationBenchmark = value(record, "education_benchmark");
            seed.certifications = splitList(value(record, "certifications"));
            seed.githubExpected = parseBoolean(value(record, "github_expected"), false);
            seed.portfolioExpected = parseBoolean(value(record, "portfolio_expected"), false);
            seed.projectExperienceBenchmark = value(record, "project_experience_benchmark");
            seed.evidenceSummary = firstPresent(
                    value(record, "evidence_summary"),
                    value(record, "pattern_summary"),
                    seed.projectExperienceBenchmark
            );
            seeds.add(seed);
        }
        return seeds;
    }

    private List<PatternProfileSeed> readAcceptedCandidatePatternCsv(Path path) throws IOException {
        List<PatternProfileSeed> seeds = new ArrayList<>();
        for (CSVRecord record : parseCsv(path)) {
            PatternProfileSeed seed = new PatternProfileSeed();
            String acceptedPatternRef = value(record, "accepted_pattern_ref");
            if (blank(acceptedPatternRef) || blank(value(record, "job_external_ref"))) {
                continue;
            }
            seed.patternRef = acceptedPatternRef.replaceFirst("^ACP-", "PAT-");
            seed.jobExternalRef = value(record, "job_external_ref");
            seed.employeeSampleRef = firstListValue(value(record, "employee_sample_refs"));
            seed.patternTitle = value(record, "pattern_title");
            seed.jobFamily = value(record, "job_family");
            seed.coreSkills = splitList(value(record, "modeled_core_skills"));
            seed.preferredSkills = splitList(value(record, "modeled_preferred_skills"));
            seed.targetExperienceYears = parseInteger(value(record, "modeled_experience_years"));
            seed.languageBenchmark = normalizeLanguageBenchmark(value(record, "modeled_languages"));
            seed.educationBenchmark = value(record, "modeled_education");
            seed.certifications = splitList(value(record, "modeled_certifications"));
            seed.githubExpected = containsIgnoreCase(value(record, "modeled_portfolio_assets"), "github");
            seed.portfolioExpected = !blank(value(record, "modeled_portfolio_assets"));
            seed.projectExperienceBenchmark = value(record, "modeled_project_keywords");
            seed.evidenceSummary = firstPresent(
                    value(record, "derivation_reason"),
                    value(record, "fit_rationale"),
                    seed.projectExperienceBenchmark
            );
            seeds.add(seed);
        }
        return seeds;
    }

    private Iterable<CSVRecord> parseCsv(Path path) throws IOException {
        Reader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8);
        CSVParser parser = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build()
                .parse(reader);
        return parser.getRecords();
    }

    private Map<String, JobPosting> saveJobs(List<JobPostingSeed> seeds) {
        Map<String, JobPosting> jobsByRef = new HashMap<>();
        for (JobPostingSeed seed : seeds) {
            validateRef(seed.externalRef, "job external_ref");
            JobPosting job = jobPostingRepository.findByExternalRef(seed.externalRef).orElseGet(JobPosting::new);
            job.setExternalRef(seed.externalRef);
            job.setCompanyName(seed.companyName);
            job.setCountry(seed.country);
            job.setJobTitle(seed.jobTitle);
            job.setJobFamily(seed.jobFamily);
            job.setRequiredSkills(seed.requiredSkills);
            job.setPreferredSkills(seed.preferredSkills);
            job.setRequiredLanguages(seed.requiredLanguages);
            job.setMinExperienceYears(seed.minExperienceYears);
            job.setDegreeRequirement(seed.degreeRequirement);
            job.setPortfolioRequired(Boolean.TRUE.equals(seed.portfolioRequired));
            job.setVisaRequirement(seed.visaRequirement);
            job.setSalaryRange(seed.salaryRange);
            job.setWorkType(seed.workType);
            job.setApplicationDeadline(seed.applicationDeadline);
            job.setSalaryScore(seed.salaryScore);
            job.setWorkLifeBalanceScore(seed.workLifeBalanceScore);
            job.setCompanyValueScore(seed.companyValueScore);
            job.setProbabilityWeight(seed.probabilityWeight);
            job.setSalaryWeight(seed.salaryWeight);
            job.setWorkLifeBalanceWeight(seed.workLifeBalanceWeight);
            job.setCompanyValueWeight(seed.companyValueWeight);
            job.setJobFitWeight(seed.jobFitWeight);
            job.setEvaluationRationale(seed.evaluationRationale);
            jobsByRef.put(seed.externalRef, jobPostingRepository.save(job));
        }
        return jobsByRef;
    }

    private Map<String, EmployeeProfileSample> saveSamples(List<EmployeeProfileSampleSeed> seeds) {
        Map<String, EmployeeProfileSample> samplesByRef = new HashMap<>();
        for (EmployeeProfileSampleSeed seed : seeds) {
            validateRef(seed.sampleRef, "employee sample_ref");
            EmployeeProfileSample sample = employeeProfileSampleRepository.findBySampleRef(seed.sampleRef)
                    .orElseGet(EmployeeProfileSample::new);
            sample.setSampleRef(seed.sampleRef);
            sample.setCurrentCompany(seed.currentCompany);
            sample.setMatchedJobFamily(seed.matchedJobFamily);
            sample.setEducation(seed.education);
            sample.setMajor(seed.major);
            sample.setExperienceYears(seed.experienceYears);
            sample.setTechStack(seed.techStack);
            sample.setCertifications(seed.certifications);
            sample.setLanguages(seed.languages);
            sample.setGithubPresent(Boolean.TRUE.equals(seed.githubPresent));
            sample.setPortfolioPresent(Boolean.TRUE.equals(seed.portfolioPresent));
            sample.setProjectExperienceNotes(seed.projectExperienceNotes);
            samplesByRef.put(seed.sampleRef, employeeProfileSampleRepository.save(sample));
        }
        return samplesByRef;
    }

    private void savePatterns(
            List<PatternProfileSeed> seeds,
            Map<String, JobPosting> jobsByRef,
            Map<String, EmployeeProfileSample> samplesByRef
    ) {
        for (PatternProfileSeed seed : seeds) {
            validateRef(seed.patternRef, "pattern_ref");
            JobPosting job = jobsByRef.get(seed.jobExternalRef);
            if (job == null) {
                job = jobPostingRepository.findByExternalRef(seed.jobExternalRef).orElse(null);
            }
            if (job == null) {
                throw new IllegalStateException("Seed pattern references unknown job: " + seed.jobExternalRef);
            }

            EmployeeProfileSample sample = samplesByRef.get(seed.employeeSampleRef);
            if (sample == null && !blank(seed.employeeSampleRef)) {
                sample = employeeProfileSampleRepository.findBySampleRef(seed.employeeSampleRef).orElse(null);
            }

            PatternProfile pattern = patternProfileRepository.findByPatternRef(seed.patternRef).orElseGet(PatternProfile::new);
            pattern.setPatternRef(seed.patternRef);
            pattern.setJobPosting(job);
            pattern.setEmployeeProfileSample(sample);
            pattern.setPatternTitle(seed.patternTitle);
            pattern.setJobFamily(seed.jobFamily);
            pattern.setCoreSkills(seed.coreSkills);
            pattern.setPreferredSkills(seed.preferredSkills);
            pattern.setTargetExperienceYears(seed.targetExperienceYears);
            pattern.setLanguageBenchmark(seed.languageBenchmark);
            pattern.setEducationBenchmark(seed.educationBenchmark);
            pattern.setCertifications(seed.certifications);
            pattern.setGithubExpected(Boolean.TRUE.equals(seed.githubExpected));
            pattern.setPortfolioExpected(Boolean.TRUE.equals(seed.portfolioExpected));
            pattern.setProjectExperienceBenchmark(seed.projectExperienceBenchmark);
            pattern.setEvidenceSummary(firstPresent(seed.evidenceSummary, seed.projectExperienceBenchmark));
            patternProfileRepository.save(pattern);
        }
    }

    private String value(CSVRecord record, String name) {
        String resolvedName = name;
        if (!record.isMapped(resolvedName)) {
            String bomName = "\uFEFF" + name;
            if (!record.isMapped(bomName)) {
                for (Map.Entry<String, String> entry : record.toMap().entrySet()) {
                    if (normalizeHeader(entry.getKey()).equals(name)) {
                        String entryValue = entry.getValue();
                        return entryValue == null ? "" : entryValue.trim();
                    }
                }
                return "";
            }
            resolvedName = bomName;
        }
        String value = record.get(resolvedName);
        return value == null ? "" : value.trim();
    }

    private String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }
        return header.replace("\uFEFF", "")
                .replace("\"", "")
                .trim();
    }

    private List<String> splitList(String value) {
        Set<String> values = new LinkedHashSet<>();
        if (blank(value) || value.equalsIgnoreCase("Not specified")) {
            return new ArrayList<>();
        }
        String[] parts = value.split("\\|");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isBlank() && !trimmed.equalsIgnoreCase("Not specified")) {
                values.add(trimmed);
            }
        }
        return new ArrayList<>(values);
    }

    private Integer parseInteger(String value) {
        if (blank(value)) {
            return null;
        }
        Matcher matcher = INTEGER_PATTERN.matcher(value);
        return matcher.find() ? Integer.parseInt(matcher.group()) : null;
    }

    private LocalDate parseDate(String value) {
        if (blank(value) || value.equalsIgnoreCase("Not specified") || value.equalsIgnoreCase("Rolling")) {
            return null;
        }
        return LocalDate.parse(value.trim());
    }

    private Integer firstPresentInteger(String first, String second) {
        Integer firstValue = parseInteger(first);
        return firstValue == null ? parseInteger(second) : firstValue;
    }

    private String inferSalaryScore(String salaryRange) {
        if (blank(salaryRange) || salaryRange.equalsIgnoreCase("Not specified")) {
            return "55";
        }
        if (salaryRange.contains("250") || salaryRange.contains("253") || salaryRange.contains("300")) {
            return "92";
        }
        if (salaryRange.contains("190") || salaryRange.contains("199")) {
            return "82";
        }
        if (salaryRange.contains("160") || salaryRange.contains("168")) {
            return "74";
        }
        return "68";
    }

    private String inferWorkLifeBalanceScore(String workType) {
        if (blank(workType) || workType.equalsIgnoreCase("Not specified")) {
            return "60";
        }
        String lower = workType.toLowerCase();
        if (lower.contains("remote")) {
            return "88";
        }
        if (lower.contains("hybrid")) {
            return "78";
        }
        if (lower.contains("oncall")) {
            return "45";
        }
        return "62";
    }
    private boolean parseBoolean(String value, boolean defaultValue) {
        if (blank(value) || value.equalsIgnoreCase("Not specified")) {
            return defaultValue;
        }
        String normalized = value.trim().toLowerCase();
        return normalized.equals("true")
                || normalized.equals("yes")
                || normalized.equals("y")
                || normalized.equals("1")
                || normalized.equals("required");
    }

    private String normalizeLanguageBenchmark(String value) {
        if (blank(value)) {
            return "BASIC";
        }
        String normalized = value.toUpperCase();
        if (normalized.contains("NATIVE")) {
            return "NATIVE";
        }
        if (normalized.contains("FLUENT")) {
            return "FLUENT";
        }
        if (normalized.contains("BUSINESS")) {
            return "BUSINESS";
        }
        if (normalized.contains("CONVERSATIONAL")) {
            return "CONVERSATIONAL";
        }
        return "BASIC";
    }

    private String firstListValue(String value) {
        List<String> values = splitList(value);
        return values.isEmpty() ? "" : values.get(0);
    }

    private String firstPresent(String... values) {
        for (String value : values) {
            if (!blank(value)) {
                return value;
            }
        }
        return "";
    }

    private boolean containsIgnoreCase(String value, String target) {
        return value != null && value.toLowerCase().contains(target.toLowerCase());
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private void validateRef(String ref, String fieldName) {
        if (blank(ref)) {
            throw new IllegalStateException("Seed row has blank " + fieldName);
        }
    }

    public static class SeedPayload {
        public List<JobPostingSeed> jobPostings = new ArrayList<>();
        public List<EmployeeProfileSampleSeed> employeeProfileSamples = new ArrayList<>();
        public List<PatternProfileSeed> patternProfiles = new ArrayList<>();
    }

    public static class JobPostingSeed {
        public String externalRef;
        public String companyName;
        public String country;
        public String jobTitle;
        public String jobFamily;
        public List<String> requiredSkills = new ArrayList<>();
        public List<String> preferredSkills = new ArrayList<>();
        public List<String> requiredLanguages = new ArrayList<>();
        public Integer minExperienceYears;
        public String degreeRequirement;
        public Boolean portfolioRequired;
        public String visaRequirement;
        public String salaryRange;
        public String workType;
        public LocalDate applicationDeadline;
        public Integer salaryScore;
        public Integer workLifeBalanceScore;
        public Integer companyValueScore;
        public Integer probabilityWeight;
        public Integer salaryWeight;
        public Integer workLifeBalanceWeight;
        public Integer companyValueWeight;
        public Integer jobFitWeight;
        public String evaluationRationale;
    }

    public static class EmployeeProfileSampleSeed {
        public String sampleRef;
        public String currentCompany;
        public String matchedJobFamily;
        public String education;
        public String major;
        public Integer experienceYears;
        public List<String> techStack = new ArrayList<>();
        public List<String> certifications = new ArrayList<>();
        public String languages;
        public Boolean githubPresent;
        public Boolean portfolioPresent;
        public String projectExperienceNotes;
    }

    public static class PatternProfileSeed {
        public String patternRef;
        public String jobExternalRef;
        public String employeeSampleRef;
        public String patternTitle;
        public String jobFamily;
        public List<String> coreSkills = new ArrayList<>();
        public List<String> preferredSkills = new ArrayList<>();
        public Integer targetExperienceYears;
        public String languageBenchmark;
        public String educationBenchmark;
        public List<String> certifications = new ArrayList<>();
        public Boolean githubExpected;
        public Boolean portfolioExpected;
        public String projectExperienceBenchmark;
        public String evidenceSummary;
    }
}
