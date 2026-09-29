package com.careerlens.backend.service;

import com.careerlens.backend.dto.SettlementChecklistDto;
import com.careerlens.backend.dto.SettlementCountrySummaryDto;
import com.careerlens.backend.dto.SettlementGuidanceDto;
import com.careerlens.backend.entity.AdministrationRoadmap;
import com.careerlens.backend.entity.PlannerRoadmap;
import com.careerlens.backend.entity.SettlementChecklist;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.AdministrationRoadmapRepository;
import com.careerlens.backend.repository.PlannerRoadmapRepository;
import com.careerlens.backend.repository.SettlementChecklistRepository;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SettlementService {

    private static final String STATUS_NOT_STARTED = "NOT_STARTED";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_DONE = "DONE";
    private static final String GENERATION_RULE_BASED = "RULE_BASED";
    private static final String GENERATION_AI_PREFIX = "AI_ASSISTED:";
    private static final Set<String> SUPPORTED_STATUSES = Set.of(STATUS_NOT_STARTED, STATUS_IN_PROGRESS, STATUS_DONE);
    private static final Set<String> SUPPORTED_RISK_LEVELS = Set.of("LOW", "MEDIUM", "HIGH");
    private static final Duration HTTP_CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration AI_REQUEST_TIMEOUT = Duration.ofSeconds(35);
    private static final int AI_MAX_OUTPUT_TOKENS = 1400;
    private static final double AI_TEMPERATURE = 0.2;
    private static final List<DefaultChecklistTemplate> DEFAULT_CHECKLISTS = List.of(
            new DefaultChecklistTemplate("미국", "비자/행정", "비자 스폰서십 조건 확인", "공고의 visa requirement와 본인의 체류 가능 조건을 비교하고 필요한 증빙을 정리합니다. 최신 비자 판단은 공식기관 자료와 전문가 확인이 필요합니다.", 1),
            new DefaultChecklistTemplate("미국", "비자/행정", "학력/경력 증빙 영문본 정리", "졸업증명, 성적증명, 경력증명, 추천인 정보를 영문 제출 가능 형태로 정리합니다.", 2),
            new DefaultChecklistTemplate("미국", "출국 전 준비", "오퍼 이후 출국 일정 초안 작성", "입사 예정일, 비자 처리 예상 기간, 항공권/숙소 예약 시점을 역산해 4~8주 일정으로 정리합니다.", 3),
            new DefaultChecklistTemplate("미국", "초기 정착", "도착 후 생활 기반 체크", "임시 숙소, 은행 계좌, 휴대폰, 의료보험 등 초기 정착 항목을 확인합니다.", 4),
            new DefaultChecklistTemplate("일본", "비자/행정", "재류자격 및 회사 제출 서류 확인", "내정 후 필요한 재류자격, 학력/경력 증빙, 회사 제출 서류를 점검합니다. 최신 절차는 공식기관 기준으로 재확인합니다.", 5),
            new DefaultChecklistTemplate("일본", "출국 전 준비", "일본어 증빙과 생활 서류 정리", "JLPT/비즈니스 일본어 증빙, 계약 관련 서류, 입사 전 제출 서류 준비 계획을 세웁니다.", 6),
            new DefaultChecklistTemplate("일본", "초기 정착", "거주지와 행정 등록 준비", "주소 등록, 은행, 통신, 건강보험 등 입국 후 행정 절차를 체크합니다.", 7),
            new DefaultChecklistTemplate("일본", "초기 정착", "초기 생활 비용과 이동 동선 정리", "초기 월세, 보증금, 교통, 통신, 생활비를 예산표로 정리하고 첫 2주 이동 동선을 기록합니다.", 8)
    );

    private final SettlementChecklistRepository settlementChecklistRepository;
    private final PlannerRoadmapRepository plannerRoadmapRepository;
    private final AdministrationRoadmapRepository administrationRoadmapRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final AiSettings aiSettings;

    public SettlementService(
            SettlementChecklistRepository settlementChecklistRepository,
            PlannerRoadmapRepository plannerRoadmapRepository,
            AdministrationRoadmapRepository administrationRoadmapRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
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
        this.settlementChecklistRepository = settlementChecklistRepository;
        this.plannerRoadmapRepository = plannerRoadmapRepository;
        this.administrationRoadmapRepository = administrationRoadmapRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(HTTP_CONNECT_TIMEOUT).build();
        this.aiSettings = AiSettings.from(
                aiEnabled,
                provider,
                openAiApiKey,
                openAiModel,
                openAiResponsesUrl,
                groqApiKey,
                groqModel,
                groqResponsesUrl
        );
    }

    @Transactional
    public List<SettlementChecklistDto> getUserChecklists(Long userId) {
        ensureDefaultChecklists(userId);
        return toDtos(loadUserChecklists(userId));
    }

    @Transactional
    public SettlementChecklistDto updateStatus(Long itemId, String status) {
        return updateStatus(itemId, status, null);
    }

    @Transactional
    public SettlementChecklistDto updateStatus(Long itemId, String status, JwtClaims claims) {
        SettlementChecklist checklist = settlementChecklistRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Settlement checklist not found: " + itemId));
        verifyChecklistOwner(checklist, claims);
        checklist.setStatus(normalizeStatus(status));
        checklist.setUpdatedAt(LocalDateTime.now());
        return toDto(settlementChecklistRepository.save(checklist));
    }

    @Transactional
    public SettlementGuidanceDto generateGuidance(Long userId) {
        ensureDefaultChecklists(userId);
        List<SettlementChecklist> checklists = loadUserChecklists(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        SettlementGuidanceDto fallback = buildRuleBasedGuidance(checklists, profile, GENERATION_RULE_BASED);
        if (!isAiConfigured()) {
            return fallback;
        }

        try {
            SettlementGuidanceDto aiGuidance = requestAiGuidance(checklists, profile, fallback);
            return isUsableGuidance(aiGuidance) ? aiGuidance : fallback;
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    @Transactional
    public SettlementGuidanceDto generateGuidanceFromRoadmap(Long roadmapId, JwtClaims claims) {
        PlannerRoadmap roadmap = loadRoadmapForGuidance(roadmapId, claims);
        return administrationRoadmapRepository.findByPlannerRoadmapId(roadmap.getId())
                .map(this::toGuidanceDto)
                .orElseGet(() -> generateAndSaveGuidance(roadmap, false));
    }

    @Transactional(readOnly = true)
    public SettlementGuidanceDto getGuidanceFromRoadmap(Long roadmapId, JwtClaims claims) {
        PlannerRoadmap roadmap = loadRoadmapForGuidance(roadmapId, claims);
        return administrationRoadmapRepository.findByPlannerRoadmapId(roadmap.getId())
                .map(this::toGuidanceDto)
                .orElseThrow(() -> new IllegalArgumentException("Administration roadmap not found: " + roadmapId));
    }

    @Transactional
    public SettlementGuidanceDto refreshGuidanceFromRoadmap(Long roadmapId, JwtClaims claims) {
        PlannerRoadmap roadmap = loadRoadmapForGuidance(roadmapId, claims);
        return generateAndSaveGuidance(roadmap, true);
    }

    private PlannerRoadmap loadRoadmapForGuidance(Long roadmapId, JwtClaims claims) {
        PlannerRoadmap roadmap = plannerRoadmapRepository.findWithDetailsById(roadmapId)
                .orElseThrow(() -> new IllegalArgumentException("Planner roadmap not found: " + roadmapId));
        Long ownerUserId = roadmap.getUser() == null ? null : roadmap.getUser().getId();
        AccessGuard.requireUserOrAdmin(claims, ownerUserId);
        return roadmap;
    }

    private SettlementGuidanceDto generateAndSaveGuidance(PlannerRoadmap roadmap, boolean refresh) {
        Long ownerUserId = roadmap.getUser() == null ? null : roadmap.getUser().getId();
        if (ownerUserId == null) {
            throw new IllegalArgumentException("Planner roadmap owner not found: " + roadmap.getId());
        }
        SettlementGuidanceDto generated = generateGuidance(ownerUserId);
        AdministrationRoadmap saved = saveGuidanceSnapshot(roadmap, generated, refresh);
        return toGuidanceDto(saved);
    }

    private AdministrationRoadmap saveGuidanceSnapshot(PlannerRoadmap roadmap, SettlementGuidanceDto guidance, boolean refresh) {
        LocalDateTime now = LocalDateTime.now();
        AdministrationRoadmap entity = administrationRoadmapRepository.findByPlannerRoadmapId(roadmap.getId())
                .orElseGet(AdministrationRoadmap::new);
        if (entity.getId() == null) {
            entity.setCreatedAt(now);
        }
        entity.setUser(roadmap.getUser());
        entity.setPlannerRoadmap(roadmap);
        entity.setOverallStatus(guidance.overallStatus());
        entity.setCompletionRate(guidance.completionRate());
        entity.setSummary(guidance.summary());
        entity.setPriorityActionsJson(writeJson(guidance.priorityActions()));
        entity.setCountrySummariesJson(writeJson(guidance.countrySummaries()));
        entity.setGenerationMode(guidance.generationMode());
        entity.setDisclaimer(guidance.disclaimer());
        entity.setUpdatedAt(now);
        if (refresh) {
            entity.setRefreshedAt(now);
        }
        return administrationRoadmapRepository.save(entity);
    }

    private SettlementGuidanceDto toGuidanceDto(AdministrationRoadmap entity) {
        return new SettlementGuidanceDto(
                entity.getId(),
                entity.getOverallStatus(),
                entity.getCompletionRate(),
                entity.getSummary(),
                readStringList(entity.getPriorityActionsJson()),
                readCountrySummaries(entity.getCountrySummariesJson()),
                entity.getGenerationMode(),
                entity.getDisclaimer(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getRefreshedAt()
        );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to serialize administration roadmap snapshot", exception);
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (IOException exception) {
            return new ArrayList<>();
        }
    }

    private List<SettlementCountrySummaryDto> readCountrySummaries(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<SettlementCountrySummaryDto>>() {});
        } catch (IOException exception) {
            return new ArrayList<>();
        }
    }

    private void verifyChecklistOwner(SettlementChecklist checklist, JwtClaims claims) {
        if (claims == null) {
            return;
        }
        Long ownerUserId = checklist.getUser() == null ? null : checklist.getUser().getId();
        AccessGuard.requireUserOrAdmin(claims, ownerUserId);
    }

    private void ensureDefaultChecklists(Long userId) {
        if (!settlementChecklistRepository.existsByUserId(userId)) {
            initializeDefaultChecklists(userId);
        }
    }

    private List<SettlementChecklist> loadUserChecklists(Long userId) {
        return settlementChecklistRepository.findByUserIdOrderByCountryAscSortOrderAsc(userId);
    }

    private void initializeDefaultChecklists(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        List<SettlementChecklist> defaults = DEFAULT_CHECKLISTS.stream()
                .map(template -> template.toEntity(user))
                .collect(Collectors.toCollection(ArrayList::new));
        settlementChecklistRepository.saveAll(defaults);
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (SUPPORTED_STATUSES.contains(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported settlement checklist status: " + status);
    }

    private List<SettlementChecklistDto> toDtos(List<SettlementChecklist> checklists) {
        return checklists.stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private SettlementChecklistDto toDto(SettlementChecklist checklist) {
        return new SettlementChecklistDto(
                checklist.getId(),
                checklist.getUser().getId(),
                checklist.getCountry(),
                checklist.getCategory(),
                checklist.getChecklistTitle(),
                checklist.getDescription(),
                checklist.getStatus(),
                checklist.getSortOrder(),
                checklist.getCreatedAt(),
                checklist.getUpdatedAt()
        );
    }

    private boolean isAiConfigured() {
        return aiSettings.isConfigured();
    }

    private boolean isUsableGuidance(SettlementGuidanceDto guidance) {
        return guidance.summary() != null
                && !guidance.summary().isBlank()
                && guidance.priorityActions() != null
                && !guidance.priorityActions().isEmpty();
    }

    private SettlementGuidanceDto requestAiGuidance(
            List<SettlementChecklist> checklists,
            UserProfile profile,
            SettlementGuidanceDto fallback
    ) {
        ObjectNode requestBody = buildAiRequest(buildGuidancePrompt(checklists, profile, fallback));
        HttpRequest httpRequest = buildAiHttpRequest(requestBody);

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI settlement request failed: " + response.statusCode());
            }
            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            if (outputText.isBlank()) {
                return fallback;
            }
            return parseGuidance(objectMapper.readTree(cleanJson(outputText)), fallback);
        } catch (IOException exception) {
            throw new IllegalStateException("AI settlement response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI settlement request interrupted", exception);
        }
    }

    private ObjectNode buildAiRequest(String prompt) {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("model", aiSettings.model());
        request.put("temperature", AI_TEMPERATURE);
        request.put("max_output_tokens", AI_MAX_OUTPUT_TOKENS);
        request.put("input", prompt);
        return request;
    }

    private HttpRequest buildAiHttpRequest(ObjectNode requestBody) {
        return HttpRequest.newBuilder()
                .uri(URI.create(aiSettings.responsesUrl()))
                .timeout(AI_REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + aiSettings.apiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();
    }

    private String buildGuidancePrompt(List<SettlementChecklist> checklists, UserProfile profile, SettlementGuidanceDto fallback) {
        String checklistText = checklists.stream()
                .map(this::formatChecklistForPrompt)
                .collect(Collectors.joining("\n"));
        PromptProfile promptProfile = PromptProfile.from(profile);

        return """
                당신은 CareerLens의 해외취업 정착 준비 보조 분석기다.
                제공된 사용자 프로필과 DB 체크리스트 상태만 사용해서 정착 준비 요약을 만든다.
                최신 비자 법률, 공식 절차, 항공권 가격을 알고 있다고 말하지 마라.
                모든 법적/행정 판단은 공식기관과 전문가 확인이 필요하다는 고지를 포함한다.

                반드시 JSON 객체만 반환한다. 마크다운 코드블록을 쓰지 마라.
                스키마:
                {
                  "summary": "2~3문장 한국어 요약",
                  "priority_actions": ["가장 먼저 할 일", "다음 할 일", "확인할 일"],
                  "country_summaries": [
                    {
                      "country": "미국",
                      "risk_level": "LOW|MEDIUM|HIGH",
                      "next_actions": ["국가별 다음 액션 1", "국가별 다음 액션 2"]
                    }
                  ]
                }

                사용자 프로필:
                희망 국가: %s
                현재 국가: %s
                국적: %s
                희망 직무군: %s
                희망 직무명: %s
                입사 가능 시점: %s
                비자 스폰서십 필요 여부: %s
                영어 수준: %s
                일본어 수준: %s

                체크리스트 완료율: %d%%
                현재 기본 요약: %s

                체크리스트:
                %s
                """.formatted(
                promptProfile.targetCountry(),
                promptProfile.currentCountry(),
                promptProfile.nationality(),
                promptProfile.targetJobFamily(),
                promptProfile.desiredJobTitle(),
                promptProfile.availableStartDate(),
                promptProfile.visaSponsorshipNeeded(),
                promptProfile.englishLevel(),
                promptProfile.japaneseLevel(),
                fallback.completionRate(),
                fallback.summary(),
                checklistText
        );
    }

    private String formatChecklistForPrompt(SettlementChecklist item) {
        return "- [%s] %s / %s / %s: %s".formatted(
                safe(item.getStatus()),
                safe(item.getCountry()),
                safe(item.getCategory()),
                safe(item.getChecklistTitle()),
                safe(item.getDescription())
        );
    }

    private SettlementGuidanceDto parseGuidance(JsonNode root, SettlementGuidanceDto fallback) {
        String summary = text(root, "summary");
        List<String> priorityActions = strings(root.path("priority_actions"));
        List<SettlementCountrySummaryDto> countrySummaries = parseCountrySummaries(root.path("country_summaries"), fallback);
        if (countrySummaries.isEmpty()) {
            countrySummaries = fallback.countrySummaries();
        }

        return new SettlementGuidanceDto(
                fallback.overallStatus(),
                fallback.completionRate(),
                summary.isBlank() ? fallback.summary() : summary,
                priorityActions.isEmpty() ? fallback.priorityActions() : priorityActions,
                countrySummaries,
                GENERATION_AI_PREFIX + aiSettings.provider().toUpperCase(Locale.ROOT),
                disclaimer()
        );
    }

    private List<SettlementCountrySummaryDto> parseCountrySummaries(JsonNode countries, SettlementGuidanceDto fallback) {
        if (!countries.isArray()) {
            return new ArrayList<>();
        }

        Map<String, Integer> fallbackCompletionRates = fallback.countrySummaries().stream()
                .collect(Collectors.toMap(
                        SettlementCountrySummaryDto::country,
                        SettlementCountrySummaryDto::completionRate,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
        List<SettlementCountrySummaryDto> summaries = new ArrayList<>();
        for (JsonNode node : countries) {
            String country = text(node, "country");
            if (!country.isBlank()) {
                summaries.add(toCountrySummary(node, country, fallbackCompletionRates));
            }
        }
        return summaries;
    }

    private SettlementCountrySummaryDto toCountrySummary(JsonNode node, String country, Map<String, Integer> fallbackCompletionRates) {
        return new SettlementCountrySummaryDto(
                country,
                fallbackCompletionRates.getOrDefault(country, 0),
                riskLevel(text(node, "risk_level")),
                strings(node.path("next_actions"))
        );
    }

    private SettlementGuidanceDto buildRuleBasedGuidance(List<SettlementChecklist> checklists, UserProfile profile, String generationMode) {
        int completionRate = completionRate(checklists);
        List<String> priorityActions = priorityActions(checklists);
        if (priorityActions.isEmpty()) {
            priorityActions.add("완료된 항목의 증빙 파일과 공식기관 확인 링크를 정리하세요.");
        }

        return new SettlementGuidanceDto(
                completionRate >= 70 ? "ON_TRACK" : completionRate >= 35 ? "NEEDS_ATTENTION" : "EARLY_STAGE",
                completionRate,
                ruleBasedSummary(completionRate, profile),
                priorityActions,
                countrySummaries(checklists),
                generationMode,
                disclaimer()
        );
    }

    private String ruleBasedSummary(int completionRate, UserProfile profile) {
        String targetCountry = profile == null ? "" : safe(profile.getTargetCountry());
        String countryBasis = targetCountry.isBlank() || "미기재".equals(targetCountry)
                ? "미국/일본 기본 체크리스트를 기준으로"
                : targetCountry + " 목표 국가 기준으로";
        String visaNeed = profile != null && Boolean.TRUE.equals(profile.getVisaSponsorshipNeeded())
                ? "비자 스폰서십 확인을 우선순위에 두어야 합니다."
                : "비자 조건과 입사 가능 시점을 함께 확인해야 합니다.";

        return "현재 정착 준비 완료율은 " + completionRate + "%입니다. "
                + countryBasis
                + " 비자, 출국 전 서류, 초기 정착 항목을 순서대로 확인하는 단계입니다. "
                + visaNeed;
    }

    private List<String> priorityActions(List<SettlementChecklist> checklists) {
        return checklists.stream()
                .filter(item -> !STATUS_DONE.equals(item.getStatus()))
                .limit(4)
                .map(item -> item.getCountry() + " - " + item.getChecklistTitle())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private List<SettlementCountrySummaryDto> countrySummaries(List<SettlementChecklist> checklists) {
        Map<String, List<SettlementChecklist>> byCountry = checklists.stream()
                .collect(Collectors.groupingBy(SettlementChecklist::getCountry, LinkedHashMap::new, Collectors.toList()));
        return byCountry.entrySet().stream()
                .map(entry -> countrySummary(entry.getKey(), entry.getValue()))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private SettlementCountrySummaryDto countrySummary(String country, List<SettlementChecklist> checklists) {
        int rate = completionRate(checklists);
        List<String> actions = checklists.stream()
                .filter(item -> !STATUS_DONE.equals(item.getStatus()))
                .limit(3)
                .map(SettlementChecklist::getChecklistTitle)
                .collect(Collectors.toCollection(ArrayList::new));
        if (actions.isEmpty()) {
            actions.add("완료 항목의 증빙과 공식기관 확인 메모를 정리");
        }
        return new SettlementCountrySummaryDto(country, rate, riskLevelForCompletionRate(rate), actions);
    }

    private String riskLevelForCompletionRate(int rate) {
        if (rate >= 70) {
            return "LOW";
        }
        return rate >= 35 ? "MEDIUM" : "HIGH";
    }

    private int completionRate(List<SettlementChecklist> checklists) {
        if (checklists.isEmpty()) {
            return 0;
        }
        long done = checklists.stream().filter(item -> STATUS_DONE.equals(item.getStatus())).count();
        return Math.round((done * 100.0f) / checklists.size());
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
        String trimmed = value.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private List<String> strings(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode item : node) {
                String value = item.asText("").trim();
                if (!value.isBlank()) {
                    values.add(value);
                }
            }
        }
        return values;
    }

    private String text(JsonNode node, String name) {
        return node.path(name).asText("").trim();
    }

    private String riskLevel(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (SUPPORTED_RISK_LEVELS.contains(normalized)) {
            return normalized;
        }
        return "MEDIUM";
    }

    private String disclaimer() {
        return "비자, 세금, 체류자격, 입국 요건과 행정 절차는 변동될 수 있으므로 최종 제출 전 공식기관과 전문가를 통해 확인하세요.";
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "미기재" : value;
    }

    private record AiSettings(
            boolean enabled,
            String provider,
            String apiKey,
            String model,
            String responsesUrl
    ) {
        static AiSettings from(
                boolean enabled,
                String provider,
                String openAiApiKey,
                String openAiModel,
                String openAiResponsesUrl,
                String groqApiKey,
                String groqModel,
                String groqResponsesUrl
        ) {
            String normalizedProvider = provider == null ? "openai" : provider.trim().toLowerCase(Locale.ROOT);
            if ("groq".equals(normalizedProvider)) {
                return new AiSettings(enabled, normalizedProvider, groqApiKey, groqModel, groqResponsesUrl);
            }
            return new AiSettings(enabled, normalizedProvider, openAiApiKey, openAiModel, openAiResponsesUrl);
        }

        boolean isConfigured() {
            return enabled && apiKey != null && !apiKey.isBlank();
        }
    }

    private record PromptProfile(
            String targetCountry,
            String currentCountry,
            String nationality,
            String targetJobFamily,
            String desiredJobTitle,
            String availableStartDate,
            String visaSponsorshipNeeded,
            String englishLevel,
            String japaneseLevel
    ) {
        static PromptProfile from(UserProfile profile) {
            if (profile == null) {
                return new PromptProfile(
                        "미기재",
                        "미기재",
                        "미기재",
                        "미기재",
                        "미기재",
                        "미기재",
                        "미기재",
                        "미기재",
                        "미기재"
                );
            }

            String visaSponsorshipNeeded = profile.getVisaSponsorshipNeeded() == null
                    ? "미기재"
                    : profile.getVisaSponsorshipNeeded().toString();
            return new PromptProfile(
                    safe(profile.getTargetCountry()),
                    safe(profile.getCurrentCountry()),
                    safe(profile.getNationality()),
                    safe(profile.getTargetJobFamily()),
                    safe(profile.getDesiredJobTitle()),
                    safe(profile.getAvailableStartDate()),
                    visaSponsorshipNeeded,
                    safe(profile.getEnglishLevel()),
                    safe(profile.getJapaneseLevel())
            );
        }
    }

    private record DefaultChecklistTemplate(
            String country,
            String category,
            String title,
            String description,
            int sortOrder
    ) {
        SettlementChecklist toEntity(User user) {
            LocalDateTime now = LocalDateTime.now();
            SettlementChecklist checklist = new SettlementChecklist();
            checklist.setUser(user);
            checklist.setCountry(country);
            checklist.setCategory(category);
            checklist.setChecklistTitle(title);
            checklist.setDescription(description);
            checklist.setStatus(STATUS_NOT_STARTED);
            checklist.setSortOrder(sortOrder);
            checklist.setCreatedAt(now);
            checklist.setUpdatedAt(now);
            return checklist;
        }
    }
}
