package com.careerlens.backend.service;

import com.careerlens.backend.entity.DiagnosisResult;
import com.careerlens.backend.entity.JobPosting;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PlannerTaskDraftService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean aiEnabled;
    private final String provider;
    private final String apiKey;
    private final String model;
    private final String responsesUrl;

    public PlannerTaskDraftService(
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
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        this.aiEnabled = aiEnabled;
        this.provider = provider == null ? "openai" : provider.trim().toLowerCase(Locale.ROOT);
        if ("groq".equals(this.provider)) {
            this.apiKey = groqApiKey;
            this.model = groqModel;
            this.responsesUrl = groqResponsesUrl;
        } else {
            this.apiKey = openAiApiKey;
            this.model = openAiModel;
            this.responsesUrl = openAiResponsesUrl;
        }
    }

    public List<PlannerTaskDraft> generateTasks(DiagnosisResult diagnosis, JobPosting job, int durationWeeks) {
        List<PlannerTaskDraft> fallback = buildRuleBasedTasks(diagnosis, job, durationWeeks);
        if (!isAiConfigured()) {
            return fallback;
        }

        try {
            List<PlannerTaskDraft> aiTasks = requestAiTasks(diagnosis, job, durationWeeks);
            if (isUsable(aiTasks, durationWeeks)) {
                return aiTasks;
            }
            return fallback;
        } catch (RuntimeException exception) {
            return fallback;
        }
    }

    public boolean isAiConfigured() {
        return aiEnabled && apiKey != null && !apiKey.isBlank();
    }

    public String providerName() {
        return provider;
    }

    private List<PlannerTaskDraft> requestAiTasks(DiagnosisResult diagnosis, JobPosting job, int durationWeeks) {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("model", model);
        request.put("temperature", 0.2);
        request.put("max_output_tokens", 3200);
        request.put("input", buildPrompt(diagnosis, job, durationWeeks));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(responsesUrl))
                .timeout(Duration.ofSeconds(45))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(request.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("AI planner request failed: " + response.statusCode());
            }
            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            if (outputText.isBlank()) {
                return new ArrayList<>();
            }
            return parseTasks(objectMapper.readTree(cleanJson(outputText)), durationWeeks);
        } catch (IOException exception) {
            throw new IllegalStateException("AI planner response parse failed", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI planner request interrupted", exception);
        }
    }

    private String buildPrompt(DiagnosisResult diagnosis, JobPosting job, int durationWeeks) {
        List<String> missingItems = normalizeList(diagnosis.getMissingItems());
        long daysUntilDeadline = job.getApplicationDeadline() == null
                ? -1
                : ChronoUnit.DAYS.between(LocalDate.now(), job.getApplicationDeadline());

        return """
                당신은 CareerLens의 해외취업 커리어 플래너 생성기다.
                입력된 추천 진단 결과, 공고 정보, PatternProfile 근거만 사용해서 사용자가 실제로 수행할 수 있는 주차별 과제를 만든다.
                외부 기업 조사를 했다고 말하지 말고, 합격 가능성을 보장하지 마라.

                반드시 JSON 객체만 반환한다. 마크다운 코드블록을 쓰지 마라.
                스키마:
                {
                  "tasks": [
                    {
                      "week_number": 1,
                      "category": "기술",
                      "title": "구체적인 과제명",
                      "description": "최소 3문장. 왜 필요한지, 어떻게 수행할지, 어떤 공고 요구와 연결되는지 포함",
                      "expected_outputs": "사용자가 제출해야 하는 산출물 2~4개",
                      "verification_criteria": "완료 여부를 검증하는 기준 3~5개",
                      "estimated_hours": 6,
                      "difficulty": "MEDIUM"
                    }
                  ]
                }

                생성 규칙:
                - 전체 기간은 %d주다.
                - 과제 수는 6~10개로 만든다.
                - 모든 과제는 expected_outputs와 verification_criteria를 비우지 않는다.
                - description은 한 줄로 끝내지 말고 3문장 이상으로 쓴다.
                - difficulty는 EASY, MEDIUM, HARD 중 하나만 쓴다.
                - 마감기한이 가까우면 지원서류/포트폴리오 정리를 앞 주차에 둔다.
                - 부족요소를 그대로 반복하지 말고, 결과물 중심의 실행 과제로 바꾼다.
                - 각 과제는 문서 분석/검증 기능에서 평가할 수 있게 산출물과 기준을 명확히 쓴다.

                공고 정보:
                회사: %s
                직무: %s
                국가: %s
                직무군: %s
                근무형태: %s
                비자 조건: %s
                연봉: %s
                마감기한: %s
                마감까지 남은 일수: %s
                필수 기술: %s
                우대 기술: %s
                요구 언어: %s

                추천 진단:
                총점: %s
                준비도: %s
                추천 등급: %s
                PatternProfile: %s
                Pattern 근거: %s
                부족 요소: %s
                다음 액션: %s
                """.formatted(
                durationWeeks,
                safe(job.getCompanyName()),
                safe(job.getJobTitle()),
                safe(job.getCountry()),
                safe(job.getJobFamily()),
                safe(job.getWorkType()),
                safe(job.getVisaRequirement()),
                safe(job.getSalaryRange()),
                job.getApplicationDeadline() == null ? "상시 또는 미기재" : job.getApplicationDeadline(),
                daysUntilDeadline < 0 ? "미기재" : daysUntilDeadline + "일",
                String.join(", ", normalizeList(job.getRequiredSkills())),
                String.join(", ", normalizeList(job.getPreferredSkills())),
                String.join(", ", normalizeList(job.getRequiredLanguages())),
                diagnosis.getTotalScore(),
                diagnosis.getReadinessStatus(),
                safe(diagnosis.getRecommendationGrade()),
                safe(diagnosis.getPatternTitle()),
                safe(diagnosis.getPatternEvidenceSummary()),
                missingItems.isEmpty() ? "중대한 부족 요소 없음" : String.join(", ", missingItems),
                safe(diagnosis.getNextActionSummary())
        );
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

    private List<PlannerTaskDraft> parseTasks(JsonNode root, int durationWeeks) {
        JsonNode tasksNode = root.path("tasks");
        if (!tasksNode.isArray()) {
            return new ArrayList<>();
        }

        List<PlannerTaskDraft> tasks = new ArrayList<>();
        for (JsonNode node : tasksNode) {
            String title = text(node, "title");
            String description = text(node, "description");
            String expectedOutputs = text(node, "expected_outputs");
            String verificationCriteria = text(node, "verification_criteria");
            if (title.isBlank() || description.isBlank() || expectedOutputs.isBlank() || verificationCriteria.isBlank()) {
                continue;
            }
            int week = Math.max(1, Math.min(durationWeeks, node.path("week_number").asInt(1)));
            String category = text(node, "category");
            Integer estimatedHours = node.path("estimated_hours").isNumber() ? node.path("estimated_hours").asInt() : 4;
            String difficulty = normalizeDifficulty(text(node, "difficulty"));
            tasks.add(new PlannerTaskDraft(
                    week,
                    category.isBlank() ? "준비" : category,
                    title,
                    minLength(description, "과제 수행 목적, 실행 방법, 공고 요구사항과의 연결점을 문서로 정리한다."),
                    expectedOutputs,
                    verificationCriteria,
                    estimatedHours,
                    difficulty
            ));
        }
        return tasks;
    }

    private boolean isUsable(List<PlannerTaskDraft> tasks, int durationWeeks) {
        if (tasks.size() < Math.min(6, durationWeeks)) {
            return false;
        }
        return tasks.stream().allMatch(task ->
                hasContent(task.title())
                        && hasContent(task.description())
                        && task.description().length() >= 80
                        && hasContent(task.expectedOutputs())
                        && hasContent(task.verificationCriteria()));
    }

    private List<PlannerTaskDraft> buildRuleBasedTasks(DiagnosisResult diagnosis, JobPosting job, int durationWeeks) {
        List<PlannerTaskDraft> tasks = new ArrayList<>();
        List<String> missingItems = normalizeList(diagnosis.getMissingItems());

        tasks.add(task(
                1,
                "공고 분석",
                "공고 요구사항과 PatternProfile 근거 정리",
                job.getCompanyName() + " " + job.getJobTitle() + " 공고의 필수 기술, 우대 기술, 언어, 포트폴리오 요구를 표로 정리한다. 추천 진단에서 선택된 PatternProfile의 핵심 기술과 경험 기준을 함께 적어 현재 프로필과의 차이를 분리한다. 이 문서는 이후 이력서, 포트폴리오, 지원서 문장을 수정할 때 기준표로 사용한다.",
                "공고 요구사항 표 1개; PatternProfile 근거 요약 1개; 내 프로필과의 차이 목록 5개 이상",
                "필수 기술과 우대 기술이 구분되어 있다; 부족 요소가 추천 진단 결과와 연결되어 있다; 다음 과제에서 사용할 우선순위가 표시되어 있다",
                4,
                "EASY"
        ));

        int week = 1;
        for (String missingItem : missingItems) {
            week = Math.min(week + 1, durationWeeks);
            tasks.add(task(
                    week,
                    categoryFor(missingItem),
                    titleFor(missingItem),
                    descriptionFor(missingItem, job),
                    outputFor(missingItem),
                    criteriaFor(missingItem),
                    6,
                    "MEDIUM"
            ));
        }

        while (tasks.size() < 6) {
            int targetWeek = Math.min(tasks.size() + 1, durationWeeks);
            tasks.add(task(
                    targetWeek,
                    "지원서류",
                    "공고 맞춤 이력서와 자기소개 핵심 문장 정리",
                    job.getCompanyName() + " " + job.getJobTitle() + " 직무에 맞춰 이력서 상단 요약과 프로젝트 bullet을 다시 작성한다. 기술 이름을 나열하는 데서 끝내지 않고 문제, 행동, 결과 구조로 경력과 프로젝트를 설명한다. 비자 조건, 근무형태, 언어 요구사항과 연결되는 지원 준비 메모도 함께 정리한다.",
                    "영문 이력서 요약 1개; 프로젝트 bullet 6개 이상; 지원 메모 1개",
                    "공고 필수 기술이 이력서 문장에 반영되어 있다; 프로젝트 성과가 수치 또는 검증 가능한 결과로 표현되어 있다; 지원 메모에 비자/언어/근무형태 확인 항목이 있다",
                    5,
                    "MEDIUM"
            ));
        }

        tasks.add(task(
                Math.max(2, Math.min(durationWeeks - 1, durationWeeks)),
                "포트폴리오",
                "보완 결과를 포트폴리오와 GitHub에 반영",
                "앞선 과제에서 만든 학습 결과와 미니 프로젝트를 포트폴리오 증빙으로 정리한다. README에는 문제 정의, 사용 기술, 본인 역할, 실행 방법, 결과 화면 또는 API 예시를 포함한다. 링크만 제출하는 것이 아니라 채용 담당자가 3분 안에 핵심 역량을 이해할 수 있도록 구조를 정리한다.",
                "GitHub README 1개; 실행 또는 화면 캡처 2개 이상; 포트폴리오 설명 문장 5개 이상",
                "README가 설치/실행 방법을 포함한다; 공고 요구 기술과 프로젝트 기능이 연결되어 있다; 본인 기여와 결과물이 명확히 드러난다",
                7,
                "MEDIUM"
        ));

        tasks.add(task(
                durationWeeks,
                "재진단",
                "프로필 갱신 후 추천 재진단",
                "마이페이지 프로필의 기술스택, 프로젝트 경험, GitHub/포트폴리오 URL, 언어 점수 항목을 갱신한다. 갱신 후 같은 공고로 추천 진단을 다시 실행해 점수와 부족 요소가 어떻게 바뀌었는지 비교한다. 비교 결과를 바탕으로 지원 관리 단계로 넘길지 추가 보완할지 결정한다.",
                "갱신된 프로필; 재진단 결과 캡처 또는 요약; 지원 여부 판단 메모",
                "프로필 변경 전후 차이가 기록되어 있다; 재진단 점수와 부족 요소 변화가 비교되어 있다; 지원/보류/추가 준비 중 하나의 판단이 적혀 있다",
                3,
                "EASY"
        ));

        return tasks;
    }

    private PlannerTaskDraft task(
            Integer weekNumber,
            String category,
            String title,
            String description,
            String expectedOutputs,
            String verificationCriteria,
            Integer estimatedHours,
            String difficulty
    ) {
        return new PlannerTaskDraft(
                weekNumber,
                category,
                title,
                description,
                expectedOutputs,
                verificationCriteria,
                estimatedHours,
                difficulty
        );
    }

    private String categoryFor(String missingItem) {
        String lower = missingItem.toLowerCase(Locale.ROOT);
        if (lower.contains("언어") || lower.contains("english") || lower.contains("japanese")) {
            return "언어";
        }
        if (lower.contains("학력") || lower.contains("자격")) {
            return "학력/자격";
        }
        if (lower.contains("github") || lower.contains("포트폴리오")) {
            return "증빙자료";
        }
        if (lower.contains("경력") || lower.contains("프로젝트")) {
            return "경력/프로젝트";
        }
        return "기술";
    }

    private String titleFor(String missingItem) {
        String normalized = stripPrefix(missingItem);
        if (categoryFor(missingItem).equals("기술")) {
            return normalized + " 미니 프로젝트로 보완";
        }
        return normalized + " 보완 과제";
    }

    private String descriptionFor(String missingItem, JobPosting job) {
        String target = stripPrefix(missingItem);
        String category = categoryFor(missingItem);
        if (category.equals("기술")) {
            return target + "를 사용해 " + job.getJobTitle() + " 공고와 연결되는 작은 기능을 구현한다. 단순 예제 복사가 아니라 입력, 처리, 저장 또는 화면 표시가 있는 완성 가능한 범위로 잡는다. README에는 왜 이 기술이 공고 요구사항과 연결되는지와 본인이 구현한 부분을 명확히 적는다.";
        }
        if (category.equals("경력/프로젝트")) {
            return job.getCompanyName() + " 공고의 실무 요구와 연결되는 2주짜리 프로젝트 범위를 정의한다. 기존 경험이 부족한 부분은 미니 프로젝트, 문서화, 테스트 결과로 보완한다. 결과물은 이력서와 포트폴리오에 바로 붙일 수 있는 문장으로 정리한다.";
        }
        if (category.equals("언어")) {
            return "공고의 언어 요구 수준에 맞춰 자기소개, 프로젝트 설명, 협업 상황 답변을 작성한다. 단순 시험 점수 준비가 아니라 면접과 지원서에서 사용할 표현을 만드는 데 집중한다. 작성한 문장은 AI 문서 분석에서 자연스러움과 직무 연결성을 검증한다.";
        }
        if (category.equals("증빙자료")) {
            return "GitHub 또는 포트폴리오에서 채용 담당자가 확인할 수 있는 증빙을 정리한다. 공개 저장소, README, 실행 방법, 결과 화면, 본인 역할을 빠짐없이 연결한다. 링크만 제출하지 않고 공고 요구 기술과 어떤 관련이 있는지 설명 문장을 추가한다.";
        }
        return target + " 항목을 " + job.getCompanyName() + " 공고 기준으로 보완한다. 현재 프로필에서 부족한 이유를 정리하고, 산출물 중심의 실행 계획을 세운다. 완료 후 문서 분석 기능으로 근거가 충분한지 검증한다.";
    }

    private String outputFor(String missingItem) {
        String category = categoryFor(missingItem);
        if (category.equals("기술")) {
            return "실행 가능한 미니 프로젝트 저장소; README 1개; 샘플 요청/화면 캡처 3개 이상";
        }
        if (category.equals("언어")) {
            return "영문 또는 일본어 자기소개 1개; 프로젝트 설명 문장 5개; 면접 답변 초안 3개";
        }
        if (category.equals("증빙자료")) {
            return "공개 GitHub 또는 포트폴리오 링크; README 보강본; 핵심 프로젝트 설명 5문장";
        }
        return "보완 계획 문서 1개; 이력서 반영 문장 3개 이상; 검증 가능한 결과물 링크 또는 설명";
    }

    private String criteriaFor(String missingItem) {
        String category = categoryFor(missingItem);
        if (category.equals("기술")) {
            return "공고 필수 기술이 실제 코드나 산출물에 사용되었다; 실행 방법이 문서화되어 있다; 본인 역할과 결과가 분리되어 설명되어 있다";
        }
        if (category.equals("언어")) {
            return "문장이 직무 경험과 연결되어 있다; 공고 요구 언어 수준에 맞는 표현을 사용한다; 자기소개/프로젝트/협업 답변이 각각 존재한다";
        }
        if (category.equals("증빙자료")) {
            return "링크 접근이 가능하다; README가 문제/기술/결과를 포함한다; 포트폴리오 설명이 공고 요구와 연결된다";
        }
        return "부족 요소와 산출물이 직접 연결되어 있다; 이력서나 포트폴리오에 반영 가능한 문장이 있다; 완료 여부를 제3자가 확인할 수 있다";
    }

    private String stripPrefix(String value) {
        if (value == null) {
            return "부족 요소";
        }
        return value.replace("핵심 기술 보완:", "")
                .replace("직무 관련 경력 보완:", "")
                .replace("언어 수준 보완:", "")
                .replace("학력/자격 보완:", "")
                .trim();
    }

    private String text(JsonNode node, String name) {
        return node.path(name).asText("").trim();
    }

    private String normalizeDifficulty(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("EASY") || normalized.equals("MEDIUM") || normalized.equals("HARD")) {
            return normalized;
        }
        return "MEDIUM";
    }

    private String minLength(String value, String suffix) {
        if (value.length() >= 80) {
            return value;
        }
        return value + " " + suffix;
    }

    private boolean hasContent(String value) {
        return value != null && !value.isBlank();
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        List<String> result = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                result.add(value.trim());
            }
        }
        return result;
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "미기재" : value;
    }
}
