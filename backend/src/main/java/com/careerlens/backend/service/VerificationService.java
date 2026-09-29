package com.careerlens.backend.service;

import com.careerlens.backend.dto.DocumentVerificationRequestDto;
import com.careerlens.backend.dto.GithubVerificationRequestDto;
import com.careerlens.backend.dto.VerificationBadgeDto;
import com.careerlens.backend.dto.VerificationRequestDto;
import com.careerlens.backend.entity.PlannerTask;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.VerificationBadge;
import com.careerlens.backend.entity.VerificationRequest;
import com.careerlens.backend.repository.PlannerTaskRepository;
import com.careerlens.backend.repository.VerificationBadgeRepository;
import com.careerlens.backend.repository.VerificationRequestRepository;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VerificationService {

    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String MODE_RULE_BASED = "RULE_BASED";
    private static final String MODE_AI_ASSISTED = "AI_ASSISTED";
    private static final String PROVIDER_GROQ = "groq";
    private static final String PROVIDER_OPENAI = "openai";

    private static final String REQUEST_TYPE_TEXT_DOCUMENT = "TEXT_DOCUMENT";
    private static final String REQUEST_TYPE_GITHUB_REPOSITORY = "GITHUB_REPOSITORY";
    private static final String REQUEST_TYPE_PDF_DOCUMENT = "PDF_DOCUMENT";
    private static final String REQUEST_TYPE_DOCX_DOCUMENT = "DOCX_DOCUMENT";
    private static final String REQUEST_TYPE_FILE_DOCUMENT = "FILE_DOCUMENT";

    private static final String GITHUB_FETCHED_STATUS = "FETCHED";
    private static final String GITHUB_FETCH_FAILED_STATUS = "FETCH_FAILED";
    private static final String GITHUB_API_STATUS_PREFIX = "GITHUB_API_";
    private static final String GITHUB_BASE_URL = "https://github.com/";
    private static final String GITHUB_API_REPOS_URL = "https://api.github.com/repos/";

    private static final String HEADER_ACCEPT = "Accept";
    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private static final String HEADER_USER_AGENT = "User-Agent";
    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String GITHUB_JSON_ACCEPT = "application/vnd.github+json";
    private static final String GITHUB_RAW_ACCEPT = "application/vnd.github.raw";
    private static final String CAREERLENS_USER_AGENT = "CareerLens-Capstone";
    private static final String BEARER_PREFIX = "Bearer ";

    private static final int HTTP_CONNECT_TIMEOUT_SECONDS = 10;
    private static final int GITHUB_REQUEST_TIMEOUT_SECONDS = 10;
    private static final int AI_REQUEST_TIMEOUT_SECONDS = 40;
    private static final int AI_MAX_OUTPUT_TOKENS = 1800;
    private static final double AI_TEMPERATURE = 0.2;

    private static final int MAX_SUBMITTED_TEXT_LENGTH = 1000;
    private static final int MAX_PROMPT_SUBMITTED_TEXT_LENGTH = 9000;
    private static final int MAX_EXTRACTED_TEXT_LENGTH = 12000;
    private static final int MAX_README_EXCERPT_LENGTH = 2500;
    private static final long MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

    private static final int SCORE_MIN = 0;
    private static final int SCORE_MAX = 100;
    private static final int DEFAULT_AI_SCORE = 60;
    private static final int BASE_RULE_SCORE = 42;
    private static final int LONG_TEXT_LENGTH = 1000;
    private static final int MEDIUM_TEXT_LENGTH = 500;
    private static final int SHORT_TEXT_LENGTH = 250;
    private static final int LONG_TEXT_SCORE_BONUS = 18;
    private static final int MEDIUM_TEXT_SCORE_BONUS = 12;
    private static final int SHORT_TEXT_SCORE_BONUS = 7;
    private static final int PORTFOLIO_KEYWORD_SCORE_BONUS = 14;
    private static final int VERIFICATION_CRITERIA_SCORE_BONUS = 14;
    private static final int EXPECTED_OUTPUTS_SCORE_BONUS = 10;
    private static final int GITHUB_CONTEXT_SCORE_BONUS = 10;
    private static final int DOCUMENT_FILE_SCORE_BONUS = 4;

    private static final int MIN_BADGE_SCORE = 60;
    private static final int SILVER_BADGE_SCORE = 75;
    private static final int GOLD_BADGE_SCORE = 90;

    private static final String BADGE_TYPE_GITHUB_PROJECT_VERIFIED = "GITHUB_PROJECT_VERIFIED";
    private static final String BADGE_TYPE_TASK_VERIFIED_GOLD = "TASK_VERIFIED_GOLD";
    private static final String BADGE_TYPE_TASK_VERIFIED_SILVER = "TASK_VERIFIED_SILVER";
    private static final String BADGE_TYPE_TASK_VERIFIED_BRONZE = "TASK_VERIFIED_BRONZE";

    private static final String FALLBACK_AI_SUMMARY = "제출 내용이 과제 기준과 일부 연결되어 있습니다.";
    private static final String MISSING_VALUE = "미기재";

    private static final Pattern GITHUB_REPO_PATTERN = Pattern.compile(
            "^https://(?:www\\.)?github\\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:\\.git)?/?(?:.*)?$"
    );

    private final PlannerTaskRepository plannerTaskRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final VerificationBadgeRepository verificationBadgeRepository;
    private final MembershipService membershipService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean aiEnabled;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String responsesUrl;

    public VerificationService(
            PlannerTaskRepository plannerTaskRepository,
            VerificationRequestRepository verificationRequestRepository,
            VerificationBadgeRepository verificationBadgeRepository,
            MembershipService membershipService,
            ObjectMapper objectMapper,
            @Value("${app.ai.openai.enabled:false}") boolean aiEnabled,
            @Value("${app.ai.provider:openai}") String provider,
            @Value("${app.ai.openai.api-key:}") String openAiApiKey,
            @Value("${app.ai.openai.model:gpt-5.4}") String openAiModel,
            @Value("${app.ai.openai.responses-url:https://api.openai.com/v1/responses}") String openAiResponsesUrl,
            @Value("${app.ai.groq.api-key:}") String groqApiKey,
            @Value("${app.ai.groq.model:openai/gpt-oss-20b}") String groqModel,
            @Value("${app.ai.groq.responses-url:https://api.groq.com/openai/v1/responses}") String groqResponsesUrl
    ) {
        this.plannerTaskRepository = plannerTaskRepository;
        this.verificationRequestRepository = verificationRequestRepository;
        this.verificationBadgeRepository = verificationBadgeRepository;
        this.membershipService = membershipService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(HTTP_CONNECT_TIMEOUT_SECONDS)).build();
        this.aiEnabled = aiEnabled;
        this.provider = provider == null ? PROVIDER_OPENAI : provider.trim().toLowerCase(Locale.ROOT);
        if (PROVIDER_GROQ.equals(this.provider)) {
            this.apiKey = groqApiKey;
            this.model = groqModel;
            this.responsesUrl = groqResponsesUrl;
        } else {
            this.apiKey = openAiApiKey;
            this.model = openAiModel;
            this.responsesUrl = openAiResponsesUrl;
        }
    }

    @Transactional
    public VerificationRequestDto verifyTaskText(Long taskId, DocumentVerificationRequestDto request, JwtClaims claims) {
        PlannerTask task = findTask(taskId);
        verifyTaskOwner(task, claims);
        Long ownerUserId = requireTaskOwnerId(task);
        membershipService.assertCanAnalyzeDocument(ownerUserId);
        String requestType = blank(request.documentType()) ? REQUEST_TYPE_TEXT_DOCUMENT : request.documentType();
        VerificationRequestDto result = verifySubmittedText(task, REQUEST_TYPE_TEXT_DOCUMENT, requestType, request.submittedText());
        membershipService.recordDocumentAnalysis(ownerUserId);
        return result;
    }

    @Transactional
    public VerificationRequestDto verifyTaskGithub(Long taskId, GithubVerificationRequestDto request, JwtClaims claims) {
        PlannerTask task = findTask(taskId);
        verifyTaskOwner(task, claims);
        Long ownerUserId = requireTaskOwnerId(task);
        membershipService.assertCanAnalyzeDocument(ownerUserId);
        GithubRepo repo = parseGithubRepo(request.githubUrl());
        GithubRepoContext context = fetchGithubContext(repo);
        String submittedText = buildGithubSubmittedText(repo, context, request.note());
        VerificationRequestDto result = verifySubmittedText(task, REQUEST_TYPE_GITHUB_REPOSITORY, REQUEST_TYPE_GITHUB_REPOSITORY, submittedText);
        membershipService.recordDocumentAnalysis(ownerUserId);
        return result;
    }

    @Transactional
    public VerificationRequestDto verifyTaskFile(Long taskId, String documentType, MultipartFile file, JwtClaims claims) {
        PlannerTask task = findTask(taskId);
        verifyTaskOwner(task, claims);
        Long ownerUserId = requireTaskOwnerId(task);
        membershipService.assertCanAnalyzeDocument(ownerUserId);
        String extractedText = extractText(file);
        if (extractedText.isBlank()) {
            throw new IllegalArgumentException("PDF/DOCX file has no readable text.");
        }
        String requestType = blank(documentType) ? documentTypeFromFilename(file.getOriginalFilename()) : documentType;
        VerificationRequestDto result = verifySubmittedText(task, requestType, requestType, extractedText);
        membershipService.recordDocumentAnalysis(ownerUserId);
        return result;
    }

    private VerificationRequestDto verifySubmittedText(
            PlannerTask task,
            String analysisRequestType,
            String savedRequestType,
            String submittedText
    ) {
        AnalysisDraft analysis = analyze(task, submittedText, analysisRequestType);
        VerificationRequest verification = saveVerification(task, savedRequestType, submittedText, analysis);
        issueBadges(verification);
        return toDto(verification);
    }

    private String buildGithubSubmittedText(GithubRepo repo, GithubRepoContext context, String note) {
        return """
                GitHub repository: %s
                Owner: %s
                Repository: %s
                Fetch status: %s
                Description: %s
                Primary language: %s
                Stars: %s
                Forks: %s
                Default branch: %s
                README excerpt:
                %s

                User note:
                %s
                """.formatted(
                repo.normalizedUrl(),
                repo.owner(),
                repo.name(),
                context.fetchStatus(),
                safe(context.description()),
                safe(context.language()),
                context.stars(),
                context.forks(),
                safe(context.defaultBranch()),
                safe(context.readmeExcerpt()),
                safe(note)
        );
    }

    @Transactional(readOnly = true)
    public List<VerificationRequestDto> getTaskVerifications(Long taskId, JwtClaims claims) {
        PlannerTask task = findTask(taskId);
        verifyTaskOwner(task, claims);
        return verificationRequestRepository.findByPlannerTaskIdOrderByRequestedAtDesc(taskId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VerificationBadgeDto> getUserBadges(Long userId, JwtClaims claims) {
        AccessGuard.requireUserOrAdmin(claims, userId);
        return verificationBadgeRepository.findByUserIdOrderByIssuedAtDesc(userId).stream()
                .map(this::toBadgeDto)
                .toList();
    }

    private void verifyTaskOwner(PlannerTask task, JwtClaims claims) {
        Long ownerUserId = task.getRoadmap() == null || task.getRoadmap().getUser() == null
                ? null
                : task.getRoadmap().getUser().getId();
        AccessGuard.requireUserOrAdmin(claims, ownerUserId);
    }

    private Long requireTaskOwnerId(PlannerTask task) {
        Long ownerUserId = task.getRoadmap() == null || task.getRoadmap().getUser() == null
                ? null
                : task.getRoadmap().getUser().getId();
        if (ownerUserId == null) {
            throw new IllegalArgumentException("과제의 사용자 정보를 찾을 수 없습니다.");
        }
        return ownerUserId;
    }

    private PlannerTask findTask(Long taskId) {
        return plannerTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Planner task not found: " + taskId));
    }

    private VerificationRequest saveVerification(PlannerTask task, String requestType, String submittedText, AnalysisDraft analysis) {
        VerificationRequest verification = createVerification(task, requestType, submittedText, analysis);
        return verificationRequestRepository.save(verification);
    }

    private VerificationRequest createVerification(PlannerTask task, String requestType, String submittedText, AnalysisDraft analysis) {
        User user = task.getRoadmap().getUser();
        VerificationRequest verification = new VerificationRequest();
        verification.setUser(user);
        verification.setPlannerTask(task);
        verification.setRequestType(requestType);
        verification.setStatus(STATUS_COMPLETED);
        verification.setSubmittedText(limit(submittedText, MAX_SUBMITTED_TEXT_LENGTH));
        verification.setVerificationScore(analysis.score());
        verification.setAnalysisSummary(analysis.summary());
        verification.setStrengths(String.join("; ", analysis.strengths()));
        verification.setImprovementItems(String.join("; ", analysis.improvementItems()));
        verification.setReviewerMode(analysis.mode());
        verification.setRequestedAt(LocalDateTime.now());
        verification.setCompletedAt(LocalDateTime.now());
        return verification;
    }

    private void issueBadges(VerificationRequest verification) {
        Integer score = verification.getVerificationScore();
        if (!qualifiesForAnyBadge(score)) {
            return;
        }

        BadgeSpec tierBadge = tierBadge(score);
        saveBadgeIfAbsent(verification, tierBadge);

        if (qualifiesForGithubProjectBadge(verification, score)) {
            saveBadgeIfAbsent(verification, githubProjectBadge());
        }
    }

    private boolean qualifiesForAnyBadge(Integer score) {
        return score != null && score >= MIN_BADGE_SCORE;
    }

    private boolean qualifiesForGithubProjectBadge(VerificationRequest verification, Integer score) {
        return REQUEST_TYPE_GITHUB_REPOSITORY.equals(verification.getRequestType()) && score >= SILVER_BADGE_SCORE;
    }

    private BadgeSpec githubProjectBadge() {
        return new BadgeSpec(
                BADGE_TYPE_GITHUB_PROJECT_VERIFIED,
                "GitHub 프로젝트 검증",
                "실제 GitHub repository URL과 과제 기준을 함께 검증해 발급된 배지입니다."
        );
    }

    private BadgeSpec tierBadge(int score) {
        if (score >= GOLD_BADGE_SCORE) {
            return new BadgeSpec(BADGE_TYPE_TASK_VERIFIED_GOLD, "Gold 검증", "과제 산출물이 기대 산출물과 검증 기준을 매우 충실히 만족했습니다.");
        }
        if (score >= SILVER_BADGE_SCORE) {
            return new BadgeSpec(BADGE_TYPE_TASK_VERIFIED_SILVER, "Silver 검증", "과제 산출물이 주요 검증 기준을 대체로 만족했습니다.");
        }
        return new BadgeSpec(BADGE_TYPE_TASK_VERIFIED_BRONZE, "Bronze 검증", "과제 산출물이 기본 검증 기준을 일부 만족했습니다.");
    }

    private void saveBadgeIfAbsent(VerificationRequest verification, BadgeSpec spec) {
        if (hasBadge(verification, spec)) {
            return;
        }
        verificationBadgeRepository.save(createBadge(verification, spec));
    }

    private boolean hasBadge(VerificationRequest verification, BadgeSpec spec) {
        return verification.getId() != null
                && verificationBadgeRepository.findByVerificationRequestIdAndBadgeType(verification.getId(), spec.type()).isPresent();
    }

    private VerificationBadge createBadge(VerificationRequest verification, BadgeSpec spec) {
        VerificationBadge badge = new VerificationBadge();
        badge.setUser(verification.getUser());
        badge.setPlannerTask(verification.getPlannerTask());
        badge.setVerificationRequest(verification);
        badge.setBadgeType(spec.type());
        badge.setLabel(spec.label());
        badge.setDescription(spec.description());
        badge.setScoreAtIssue(verification.getVerificationScore());
        badge.setIssuedAt(LocalDateTime.now());
        return badge;
    }

    private AnalysisDraft analyze(PlannerTask task, String submittedText, String requestType) {
        AnalysisDraft fallback = ruleBasedAnalysis(task, submittedText, requestType);
        if (!isAiConfigured()) {
            return fallback;
        }
        try {
            AnalysisDraft aiDraft = requestAiAnalysis(task, submittedText, requestType);
            if (aiDraft.summary().isBlank() || aiDraft.improvementItems().isEmpty()) {
                return fallback;
            }
            return aiDraft;
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    private AnalysisDraft requestAiAnalysis(PlannerTask task, String submittedText, String requestType) {
        ObjectNode request = createAiRequestPayload(task, submittedText, requestType);
        HttpRequest httpRequest = createAiHttpRequest(request);

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI verification request failed: " + response.statusCode());
            }
            return parseAiAnalysis(response.body());
        } catch (IOException exception) {
            throw new IllegalStateException("AI verification response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI verification request interrupted", exception);
        }
    }

    private ObjectNode createAiRequestPayload(PlannerTask task, String submittedText, String requestType) {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("model", model);
        request.put("temperature", AI_TEMPERATURE);
        request.put("max_output_tokens", AI_MAX_OUTPUT_TOKENS);
        request.put("input", buildPrompt(task, submittedText, requestType));
        return request;
    }

    private HttpRequest createAiHttpRequest(ObjectNode request) {
        return HttpRequest.newBuilder()
                .uri(URI.create(responsesUrl))
                .timeout(Duration.ofSeconds(AI_REQUEST_TIMEOUT_SECONDS))
                .header(HEADER_CONTENT_TYPE, CONTENT_TYPE_JSON)
                .header(HEADER_AUTHORIZATION, BEARER_PREFIX + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(request.toString()))
                .build();
    }

    private AnalysisDraft parseAiAnalysis(String responseBody) throws IOException {
        String outputText = extractOutputText(objectMapper.readTree(responseBody));
        JsonNode root = objectMapper.readTree(cleanJson(outputText));
        return new AnalysisDraft(
                clamp(root.path("score").asInt(DEFAULT_AI_SCORE)),
                root.path("summary").asText(FALLBACK_AI_SUMMARY),
                jsonArray(root.path("strengths")),
                jsonArray(root.path("improvement_items")),
                MODE_AI_ASSISTED + ":" + provider.toUpperCase(Locale.ROOT)
        );
    }

    private String buildPrompt(PlannerTask task, String submittedText, String requestType) {
        return """
                당신은 CareerLens의 해외취업 과제 검증 리뷰어다.
                사용자가 제출한 텍스트, GitHub repository, PDF, DOCX 내용이 플래너 과제의 산출물과 검증 기준을 충족하는지 평가한다.
                합격 보장, 허위 경력 작성, 외부 사실 조사는 하지 않는다.

                반드시 JSON 객체만 반환한다. 마크다운 코드블록을 쓰지 마라.
                스키마:
                {
                  "score": 75,
                  "summary": "3문장 이내 요약",
                  "strengths": ["좋은 점 1", "좋은 점 2"],
                  "improvement_items": ["보완점 1", "보완점 2", "보완점 3"]
                }

                점수 기준:
                - 90 이상: 배지 Gold 수준. 산출물과 검증 기준이 매우 구체적이고 포트폴리오 증빙으로 바로 활용 가능.
                - 75 이상: 배지 Silver 수준. 주요 기준은 충족하지만 일부 보완 필요.
                - 60 이상: 배지 Bronze 수준. 기본 산출물은 있으나 구체성과 검증 가능성이 부족.
                - 60 미만: 배지 미발급. 산출물 기준이 불명확하거나 공고/과제와 연결이 약함.

                제출 유형: %s
                과제 제목: %s
                과제 설명: %s
                기대 산출물: %s
                검증 기준: %s

                제출 내용:
                %s
                """.formatted(
                requestType,
                safe(task.getTitle()),
                safe(task.getDescription()),
                safe(task.getExpectedOutputs()),
                safe(task.getVerificationCriteria()),
                limit(submittedText, MAX_PROMPT_SUBMITTED_TEXT_LENGTH)
        );
    }

    private AnalysisDraft ruleBasedAnalysis(PlannerTask task, String submittedText, String requestType) {
        String text = submittedText == null ? "" : submittedText.trim();
        int score = ruleBasedScore(task, text, requestType);
        List<String> strengths = ruleBasedStrengths(text);
        List<String> improvements = ruleBasedImprovements(task, text);

        return new AnalysisDraft(
                score,
                "제출 내용은 과제와 일부 연결되어 있으며, 산출물과 검증 기준을 더 명확히 표시하면 포트폴리오 증빙으로 활용하기 좋습니다.",
                strengths,
                improvements,
                MODE_RULE_BASED
        );
    }

    private int ruleBasedScore(PlannerTask task, String text, String requestType) {
        int score = BASE_RULE_SCORE;
        score += textLengthScoreBonus(text);
        if (containsAny(text, "github", "repository", "portfolio", "readme", "api", "project", "프로젝트", "성과", "역할")) {
            score += PORTFOLIO_KEYWORD_SCORE_BONUS;
        }
        if (containsAny(text, keywordTokens(task.getVerificationCriteria()))) {
            score += VERIFICATION_CRITERIA_SCORE_BONUS;
        }
        if (containsAny(text, keywordTokens(task.getExpectedOutputs()))) {
            score += EXPECTED_OUTPUTS_SCORE_BONUS;
        }
        if (hasGithubContextEvidence(text, requestType)) {
            score += GITHUB_CONTEXT_SCORE_BONUS;
        }
        if (isDocumentFileRequestType(requestType)) {
            score += DOCUMENT_FILE_SCORE_BONUS;
        }
        return clamp(score);
    }

    private int textLengthScoreBonus(String text) {
        if (text.length() >= LONG_TEXT_LENGTH) {
            return LONG_TEXT_SCORE_BONUS;
        }
        if (text.length() >= MEDIUM_TEXT_LENGTH) {
            return MEDIUM_TEXT_SCORE_BONUS;
        }
        if (text.length() >= SHORT_TEXT_LENGTH) {
            return SHORT_TEXT_SCORE_BONUS;
        }
        return 0;
    }

    private boolean hasGithubContextEvidence(String text, String requestType) {
        return REQUEST_TYPE_GITHUB_REPOSITORY.equals(requestType)
                && containsAny(text, "README excerpt", "Primary language", "Default branch");
    }

    private boolean isDocumentFileRequestType(String requestType) {
        return requestType != null && requestType.contains("PDF") || requestType != null && requestType.contains("DOCX");
    }

    private List<String> ruleBasedStrengths(String text) {
        List<String> strengths = new ArrayList<>();
        strengths.add("제출 내용이 플래너 과제와 연결되어 있습니다.");
        if (text.length() >= SHORT_TEXT_LENGTH) {
            strengths.add("기본 설명 분량은 확보되어 있습니다.");
        }
        if (containsAny(text, "결과", "성과", "화면", "링크", "README", "readme", "repository")) {
            strengths.add("검증 가능한 결과물 또는 증빙을 언급했습니다.");
        }
        return strengths;
    }

    private List<String> ruleBasedImprovements(PlannerTask task, String text) {
        List<String> improvements = new ArrayList<>();
        improvements.add("기대 산출물(" + safe(task.getExpectedOutputs()) + ")을 항목별로 더 명확히 분리하세요.");
        improvements.add("검증 기준(" + safe(task.getVerificationCriteria()) + ")을 하나씩 충족했는지 체크 형태로 보강하세요.");
        if (!containsAny(text, "수치", "%", "ms", "명", "개", "건")) {
            improvements.add("성과를 수치나 구체적인 결과로 표현하면 지원서 활용도가 높아집니다.");
        }
        return improvements;
    }

    private GithubRepo parseGithubRepo(String url) {
        if (blank(url)) {
            throw new IllegalArgumentException("GitHub repository URL is required.");
        }
        Matcher matcher = GITHUB_REPO_PATTERN.matcher(url.trim());
        if (!matcher.matches()) {
            throw new IllegalArgumentException("GitHub URL must be a repository URL like https://github.com/owner/repository.");
        }
        String owner = matcher.group(1);
        String repo = matcher.group(2).replaceFirst("\\.git$", "");
        if (owner.equalsIgnoreCase("topics") || owner.equalsIgnoreCase("features") || owner.equalsIgnoreCase("orgs")) {
            throw new IllegalArgumentException("GitHub profile, topic, organization landing pages are not accepted. Submit a project repository URL.");
        }
        if (repo.isBlank()) {
            throw new IllegalArgumentException("Submit a project repository URL, not a GitHub profile URL.");
        }
        return new GithubRepo(owner, repo, GITHUB_BASE_URL + owner + "/" + repo);
    }

    private GithubRepoContext fetchGithubContext(GithubRepo repo) {
        try {
            HttpRequest request = createGithubRepoRequest(repo);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                throw new IllegalArgumentException("Public GitHub repository not found: " + repo.normalizedUrl());
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return GithubRepoContext.failed(GITHUB_API_STATUS_PREFIX + response.statusCode());
            }
            return parseGithubContext(repo, response.body());
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            return GithubRepoContext.failed(GITHUB_FETCH_FAILED_STATUS);
        }
    }

    private HttpRequest createGithubRepoRequest(GithubRepo repo) {
        return HttpRequest.newBuilder()
                .uri(URI.create(GITHUB_API_REPOS_URL + repo.owner() + "/" + repo.name()))
                .timeout(Duration.ofSeconds(GITHUB_REQUEST_TIMEOUT_SECONDS))
                .header(HEADER_ACCEPT, GITHUB_JSON_ACCEPT)
                .header(HEADER_USER_AGENT, CAREERLENS_USER_AGENT)
                .GET()
                .build();
    }

    private GithubRepoContext parseGithubContext(GithubRepo repo, String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        String readme = fetchReadme(repo);
        return new GithubRepoContext(
                GITHUB_FETCHED_STATUS,
                root.path("description").asText(""),
                root.path("language").asText(""),
                root.path("stargazers_count").asInt(0),
                root.path("forks_count").asInt(0),
                root.path("default_branch").asText(""),
                limit(readme, MAX_README_EXCERPT_LENGTH)
        );
    }

    private String fetchReadme(GithubRepo repo) {
        try {
            HttpRequest request = createGithubReadmeRequest(repo);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300 ? response.body() : "";
        } catch (Exception exception) {
            return "";
        }
    }

    private HttpRequest createGithubReadmeRequest(GithubRepo repo) {
        return HttpRequest.newBuilder()
                .uri(URI.create(GITHUB_API_REPOS_URL + repo.owner() + "/" + repo.name() + "/readme"))
                .timeout(Duration.ofSeconds(GITHUB_REQUEST_TIMEOUT_SECONDS))
                .header(HEADER_ACCEPT, GITHUB_RAW_ACCEPT)
                .header(HEADER_USER_AGENT, CAREERLENS_USER_AGENT)
                .GET()
                .build();
    }

    private String extractText(MultipartFile file) {
        validateFile(file);
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        try {
            if (filename.endsWith(".pdf")) {
                return extractPdfText(file);
            }
            if (filename.endsWith(".docx")) {
                return extractDocxText(file);
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Failed to read uploaded file.", exception);
        }
        throw new IllegalArgumentException("Only PDF and DOCX files are supported.");
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("PDF or DOCX file is required.");
        }
        if (file.getSize() > MAX_UPLOAD_SIZE_BYTES) {
            throw new IllegalArgumentException("File size must be 5MB or smaller.");
        }
    }

    private String extractPdfText(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            return limit(new PDFTextStripper().getText(document), MAX_EXTRACTED_TEXT_LENGTH);
        }
    }

    private String extractDocxText(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
            StringBuilder builder = new StringBuilder();
            document.getParagraphs().forEach(paragraph -> builder.append(paragraph.getText()).append('\n'));
            document.getTables().forEach(table ->
                    table.getRows().forEach(row ->
                            row.getTableCells().forEach(cell -> builder.append(cell.getText()).append('\n'))));
            return limit(builder.toString(), MAX_EXTRACTED_TEXT_LENGTH);
        }
    }

    private String documentTypeFromFilename(String filename) {
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) {
            return REQUEST_TYPE_PDF_DOCUMENT;
        }
        if (lower.endsWith(".docx")) {
            return REQUEST_TYPE_DOCX_DOCUMENT;
        }
        return REQUEST_TYPE_FILE_DOCUMENT;
    }

    private VerificationRequestDto toDto(VerificationRequest verification) {
        Long taskId = verification.getPlannerTask() == null ? null : verification.getPlannerTask().getId();
        Long userId = verification.getUser() == null ? null : verification.getUser().getId();
        return new VerificationRequestDto(
                verification.getId(),
                taskId,
                userId,
                verification.getRequestType(),
                verification.getStatus(),
                verification.getVerificationScore(),
                verification.getAnalysisSummary(),
                verification.getStrengths(),
                verification.getImprovementItems(),
                verification.getReviewerMode(),
                verification.getRequestedAt(),
                verification.getCompletedAt(),
                issuedBadgesForVerification(verification, taskId)
        );
    }

    private List<VerificationBadgeDto> issuedBadgesForVerification(VerificationRequest verification, Long taskId) {
        if (verification.getId() == null) {
            return new ArrayList<>();
        }
        return verificationBadgeRepository.findByPlannerTaskIdOrderByIssuedAtDesc(taskId).stream()
                .filter(badge -> isBadgeForVerification(badge, verification))
                .map(this::toBadgeDto)
                .toList();
    }

    private boolean isBadgeForVerification(VerificationBadge badge, VerificationRequest verification) {
        return badge.getVerificationRequest() != null
                && badge.getVerificationRequest().getId().equals(verification.getId());
    }

    private VerificationBadgeDto toBadgeDto(VerificationBadge badge) {
        Long taskId = badge.getPlannerTask() == null ? null : badge.getPlannerTask().getId();
        Long verificationId = badge.getVerificationRequest() == null ? null : badge.getVerificationRequest().getId();
        return new VerificationBadgeDto(
                badge.getId(),
                taskId,
                verificationId,
                badge.getBadgeType(),
                badge.getLabel(),
                badge.getDescription(),
                badge.getScoreAtIssue(),
                badge.getIssuedAt()
        );
    }

    private boolean isAiConfigured() {
        return aiEnabled && apiKey != null && !apiKey.isBlank();
    }

    private String extractOutputText(JsonNode root) {
        JsonNode output = root.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                JsonNode content = item.path("content");
                if (content.isArray()) {
                    for (JsonNode contentItem : content) {
                        String text = contentItem.path("text").asText("");
                        if (!text.isBlank()) {
                            return text;
                        }
                    }
                }
            }
        }
        return root.path("output_text").asText("");
    }

    private String cleanJson(String value) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private List<String> jsonArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (!node.isArray()) {
            return values;
        }
        for (JsonNode item : node) {
            String value = item.asText("");
            if (!value.isBlank()) {
                values.add(value);
            }
        }
        return values;
    }

    private String[] keywordTokens(String value) {
        if (value == null || value.isBlank()) {
            return new String[0];
        }
        return value.replace(";", " ")
                .replace(",", " ")
                .split("\\s+");
    }

    private boolean containsAny(String source, String... values) {
        if (source == null || source.isBlank()) {
            return false;
        }
        String lower = source.toLowerCase(Locale.ROOT);
        for (String value : values) {
            if (value != null && value.length() >= 2 && lower.contains(value.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? MISSING_VALUE : value;
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private int clamp(int value) {
        return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
    }

    private record AnalysisDraft(
            Integer score,
            String summary,
            List<String> strengths,
            List<String> improvementItems,
            String mode
    ) {
    }

    private record GithubRepo(String owner, String name, String normalizedUrl) {
    }

    private record GithubRepoContext(
            String fetchStatus,
            String description,
            String language,
            Integer stars,
            Integer forks,
            String defaultBranch,
            String readmeExcerpt
    ) {
        static GithubRepoContext failed(String status) {
            return new GithubRepoContext(status, "", "", 0, 0, "", "");
        }
    }

    private record BadgeSpec(String type, String label, String description) {
    }
}
