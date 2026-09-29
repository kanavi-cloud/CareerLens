package com.careerlens.backend.service;

import com.careerlens.backend.dto.ExternalJobImportRequestDto;
import com.careerlens.backend.dto.ExternalJobImportResponseDto;
import com.careerlens.backend.dto.ExternalJobPreviewDto;
import com.careerlens.backend.dto.JobPostingDto;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PatternProfile;
import com.careerlens.backend.repository.JobPostingRepository;
import com.careerlens.backend.repository.PatternProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.DecimalFormat;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GreenhouseJobProviderService {

    private static final Pattern BOARD_TOKEN_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{2,80}$");
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]+>");
    private static final Pattern SPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern EXPERIENCE_PATTERN = Pattern.compile("(\\d+)\\+?\\s*(?:years|yrs|year)", Pattern.CASE_INSENSITIVE);
    private static final Pattern SALARY_RANGE_PATTERN = Pattern.compile(
            "\\$\\s?[0-9][0-9,]*(?:\\.\\d+)?\\s*(?:k|K)?\\s*(?:-|–|—|to|~|and)\\s*(?:\\$\\s?)?[0-9][0-9,]*(?:\\.\\d+)?\\s*(?:k|K)?\\s*(?:USD|CAD|AUD|GBP|EUR)?",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern SALARY_BETWEEN_PATTERN = Pattern.compile(
            "between\\s+\\$\\s?[0-9][0-9,]*(?:\\.\\d+)?\\s*(?:k|K)?\\s+and\\s+\\$?\\s?[0-9][0-9,]*(?:\\.\\d+)?\\s*(?:k|K)?\\s*(?:USD|CAD|AUD|GBP|EUR)?",
            Pattern.CASE_INSENSITIVE
    );

    private static final String BROAD_CURRENCY_MARKER = "(?:\\$|\\x{00A3}|\\x{20B9}|\\x{00A5}|\\x{20AC}|USD|CAD|AUD|GBP|EUR|INR|JPY|KRW|SGD)";
    private static final String BROAD_SALARY_AMOUNT = "[0-9][0-9,]*(?:\\.\\d+)?\\s*(?:k|K|m|M|lakh|crore)?";
    private static final String BROAD_SALARY_SEPARATOR = "(?:-|\\x{2013}|\\x{2014}|to|~|and)";
    private static final Pattern BROAD_SALARY_RANGE_PATTERN = Pattern.compile(
            BROAD_CURRENCY_MARKER + "\\s*" + BROAD_SALARY_AMOUNT + "\\s*" + BROAD_SALARY_SEPARATOR
                    + "\\s*(?:" + BROAD_CURRENCY_MARKER + "\\s*)?" + BROAD_SALARY_AMOUNT + "\\s*(?:" + BROAD_CURRENCY_MARKER + ")?",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern BROAD_SALARY_TRAILING_CURRENCY_PATTERN = Pattern.compile(
            BROAD_SALARY_AMOUNT + "\\s*" + BROAD_SALARY_SEPARATOR + "\\s*" + BROAD_SALARY_AMOUNT + "\\s*" + BROAD_CURRENCY_MARKER,
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern BROAD_SALARY_BETWEEN_PATTERN = Pattern.compile(
            "between\\s+" + BROAD_CURRENCY_MARKER + "\\s*" + BROAD_SALARY_AMOUNT
                    + "\\s+and\\s+(?:" + BROAD_CURRENCY_MARKER + "\\s*)?" + BROAD_SALARY_AMOUNT
                    + "\\s*(?:" + BROAD_CURRENCY_MARKER + ")?",
            Pattern.CASE_INSENSITIVE
    );
    private static final String SALARY_CODE = "(USD|CAD|AUD|GBP|EUR|INR|JPY|KRW|SGD)";
    private static final String SALARY_AMOUNT = "([0-9][0-9,]*(?:\\.\\d+)?\\s*(?:k|K|m|M|lakh|crore)?)";
    private static final Pattern NORMALIZED_SALARY_BETWEEN_PATTERN = Pattern.compile(
            "between\\s+(?:" + SALARY_CODE + "\\s*)?" + SALARY_AMOUNT
                    + "\\s+and\\s+(?:" + SALARY_CODE + "\\s*)?" + SALARY_AMOUNT
                    + "\\s*(?:" + SALARY_CODE + ")?",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern NORMALIZED_SALARY_RANGE_PATTERN = Pattern.compile(
            "(?:" + SALARY_CODE + "\\s*)?" + SALARY_AMOUNT
                    + "\\s*(?:-|to|~|and)\\s*(?:" + SALARY_CODE + "\\s*)?" + SALARY_AMOUNT
                    + "\\s*(?:" + SALARY_CODE + ")?",
            Pattern.CASE_INSENSITIVE
    );
    private static final String SALARY_FORMAT_PATTERN = "#,###.##";

    private final ObjectMapper objectMapper;
    private final JobPostingRepository jobPostingRepository;
    private final PatternProfileRepository patternProfileRepository;
    private final JobPostingService jobPostingService;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String baseUrl;
    private final int timeoutSeconds;

    public GreenhouseJobProviderService(
            ObjectMapper objectMapper,
            JobPostingRepository jobPostingRepository,
            PatternProfileRepository patternProfileRepository,
            JobPostingService jobPostingService,
            @Value("${app.external-jobs.greenhouse.enabled:true}") boolean enabled,
            @Value("${app.external-jobs.greenhouse.base-url:https://boards-api.greenhouse.io}") String baseUrl,
            @Value("${app.external-jobs.greenhouse.timeout-seconds:12}") int timeoutSeconds
    ) {
        this.objectMapper = objectMapper;
        this.jobPostingRepository = jobPostingRepository;
        this.patternProfileRepository = patternProfileRepository;
        this.jobPostingService = jobPostingService;
        this.enabled = enabled;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.timeoutSeconds = timeoutSeconds;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(Math.max(3, timeoutSeconds)))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ExternalJobPreviewDto> preview(String boardToken, String defaultCountry, String defaultJobFamily, Integer limit) {
        List<ExternalJobPreviewDto> previews = fetchPreviews(boardToken, defaultCountry, defaultJobFamily, limit);
        List<ExternalJobPreviewDto> marked = new ArrayList<>();
        for (ExternalJobPreviewDto preview : previews) {
            marked.add(withImportedFlag(preview, jobPostingRepository.findByExternalRef(preview.externalRef()).isPresent()));
        }
        return marked;
    }

    @Transactional
    public ExternalJobImportResponseDto importJobs(ExternalJobImportRequestDto request) {
        boolean createPatterns = request.createPatternProfile() == null || request.createPatternProfile();
        boolean importNew = request.importNew() == null || request.importNew();
        Set<String> selectedRefs = request.selectedExternalRefs() == null
                ? new HashSet<>()
                : new HashSet<>(request.selectedExternalRefs());
        List<ExternalJobPreviewDto> previews = fetchPreviews(
                request.boardToken(),
                request.defaultCountry(),
                request.defaultJobFamily(),
                request.limit()
        );

        int imported = 0;
        int updated = 0;
        List<JobPostingDto> savedJobs = new ArrayList<>();
        for (ExternalJobPreviewDto preview : previews) {
            if (!selectedRefs.isEmpty() && !selectedRefs.contains(preview.externalRef())) {
                continue;
            }
            boolean exists = jobPostingRepository.findByExternalRef(preview.externalRef()).isPresent();
            if (!exists && !importNew) {
                continue;
            }
            JobPosting job = jobPostingRepository.findByExternalRef(preview.externalRef()).orElseGet(JobPosting::new);
            applyPreview(job, preview, request);
            JobPosting saved = jobPostingRepository.save(job);
            if (createPatterns) {
                upsertImportedPattern(saved, preview);
            }
            savedJobs.add(jobPostingService.toDto(saved));
            if (exists) {
                updated++;
            } else {
                imported++;
            }
        }

        return new ExternalJobImportResponseDto(
                "greenhouse",
                normalizeBoardToken(request.boardToken()),
                previews.size(),
                imported,
                updated,
                savedJobs
        );
    }

    private List<ExternalJobPreviewDto> fetchPreviews(String rawBoardToken, String defaultCountry, String defaultJobFamily, Integer limit) {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Greenhouse provider is disabled.");
        }

        String boardToken = normalizeBoardToken(rawBoardToken);
        String companyName = fetchBoardName(boardToken);
        JsonNode root = requestJson(boardToken, "/v1/boards/" + boardToken + "/jobs?content=true");
        JsonNode jobs = root.path("jobs");
        if (!jobs.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Greenhouse jobs response does not contain a jobs array.");
        }

        int max = limit == null || limit <= 0 ? 20 : Math.min(limit, 50);
        List<ExternalJobPreviewDto> previews = new ArrayList<>();
        for (JsonNode job : jobs) {
            if (previews.size() >= max) {
                break;
            }
            ExternalJobPreviewDto preview = toPreview(boardToken, companyName, job, defaultCountry, defaultJobFamily);
            if (preview != null) {
                previews.add(preview);
            }
        }
        return previews;
    }

    private String fetchBoardName(String boardToken) {
        try {
            JsonNode root = requestJson(boardToken, "/v1/boards/" + boardToken);
            String name = text(root.path("name"));
            return name.isBlank() ? humanizeBoardToken(boardToken) : name;
        } catch (ResponseStatusException exception) {
            return humanizeBoardToken(boardToken);
        }
    }

    private JsonNode requestJson(String boardToken, String path) {
        String uri = baseUrl + path;
        HttpRequest request = HttpRequest.newBuilder(URI.create(uri))
                .timeout(Duration.ofSeconds(Math.max(3, timeoutSeconds)))
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Greenhouse board token not found: " + boardToken);
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Greenhouse API returned status " + response.statusCode());
            }
            return objectMapper.readTree(response.body());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse Greenhouse API response.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Greenhouse API request was interrupted.");
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Greenhouse API request path.");
        }
    }

    private ExternalJobPreviewDto toPreview(String boardToken, String companyName, JsonNode job, String defaultCountry, String defaultJobFamily) {
        String jobId = text(job.path("id"));
        String title = text(job.path("title"));
        String content = stripHtml(text(job.path("content")));
        String location = locationFor(job);
        String department = departmentFor(job);
        String sourceUrl = text(job.path("absolute_url"));
        String effectiveCompanyName = valueOrDefault(text(job.path("company_name")), companyName);
        String textForAnalysis = (title + " " + content + " " + location).toLowerCase(Locale.ROOT);
        String classificationText = (title + " " + department).toLowerCase(Locale.ROOT);
        String country = valueOrDefault(inferCountry(location), "Not specified");
        if (isExcludedNonEngineeringPosting(classificationText)) {
            return null;
        }
        String inferredJobFamily = inferJobFamily(classificationText);
        if (inferredJobFamily.isBlank() && isRelevantEngineeringPosting(classificationText)) {
            inferredJobFamily = "Backend";
        }
        if (inferredJobFamily.isBlank()) {
            return null;
        }
        String jobFamily = inferredJobFamily;
        if (!matchesFilter(country, defaultCountry) || !matchesFilter(jobFamily, defaultJobFamily)) {
            return null;
        }
        List<String> requiredSkills = extractSkills(textForAnalysis, jobFamily, true);
        List<String> preferredSkills = extractSkills(textForAnalysis, jobFamily, false);
        List<String> languages = extractLanguages(textForAnalysis, country);

        return new ExternalJobPreviewDto(
                "greenhouse",
                boardToken,
                "greenhouse:" + boardToken + ":" + jobId,
                effectiveCompanyName,
                country,
                title,
                jobFamily,
                location,
                sourceUrl,
                requiredSkills,
                preferredSkills,
                languages,
                inferExperienceYears(textForAnalysis),
                inferDegree(textForAnalysis),
                textForAnalysis.contains("portfolio"),
                inferVisaRequirement(textForAnalysis),
                inferSalaryRange(job, content, country),
                inferWorkType(textForAnalysis),
                summarize(content, title),
                false
        );
    }

    private void applyPreview(JobPosting job, ExternalJobPreviewDto preview, ExternalJobImportRequestDto request) {
        job.setExternalRef(preview.externalRef());
        job.setCompanyName(preview.companyName());
        job.setCountry(preview.country());
        job.setJobTitle(preview.jobTitle());
        job.setJobFamily(preview.jobFamily());
        job.setRequiredSkills(preview.requiredSkills());
        job.setPreferredSkills(preview.preferredSkills());
        job.setRequiredLanguages(preview.requiredLanguages());
        job.setMinExperienceYears(preview.minExperienceYears());
        job.setDegreeRequirement(preview.degreeRequirement());
        job.setPortfolioRequired(preview.portfolioRequired());
        job.setVisaRequirement(preview.visaRequirement());
        job.setSalaryRange(preview.salaryRange());
        job.setWorkType(preview.workType());
        job.setApplicationDeadline(request.defaultDeadline());
        job.setSalaryScore(scoreSalary(preview));
        job.setWorkLifeBalanceScore(scoreWorkLife(preview));
        job.setCompanyValueScore(null);
        job.setProbabilityWeight(30);
        job.setSalaryWeight(15);
        job.setWorkLifeBalanceWeight(15);
        job.setCompanyValueWeight(15);
        job.setJobFitWeight(25);
        job.setEvaluationRationale(buildCandidateFacingSummary(preview));
    }

    private void upsertImportedPattern(JobPosting job, ExternalJobPreviewDto preview) {
        String patternRef = "greenhouse-pattern:" + preview.boardToken() + ":" + job.getId();
        PatternProfile pattern = patternProfileRepository.findByPatternRef(patternRef).orElseGet(PatternProfile::new);
        pattern.setPatternRef(patternRef);
        pattern.setJobPosting(job);
        pattern.setPatternTitle(preview.companyName() + " " + preview.jobFamily() + " 공개 공고 기반 기본 패턴");
        pattern.setJobFamily(preview.jobFamily());
        pattern.setTargetExperienceYears(preview.minExperienceYears() == null ? 2 : preview.minExperienceYears());
        pattern.setLanguageBenchmark(languageBenchmark(preview.requiredLanguages()));
        pattern.setEducationBenchmark(preview.degreeRequirement());
        pattern.setGithubExpected(true);
        pattern.setPortfolioExpected(preview.portfolioRequired());
        pattern.setProjectExperienceBenchmark(projectBenchmark(preview));
        pattern.setEvidenceSummary(preview.companyName() + " " + preview.jobTitle()
                + " 공고의 직무명, 위치, 요구 기술 키워드를 바탕으로 만든 기본 직무 패턴입니다. 직원 표본과 가상 합격자 패턴이 보강되면 추천 근거가 더 정밀해집니다.");
        pattern.setCoreSkills(preview.requiredSkills());
        pattern.setPreferredSkills(preview.preferredSkills());
        pattern.setCertifications(new ArrayList<>());
        patternProfileRepository.save(pattern);
    }

    private ExternalJobPreviewDto withImportedFlag(ExternalJobPreviewDto preview, boolean imported) {
        return new ExternalJobPreviewDto(
                preview.provider(),
                preview.boardToken(),
                preview.externalRef(),
                preview.companyName(),
                preview.country(),
                preview.jobTitle(),
                preview.jobFamily(),
                preview.location(),
                preview.sourceUrl(),
                new ArrayList<>(preview.requiredSkills()),
                new ArrayList<>(preview.preferredSkills()),
                new ArrayList<>(preview.requiredLanguages()),
                preview.minExperienceYears(),
                preview.degreeRequirement(),
                preview.portfolioRequired(),
                preview.visaRequirement(),
                preview.salaryRange(),
                preview.workType(),
                preview.contentSummary(),
                imported
        );
    }

    private String normalizeBoardToken(String rawBoardToken) {
        String boardToken = rawBoardToken == null ? "" : rawBoardToken.trim();
        if (!BOARD_TOKEN_PATTERN.matcher(boardToken).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Greenhouse board token must contain only letters, numbers, underscore, or hyphen.");
        }
        return boardToken;
    }

    private String locationFor(JsonNode job) {
        String location = text(job.path("location").path("name"));
        if (!location.isBlank()) {
            return location;
        }
        JsonNode offices = job.path("offices");
        if (offices.isArray()) {
            for (JsonNode office : offices) {
                String officeLocation = text(office.path("location"));
                if (!officeLocation.isBlank()) {
                    return officeLocation;
                }
                String officeName = text(office.path("name"));
                if (!officeName.isBlank()) {
                    return officeName;
                }
            }
        }
        return "Remote / Not specified";
    }

    private String departmentFor(JsonNode job) {
        JsonNode departments = job.path("departments");
        if (!departments.isArray()) {
            return "";
        }
        List<String> names = new ArrayList<>();
        for (JsonNode department : departments) {
            String name = text(department.path("name"));
            if (!name.isBlank()) {
                names.add(name);
            }
        }
        return String.join(" ", names);
    }

    private List<String> extractSkills(String text, String jobFamily, boolean core) {
        List<String> candidates = new ArrayList<>();
        addSkillCandidates(candidates);
        Set<String> found = new LinkedHashSet<>();
        for (String skill : candidates) {
            if (text.contains(skill.toLowerCase(Locale.ROOT))) {
                found.add(skill);
            }
        }
        if (found.isEmpty()) {
            if ("Frontend".equalsIgnoreCase(jobFamily)) {
                found.add("TypeScript");
                found.add("React");
                found.add("Next.js");
            } else if ("AI/ML".equalsIgnoreCase(jobFamily)) {
                found.add("Python");
                found.add("Machine Learning");
                found.add("PyTorch");
            } else if ("Data".equalsIgnoreCase(jobFamily)) {
                found.add("Python");
                found.add("SQL");
                found.add("Data Pipeline");
            } else {
                found.add("Java");
                found.add("Spring Boot");
                found.add("API");
            }
        }

        List<String> values = new ArrayList<>(found);
        int fromIndex = core ? 0 : Math.min(4, values.size());
        int toIndex = core ? Math.min(5, values.size()) : Math.min(values.size(), fromIndex + 5);
        if (fromIndex >= toIndex) {
            return new ArrayList<>();
        }
        return new ArrayList<>(values.subList(fromIndex, toIndex));
    }

    private void addSkillCandidates(List<String> candidates) {
        candidates.add("Java");
        candidates.add("Spring Boot");
        candidates.add("JVM");
        candidates.add("Kotlin");
        candidates.add("Android");
        candidates.add("iOS");
        candidates.add("Swift");
        candidates.add("Objective-C");
        candidates.add("Python");
        candidates.add("Go");
        candidates.add("Ruby");
        candidates.add("Rails");
        candidates.add("Node.js");
        candidates.add("TypeScript");
        candidates.add("JavaScript");
        candidates.add("React");
        candidates.add("Next.js");
        candidates.add("Vue");
        candidates.add("Redux");
        candidates.add("HTML");
        candidates.add("CSS");
        candidates.add("AWS");
        candidates.add("GCP");
        candidates.add("Azure");
        candidates.add("Docker");
        candidates.add("Kubernetes");
        candidates.add("MySQL");
        candidates.add("PostgreSQL");
        candidates.add("Redis");
        candidates.add("DynamoDB");
        candidates.add("MongoDB");
        candidates.add("Elasticsearch");
        candidates.add("GraphQL");
        candidates.add("REST API");
        candidates.add("API");
        candidates.add("Distributed Systems");
        candidates.add("Microservices");
        candidates.add("System Design");
        candidates.add("Machine Learning");
        candidates.add("PyTorch");
        candidates.add("TensorFlow");
        candidates.add("LLM");
        candidates.add("MLOps");
        candidates.add("NLP");
        candidates.add("Computer Vision");
        candidates.add("Vector DB");
        candidates.add("SQL");
        candidates.add("Spark");
        candidates.add("Airflow");
        candidates.add("dbt");
        candidates.add("BigQuery");
        candidates.add("Snowflake");
        candidates.add("Kafka");
        candidates.add("Flink");
        candidates.add("Data Pipeline");
        candidates.add("CI/CD");
        candidates.add("Terraform");
        candidates.add("Observability");
        candidates.add("Monitoring");
        candidates.add("Testing");
    }

    private List<String> extractLanguages(String text, String country) {
        Set<String> languages = new LinkedHashSet<>();
        if (text.contains("japanese") || "Japan".equalsIgnoreCase(country)) {
            languages.add("Japanese Business");
        }
        if (text.contains("english") || languages.isEmpty()) {
            languages.add("English Business");
        }
        return new ArrayList<>(languages);
    }

    private Integer inferExperienceYears(String text) {
        Matcher matcher = EXPERIENCE_PATTERN.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        if (text.contains("principal") || text.contains("staff")) {
            return 7;
        }
        if (text.contains("senior")) {
            return 5;
        }
        if (text.contains("junior") || text.contains("entry")) {
            return 1;
        }
        return 2;
    }

    private String inferCountry(String location) {
        String normalized = location.toLowerCase(Locale.ROOT);
        if (normalized.contains("south korea") || normalized.contains("korea") || normalized.contains("seoul")) {
            return "South Korea";
        }
        if (normalized.contains("singapore")) {
            return "Singapore";
        }
        if (normalized.contains("brazil") || normalized.contains("são paulo") || normalized.contains("sao paulo")) {
            return "Brazil";
        }
        if (normalized.contains("india") || normalized.contains("bangalore") || normalized.contains("bengaluru")
                || normalized.contains("gurugram") || normalized.contains("hyderabad")) {
            return "India";
        }
        if (normalized.contains("china") || normalized.contains("beijing") || normalized.contains("shanghai")) {
            return "China";
        }
        if (normalized.contains("germany") || normalized.contains("berlin") || normalized.contains("munich")) {
            return "Germany";
        }
        if (normalized.contains("france") || normalized.contains("paris")) {
            return "France";
        }
        if (normalized.contains("spain") || normalized.contains("barcelona") || normalized.contains("madrid")) {
            return "Spain";
        }
        if (normalized.contains("ireland") || normalized.contains("dublin")) {
            return "Ireland";
        }
        if (normalized.contains("netherlands") || normalized.contains("amsterdam")) {
            return "Netherlands";
        }
        if (normalized.contains("italy") || normalized.contains("milan")) {
            return "Italy";
        }
        if (normalized.contains("united kingdom") || normalized.contains("uk") || normalized.contains("london")) {
            return "United Kingdom";
        }
        if (normalized.contains("canada") || normalized.contains("toronto") || normalized.contains("vancouver")) {
            return "Canada";
        }
        if (normalized.contains("australia") || normalized.contains("sydney") || normalized.contains("melbourne")) {
            return "Australia";
        }
        if (normalized.contains("japan") || normalized.contains("tokyo") || normalized.contains("osaka")) {
            return "Japan";
        }
        if (normalized.contains("united states") || normalized.contains("usa") || normalized.contains("new york")
                || normalized.contains("san francisco") || normalized.contains("seattle") || normalized.contains("california")) {
            return "United States";
        }
        return "";
    }

    private String inferJobFamily(String text) {
        if (text.contains("machine learning") || text.contains(" ai ") || text.contains("artificial intelligence")
                || text.contains("ml engineer") || text.contains("llm") || text.contains("deep learning")
                || text.contains("pytorch") || text.contains("tensorflow") || text.contains("model training")) {
            return "AI/ML";
        }
        if (text.contains("data engineer") || text.contains("analytics engineer") || text.contains("data platform")
                || text.contains("warehouse") || text.contains("etl") || text.contains("spark")) {
            return "Data";
        }
        if (text.contains("frontend") || text.contains("front-end") || text.contains("react") || text.contains("ui engineer")) {
            return "Frontend";
        }
        if (text.contains("backend") || text.contains("back-end") || text.contains("platform") || text.contains("infrastructure")
                || text.contains("distributed systems") || text.contains("api")) {
            return "Backend";
        }
        return "";
    }

    private boolean isRelevantEngineeringPosting(String text) {
        return text.contains("software engineer")
                || text.contains("software engineering")
                || text.contains("backend engineer")
                || text.contains("frontend engineer")
                || text.contains("full stack engineer")
                || text.contains("platform engineer")
                || text.contains("infrastructure engineer")
                || text.contains("data engineer")
                || text.contains("machine learning engineer")
                || text.contains("ml engineer")
                || text.contains("developer")
                || text.contains("swe")
                || text.contains("backend")
                || text.contains("frontend")
                || text.contains("full stack")
                || text.contains("platform")
                || text.contains("infrastructure");
    }

    private boolean isExcludedNonEngineeringPosting(String text) {
        return text.contains("policy")
                || text.contains("business operations")
                || text.contains("operations lead")
                || text.contains("strategic finance")
                || text.contains("finance")
                || text.contains("legal")
                || text.contains("recruit")
                || text.contains("talent")
                || text.contains("marketing")
                || text.contains("sales")
                || text.contains("product manager")
                || text.contains("program manager")
                || text.contains("community support")
                || text.contains("customer support")
                || text.contains("trust & safety");
    }

    private String inferDegree(String text) {
        if (text.contains("bachelor") || text.contains("bs degree") || text.contains("computer science")) {
            return "Bachelor preferred";
        }
        if (text.contains("master")) {
            return "Master preferred";
        }
        return "Degree not explicitly required";
    }

    private String inferVisaRequirement(String text) {
        String normalized = text == null ? "" : text.toLowerCase(Locale.ROOT);
        if (containsAny(normalized,
                "without sponsorship",
                "do not sponsor",
                "does not sponsor",
                "unable to sponsor",
                "cannot sponsor",
                "not sponsor",
                "no visa sponsorship",
                "not eligible for sponsorship",
                "must be authorized to work",
                "must have work authorization")) {
            return "Work authorization required / sponsorship not indicated";
        }
        if (containsAny(normalized,
                "visa sponsorship is available",
                "sponsorship available",
                "will sponsor",
                "eligible for visa sponsorship",
                "visa sponsorship provided",
                "relocation and visa")) {
            return "Visa sponsorship mentioned";
        }
        if (normalized.contains("visa sponsorship") || normalized.contains("sponsorship")) {
            return "Sponsorship mentioned - verify details";
        }
        if (normalized.contains("work authorization") || normalized.contains("right to work")) {
            return "Work authorization mentioned";
        }
        return "Not specified in public posting";
    }

    private String inferSalaryRange(JsonNode job, String content, String country) {
        String metadataSalary = salaryFromMetadata(job.path("metadata"), country);
        if (!metadataSalary.isBlank()) {
            return metadataSalary;
        }

        String normalized = normalizeSalarySearchText(content);
        String compensationSection = sectionAfter(normalized, "Compensation", 2200);
        String matched = firstSalaryMatch(compensationSection);
        if (!matched.isBlank()) {
            return matched;
        }
        matched = firstSalaryMatch(normalized);
        return matched.isBlank() ? "Not disclosed" : matched;
    }

    private String salaryFromMetadata(JsonNode metadata, String country) {
        if (!metadata.isArray()) {
            return "";
        }
        String preferredCurrency = preferredCurrency(country);
        String fallback = "";
        for (JsonNode item : metadata) {
            String valueType = text(item.path("value_type"));
            JsonNode value = item.path("value");
            if (!"currency_range".equalsIgnoreCase(valueType) || !value.isObject()) {
                continue;
            }
            String unit = text(value.path("unit"));
            String min = text(value.path("min_value"));
            String max = text(value.path("max_value"));
            if (unit.isBlank() || isZeroAmount(min) || isZeroAmount(max)) {
                continue;
            }
            String candidate = unit.toUpperCase(Locale.ROOT) + " " + formatSalaryAmount(min)
                    + " - " + formatSalaryAmount(max);
            if (unit.equalsIgnoreCase(preferredCurrency)) {
                return candidate;
            }
            if (fallback.isBlank()) {
                fallback = candidate;
            }
        }
        return fallback;
    }

    private String preferredCurrency(String country) {
        if ("United Kingdom".equalsIgnoreCase(country)) return "GBP";
        if ("Canada".equalsIgnoreCase(country)) return "CAD";
        if ("Australia".equalsIgnoreCase(country)) return "AUD";
        if ("India".equalsIgnoreCase(country)) return "INR";
        if ("Japan".equalsIgnoreCase(country)) return "JPY";
        if ("South Korea".equalsIgnoreCase(country)) return "KRW";
        if ("Singapore".equalsIgnoreCase(country)) return "SGD";
        if ("Germany".equalsIgnoreCase(country) || "France".equalsIgnoreCase(country)
                || "Spain".equalsIgnoreCase(country) || "Ireland".equalsIgnoreCase(country)
                || "Netherlands".equalsIgnoreCase(country) || "Italy".equalsIgnoreCase(country)) {
            return "EUR";
        }
        return "USD";
    }

    private boolean isZeroAmount(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        try {
            return Double.parseDouble(value.replace(",", "")) <= 0;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private String formatSalaryAmount(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        try {
            return new DecimalFormat(SALARY_FORMAT_PATTERN).format(Double.parseDouble(value.replace(",", "")));
        } catch (NumberFormatException exception) {
            return value.trim();
        }
    }

    private String firstSalaryMatch(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        Matcher betweenMatcher = NORMALIZED_SALARY_BETWEEN_PATTERN.matcher(text);
        while (betweenMatcher.find()) {
            String salary = canonicalSalaryRange(betweenMatcher);
            if (!salary.isBlank()) {
                return salary;
            }
        }
        Matcher rangeMatcher = NORMALIZED_SALARY_RANGE_PATTERN.matcher(text);
        while (rangeMatcher.find()) {
            String salary = canonicalSalaryRange(rangeMatcher);
            if (!salary.isBlank()) {
                return salary;
            }
        }
        return "";
    }

    private String canonicalSalaryRange(Matcher matcher) {
        String currency = firstNonBlank(matcher.group(1), matcher.group(3), matcher.group(5));
        if (currency.isBlank()) {
            return "";
        }
        return currency.toUpperCase(Locale.ROOT) + " "
                + cleanSalaryAmount(matcher.group(2)) + " - " + cleanSalaryAmount(matcher.group(4));
    }

    private String cleanSalaryAmount(String amount) {
        return SPACE_PATTERN.matcher(amount == null ? "" : amount.trim()).replaceAll(" ");
    }

    private String normalizeSalarySearchText(String value) {
        String normalized = htmlUnescapeRepeated(value == null ? "" : value);
        normalized = normalized.replace("&mdash;", "-")
                .replace("&ndash;", "-")
                .replace(String.valueOf((char) 0x2013), "-")
                .replace(String.valueOf((char) 0x2014), "-")
                .replace(String.valueOf((char) 0x00A3), " GBP ")
                .replace(String.valueOf(Character.toChars(0x20B9)), " INR ")
                .replace(String.valueOf((char) 0x00A5), " JPY ")
                .replace(String.valueOf(Character.toChars(0x20AC)), " EUR ")
                .replace("$", " USD ");
        return SPACE_PATTERN.matcher(normalized).replaceAll(" ").trim();
    }

    private String normalizeSalaryRange(String value) {
        if (value == null || value.isBlank()) {
            return "Not disclosed";
        }
        String safeNormalized = normalizeSalaryRangeSafely(value);
        if (!safeNormalized.isBlank()) {
            return safeNormalized;
        }
        String normalized = SPACE_PATTERN.matcher(value == null ? "" : value).replaceAll(" ").trim();
        normalized = normalized.replace("between ", "")
                .replace("Between ", "")
                .replaceAll("\\s+and\\s+", " - ")
                .replaceAll("\\s*(?:–|—|~|to)\\s*", " - ")
                .replaceAll("\\s*-\\s*", " - ")
                .replaceAll("\\s+", " ");
        return normalized.isBlank() ? "Not disclosed" : normalized;
    }

    private String normalizeSalaryRangeSafely(String value) {
        String normalized = SPACE_PATTERN.matcher(value == null ? "" : value).replaceAll(" ").trim();
        normalized = normalized.replace("between ", "")
                .replace("Between ", "")
                .replaceAll("\\s+and\\s+", " - ")
                .replaceAll("\\s*(?:" + BROAD_SALARY_SEPARATOR + ")\\s*", " - ")
                .replaceAll("\\s*-\\s*", " - ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized;
    }

    private String sectionAfter(String content, String marker, int maxLength) {
        if (content == null || content.isBlank()) {
            return "";
        }
        int index = content.toLowerCase(Locale.ROOT).indexOf(marker.toLowerCase(Locale.ROOT));
        if (index < 0) {
            return "";
        }
        int end = Math.min(content.length(), index + Math.max(marker.length(), maxLength));
        return content.substring(index, end);
    }

    private String inferWorkType(String text) {
        if (text.contains("remote")) {
            return "Remote";
        }
        if (text.contains("hybrid")) {
            return "Hybrid";
        }
        return "On-site / Not specified";
    }

    private Integer scoreSalary(ExternalJobPreviewDto preview) {
        String salaryRange = preview.salaryRange();
        if (salaryRange != null && !salaryRange.equals("Not disclosed")) {
            return scoreSalaryFromRange(salaryRange);
        }
        return null;
    }

    private int scoreSalaryFromRange(String salaryRange) {
        Matcher matcher = Pattern.compile("[0-9][0-9,]*(?:\\.\\d+)?").matcher(salaryRange == null ? "" : salaryRange);
        List<Double> values = new ArrayList<>();
        double currencyFactor = salaryCurrencyFactor(salaryRange);
        while (matcher.find()) {
            String raw = matcher.group().replace(",", "");
            try {
                double parsed = Double.parseDouble(raw);
                if (salaryRange.toLowerCase(Locale.ROOT).contains("k") && parsed < 1000) {
                    parsed *= 1000;
                }
                parsed *= currencyFactor;
                values.add(parsed);
            } catch (NumberFormatException ignored) {
                // Ignore malformed numeric salary fragments.
            }
        }
        if (values.isEmpty()) {
            return 70;
        }
        double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        if (max >= 220000) return 92;
        if (max >= 180000) return 86;
        if (max >= 140000) return 78;
        if (max >= 100000) return 70;
        if (max >= 70000) return 62;
        return 55;
    }

    private double salaryCurrencyFactor(String salaryRange) {
        String normalized = salaryRange == null ? "" : salaryRange.toUpperCase(Locale.ROOT);
        if (normalized.contains("GBP") || containsCodePoint(salaryRange, 0x00A3)) return 1.25;
        if (normalized.contains("EUR") || containsCodePoint(salaryRange, 0x20AC)) return 1.08;
        if (normalized.contains("CAD")) return 0.73;
        if (normalized.contains("AUD")) return 0.66;
        if (normalized.contains("SGD")) return 0.74;
        if (normalized.contains("INR") || containsCodePoint(salaryRange, 0x20B9)) return 0.012;
        if (normalized.contains("JPY") || containsCodePoint(salaryRange, 0x00A5)) return 0.0067;
        if (normalized.contains("KRW")) return 0.00075;
        return 1.0;
    }

    private boolean containsCodePoint(String value, int codePoint) {
        return value != null && value.codePoints().anyMatch(current -> current == codePoint);
    }

    private Integer scoreWorkLife(ExternalJobPreviewDto preview) {
        String workType = preview.workType();
        if (workType != null && workType.contains("Remote")) {
            return 78;
        }
        if (workType != null && workType.contains("Hybrid")) {
            return 72;
        }
        return null;
    }

    private String buildCandidateFacingSummary(ExternalJobPreviewDto preview) {
        String skills = firstSkills(preview.requiredSkills());
        String companyIntro = companyIntro(preview.companyName());
        return companyIntro + " " + preview.jobTitle() + " 포지션은 " + preview.country()
                + " 기준 " + preview.jobFamily() + " 직무로 분류되며, 핵심 확인 역량은 " + skills
                + "입니다. 공고 원문에서 세부 자격요건과 근무 조건을 함께 확인하는 것을 권장합니다.";
    }

    private String companyIntro(String companyName) {
        String normalizedCompanyName = valueOrDefault(companyName, "해당 기업");
        if ("Airbnb".equals(normalizedCompanyName)) {
            return "Airbnb는 전 세계 숙박과 여행 경험을 연결하는 글로벌 플랫폼 기업입니다.";
        }
        if ("DoorDash".equals(normalizedCompanyName)) {
            return "DoorDash는 지역 상거래와 물류 경험을 연결하는 온디맨드 플랫폼 기업입니다.";
        }
        if ("Reddit".equals(normalizedCompanyName)) {
            return "Reddit은 커뮤니티 기반 대화와 콘텐츠를 운영하는 글로벌 플랫폼 기업입니다.";
        }
        if ("Stripe".equals(normalizedCompanyName)) {
            return "Stripe는 온라인 결제와 금융 인프라를 제공하는 글로벌 핀테크 기업입니다.";
        }
        return normalizedCompanyName + "는 글로벌 채용 공고를 공개하고 있는 기술 중심 기업입니다.";
    }

    private String firstSkills(List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return "공고 본문에서 확인되는 직무 역량";
        }
        List<String> firstSkills = new ArrayList<>();
        for (String skill : skills) {
            if (firstSkills.size() >= 4) {
                break;
            }
            firstSkills.add(skill);
        }
        return String.join(", ", firstSkills);
    }

    private String languageBenchmark(List<String> languages) {
        if (languages == null || languages.isEmpty()) {
            return "English Business";
        }
        return String.join(", ", languages);
    }

    private String projectBenchmark(ExternalJobPreviewDto preview) {
        return preview.jobFamily() + " 직무 공고의 핵심 기술을 사용한 실무형 프로젝트 1개 이상, README와 API/화면 설계 근거 제출";
    }

    private String summarize(String content, String title) {
        String normalized = SPACE_PATTERN.matcher(content == null ? "" : content.trim()).replaceAll(" ");
        normalized = removeRepeatedCompanyIntro(normalized);
        normalized = prioritizeRoleSection(normalized);
        if (normalized.isBlank()) {
            normalized = valueOrDefault(title, "Greenhouse public job posting");
        }
        if (normalized.length() <= 260) {
            return normalized;
        }
        return normalized.substring(0, 260) + "...";
    }

    private String removeRepeatedCompanyIntro(String content) {
        String marker = "Every day, hosts offer unique stays";
        int markerIndex = content.indexOf(marker);
        if (content.startsWith("Airbnb was born in 2007") && markerIndex >= 0) {
            int nextSentence = content.indexOf('.', markerIndex);
            if (nextSentence >= 0 && nextSentence + 1 < content.length()) {
                return content.substring(nextSentence + 1).trim();
            }
        }
        return content;
    }

    private String prioritizeRoleSection(String content) {
        String[] markers = {
                "The Difference You Will Make",
                "A Typical Day",
                "Your Expertise",
                "About the role",
                "About the Role",
                "In this role",
                "What you will do",
                "Responsibilities",
                "Minimum Qualifications",
                "Basic Qualifications",
                "Qualifications"
        };
        for (String marker : markers) {
            int index = content.indexOf(marker);
            if (index >= 0) {
                return content.substring(index).trim();
            }
        }
        return content;
    }

    private String stripHtml(String value) {
        String unescaped = htmlUnescapeRepeated(value == null ? "" : value);
        String withoutTags = HTML_TAG_PATTERN.matcher(unescaped).replaceAll(" ");
        return SPACE_PATTERN.matcher(withoutTags.replace("&nbsp;", " ")).replaceAll(" ").trim();
    }

    private String htmlUnescapeRepeated(String value) {
        String current = value == null ? "" : value;
        for (int i = 0; i < 3; i++) {
            String next = HtmlUtils.htmlUnescape(current);
            if (next.equals(current)) {
                return next;
            }
            current = next;
        }
        return current;
    }

    private boolean containsAny(String value, String... candidates) {
        if (value == null || value.isBlank()) {
            return false;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank() && value.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return "";
        }
        return node.asText("");
    }

    private boolean matchesFilter(String value, String filter) {
        if (filter == null || filter.isBlank() || "ALL".equalsIgnoreCase(filter)) {
            return true;
        }
        return value != null && value.equalsIgnoreCase(filter.trim());
    }

    private String valueOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private String humanizeBoardToken(String boardToken) {
        if (boardToken == null || boardToken.isBlank()) {
            return "Greenhouse Company";
        }
        String normalized = boardToken.replace('-', ' ').replace('_', ' ');
        return normalized.substring(0, 1).toUpperCase(Locale.ROOT) + normalized.substring(1);
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://boards-api.greenhouse.io";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
