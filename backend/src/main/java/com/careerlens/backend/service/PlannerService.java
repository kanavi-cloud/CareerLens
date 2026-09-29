package com.careerlens.backend.service;

import com.careerlens.backend.dto.PlannerRoadmapDto;
import com.careerlens.backend.dto.PlannerTaskDto;
import com.careerlens.backend.entity.DiagnosisResult;
import com.careerlens.backend.entity.DepartureRoadmap;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PlannerRoadmap;
import com.careerlens.backend.entity.PlannerTask;
import com.careerlens.backend.repository.AdministrationRoadmapRepository;
import com.careerlens.backend.repository.ApplicationRecordRepository;
import com.careerlens.backend.repository.DepartureFlightOfferRepository;
import com.careerlens.backend.repository.DepartureMilestoneRepository;
import com.careerlens.backend.repository.DepartureRoadmapRepository;
import com.careerlens.backend.repository.DiagnosisResultRepository;
import com.careerlens.backend.repository.PlannerRoadmapRepository;
import com.careerlens.backend.repository.PlannerTaskRepository;
import com.careerlens.backend.repository.VerificationBadgeRepository;
import com.careerlens.backend.repository.VerificationRequestRepository;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlannerService {

    private static final String STATUS_TODO = "TODO";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_DONE = "DONE";
    private static final String MODE_AI_ASSISTED = "AI_ASSISTED";
    private static final String MODE_RULE_BASED = "RULE_BASED";
    private static final int IMMEDIATE_APPLY_DURATION_WEEKS = 4;
    private static final int PREPARE_THEN_APPLY_DURATION_WEEKS = 8;
    private static final int LONG_TERM_PREPARE_DURATION_WEEKS = 12;
    private static final String ROADMAP_TITLE_SUFFIX = " 준비 로드맵";
    private static final String ALL_TASKS_DONE_MESSAGE = "모든 준비 과제가 완료되었습니다. 지원 관리 단계로 이동할 수 있습니다.";

    private final DiagnosisResultRepository diagnosisResultRepository;
    private final PlannerRoadmapRepository plannerRoadmapRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final PlannerTaskDraftService plannerTaskDraftService;
    private final MembershipService membershipService;
    private final VerificationBadgeRepository verificationBadgeRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final ApplicationRecordRepository applicationRecordRepository;
    private final DepartureRoadmapRepository departureRoadmapRepository;
    private final DepartureFlightOfferRepository departureFlightOfferRepository;
    private final DepartureMilestoneRepository departureMilestoneRepository;
    private final AdministrationRoadmapRepository administrationRoadmapRepository;

    public PlannerService(
            DiagnosisResultRepository diagnosisResultRepository,
            PlannerRoadmapRepository plannerRoadmapRepository,
            PlannerTaskRepository plannerTaskRepository,
            PlannerTaskDraftService plannerTaskDraftService,
            MembershipService membershipService,
            VerificationBadgeRepository verificationBadgeRepository,
            VerificationRequestRepository verificationRequestRepository,
            ApplicationRecordRepository applicationRecordRepository,
            DepartureRoadmapRepository departureRoadmapRepository,
            DepartureFlightOfferRepository departureFlightOfferRepository,
            DepartureMilestoneRepository departureMilestoneRepository,
            AdministrationRoadmapRepository administrationRoadmapRepository
    ) {
        this.diagnosisResultRepository = diagnosisResultRepository;
        this.plannerRoadmapRepository = plannerRoadmapRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.plannerTaskDraftService = plannerTaskDraftService;
        this.membershipService = membershipService;
        this.verificationBadgeRepository = verificationBadgeRepository;
        this.verificationRequestRepository = verificationRequestRepository;
        this.applicationRecordRepository = applicationRecordRepository;
        this.departureRoadmapRepository = departureRoadmapRepository;
        this.departureFlightOfferRepository = departureFlightOfferRepository;
        this.departureMilestoneRepository = departureMilestoneRepository;
        this.administrationRoadmapRepository = administrationRoadmapRepository;
    }

    // ===== 주요 기능: Controller에서 직접 호출하는 커리어 플래너 기능 =====

    @Transactional
    public PlannerRoadmapDto createFromDiagnosis(Long diagnosisId) {
        return createFromDiagnosis(diagnosisId, null);
    }

    @Transactional
    public PlannerRoadmapDto createFromDiagnosis(Long diagnosisId, JwtClaims claims) {
        PlannerRoadmap existing = findExistingRoadmap(diagnosisId);
        if (existing != null) {
            verifyRoadmapOwner(existing, claims);
            return toDto(existing);
        }

        DiagnosisResult diagnosis = findDiagnosis(diagnosisId);
        verifyDiagnosisOwner(diagnosis, claims);
        Long ownerUserId = requireDiagnosisOwnerId(diagnosis);
        membershipService.assertCanCreateRoadmap(ownerUserId);
        int durationWeeks = durationWeeks(diagnosis);
        boolean aiConfigured = plannerTaskDraftService.isAiConfigured();

        PlannerRoadmap savedRoadmap = saveRoadmap(diagnosis, durationWeeks, aiConfigured);
        saveTasks(savedRoadmap, diagnosis, durationWeeks);
        membershipService.recordRoadmapCreated(ownerUserId);
        return toDto(savedRoadmap);
    }

    @Transactional(readOnly = true)
    public PlannerRoadmapDto getRoadmap(Long roadmapId) {
        return getRoadmap(roadmapId, null);
    }

    @Transactional(readOnly = true)
    public PlannerRoadmapDto getRoadmap(Long roadmapId, JwtClaims claims) {
        PlannerRoadmap roadmap = plannerRoadmapRepository.findWithDetailsById(roadmapId)
                .orElseThrow(() -> new IllegalArgumentException("Planner roadmap not found: " + roadmapId));
        verifyRoadmapOwner(roadmap, claims);
        return toDto(roadmap);
    }

    @Transactional(readOnly = true)
    public List<PlannerRoadmapDto> getUserRoadmaps(Long userId) {
        return plannerRoadmapRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PlannerRoadmapDto updateTaskStatus(Long taskId, String status) {
        return updateTaskStatus(taskId, status, null);
    }

    @Transactional
    public PlannerRoadmapDto updateTaskStatus(Long taskId, String status, JwtClaims claims) {
        PlannerTask task = plannerTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Planner task not found: " + taskId));
        verifyRoadmapOwner(task.getRoadmap(), claims);
        task.setStatus(normalizeStatus(status));
        plannerTaskRepository.save(task);
        return toDto(task.getRoadmap());
    }

    @Transactional
    public void deleteRoadmap(Long roadmapId, JwtClaims claims) {
        PlannerRoadmap roadmap = plannerRoadmapRepository.findWithDetailsById(roadmapId)
                .orElseThrow(() -> new IllegalArgumentException("Planner roadmap not found: " + roadmapId));
        verifyRoadmapOwner(roadmap, claims);

        verificationBadgeRepository.deleteByPlannerTaskRoadmapId(roadmapId);
        verificationBadgeRepository.deleteByVerificationRequestTaskRoadmapId(roadmapId);
        verificationRequestRepository.deleteByPlannerTaskRoadmapId(roadmapId);
        applicationRecordRepository.deleteByPlannerRoadmapId(roadmapId);
        deleteDepartureRoadmap(roadmapId);
        administrationRoadmapRepository.deleteByPlannerRoadmapId(roadmapId);
        plannerTaskRepository.deleteByRoadmapId(roadmapId);
        plannerRoadmapRepository.delete(roadmap);
    }

    private void deleteDepartureRoadmap(Long roadmapId) {
        departureRoadmapRepository.findByPlannerRoadmapId(roadmapId).ifPresent(departureRoadmap -> {
            Long departureRoadmapId = departureRoadmap.getId();
            departureFlightOfferRepository.deleteByDepartureRoadmapId(departureRoadmapId);
            departureMilestoneRepository.deleteByDepartureRoadmapId(departureRoadmapId);
            departureRoadmapRepository.delete(departureRoadmap);
        });
    }

    private void verifyDiagnosisOwner(DiagnosisResult diagnosis, JwtClaims claims) {
        if (claims == null) {
            return;
        }
        Long ownerUserId = diagnosis.getUser() == null ? null : diagnosis.getUser().getId();
        AccessGuard.requireUserOrAdmin(claims, ownerUserId);
    }

    private void verifyRoadmapOwner(PlannerRoadmap roadmap, JwtClaims claims) {
        if (claims == null) {
            return;
        }
        Long ownerUserId = roadmap.getUser() == null ? null : roadmap.getUser().getId();
        AccessGuard.requireUserOrAdmin(claims, ownerUserId);
    }

    private Long requireDiagnosisOwnerId(DiagnosisResult diagnosis) {
        if (diagnosis.getUser() == null || diagnosis.getUser().getId() == null) {
            throw new IllegalArgumentException("진단 결과의 사용자 정보를 찾을 수 없습니다.");
        }
        return diagnosis.getUser().getId();
    }

    // ===== 로드맵 생성: 진단 결과를 로드맵과 과제로 저장하는 내부 흐름 =====

    // 같은 추천 진단으로 이미 만든 로드맵이 있으면 중복 생성하지 않고 재사용합니다.
    private PlannerRoadmap findExistingRoadmap(Long diagnosisId) {
        return plannerRoadmapRepository.findByDiagnosisResultId(diagnosisId).orElse(null);
    }

    // 로드맵 생성에 필요한 진단 결과와 연결된 공고 정보를 함께 가져옵니다.
    private DiagnosisResult findDiagnosis(Long diagnosisId) {
        return diagnosisResultRepository.findWithDetailsById(diagnosisId)
                .orElseThrow(() -> new IllegalArgumentException("Diagnosis result not found: " + diagnosisId));
    }

    // 진단 결과를 기준으로 로드맵 기본 정보만 먼저 저장합니다.
    private PlannerRoadmap saveRoadmap(DiagnosisResult diagnosis, int durationWeeks, boolean aiConfigured) {
        JobPosting job = diagnosis.getJobPosting();
        PlannerRoadmap roadmap = new PlannerRoadmap();
        roadmap.setUser(diagnosis.getUser());
        roadmap.setDiagnosisResult(diagnosis);
        roadmap.setTargetCompany(job.getCompanyName());
        roadmap.setTargetJobTitle(job.getJobTitle());
        roadmap.setReadinessStatus(diagnosis.getReadinessStatus().name());
        roadmap.setTotalScore(diagnosis.getTotalScore());
        roadmap.setDurationWeeks(durationWeeks);
        roadmap.setGenerationMode(buildGenerationMode(aiConfigured));
        roadmap.setTitle(buildRoadmapTitle(job));
        roadmap.setSummary(buildSummary(diagnosis, job, durationWeeks, aiConfigured));
        roadmap.setCreatedAt(LocalDateTime.now());
        return plannerRoadmapRepository.save(roadmap);
    }

    // 저장된 로드맵에 연결될 주차별 과제를 생성하고 순서를 붙여 저장합니다.
    private void saveTasks(PlannerRoadmap savedRoadmap, DiagnosisResult diagnosis, int durationWeeks) {
        JobPosting job = diagnosis.getJobPosting();
        List<PlannerTask> tasks = plannerTaskDraftService.generateTasks(diagnosis, job, durationWeeks).stream()
                .map(draft -> toTask(savedRoadmap, draft))
                .toList();
        assignSortOrder(tasks);
        plannerTaskRepository.saveAll(tasks);
    }

    // ===== 로드맵 내용 구성: 제목, 요약, 기간, 생성 방식을 만드는 부분 =====

    private String buildSummary(DiagnosisResult diagnosis, JobPosting job, int durationWeeks, boolean aiConfigured) {
        String mode = aiConfigured ? "AI 보조 생성" : "규칙 기반 생성";
        if (diagnosis.getMissingItems().isEmpty()) {
            return mode + " 로드맵입니다. " + job.getCompanyName() + " 공고는 현재 프로필과 적합도가 높으므로 "
                    + durationWeeks + "주 동안 지원서, 포트폴리오, 지원 체크리스트를 정리합니다.";
        }
        return mode + " 로드맵입니다. " + job.getCompanyName() + " 공고의 부족 요소 "
                + diagnosis.getMissingItems().size() + "개를 " + durationWeeks
                + "주 동안 기술 보완, 프로젝트 증빙, 지원서 정리 과제로 나누어 준비합니다.";
    }

    private int durationWeeks(DiagnosisResult diagnosis) {
        return switch (diagnosis.getReadinessStatus()) {
            case IMMEDIATE_APPLY -> IMMEDIATE_APPLY_DURATION_WEEKS;
            case PREPARE_THEN_APPLY -> PREPARE_THEN_APPLY_DURATION_WEEKS;
            case LONG_TERM_PREPARE -> LONG_TERM_PREPARE_DURATION_WEEKS;
        };
    }

    private String buildGenerationMode(boolean aiConfigured) {
        if (!aiConfigured) {
            return MODE_RULE_BASED;
        }
        return MODE_AI_ASSISTED + ":" + plannerTaskDraftService.providerName().toUpperCase();
    }

    private String buildRoadmapTitle(JobPosting job) {
        return job.getCompanyName() + " " + job.getJobTitle() + ROADMAP_TITLE_SUFFIX;
    }

    // ===== Entity 변환: 생성된 초안과 DB 데이터를 저장/응답 형태로 바꾸는 부분 =====

    private PlannerTask toTask(PlannerRoadmap roadmap, PlannerTaskDraft draft) {
        PlannerTask task = new PlannerTask();
        task.setRoadmap(roadmap);
        task.setWeekNumber(draft.weekNumber());
        task.setCategory(draft.category());
        task.setTitle(draft.title());
        task.setDescription(draft.description());
        task.setExpectedOutputs(draft.expectedOutputs());
        task.setVerificationCriteria(draft.verificationCriteria());
        task.setEstimatedHours(draft.estimatedHours());
        task.setDifficulty(draft.difficulty());
        task.setStatus(STATUS_TODO);
        return task;
    }

    private PlannerRoadmapDto toDto(PlannerRoadmap roadmap) {
        List<PlannerTaskDto> tasks = plannerTaskRepository.findByRoadmapIdOrderBySortOrderAsc(roadmap.getId()).stream()
                .map(this::toTaskDto)
                .toList();
        TaskProgress progress = calculateTaskProgress(tasks);

        Long diagnosisId = roadmap.getDiagnosisResult() == null ? null : roadmap.getDiagnosisResult().getId();
        Long userId = roadmap.getUser() == null ? null : roadmap.getUser().getId();
        return new PlannerRoadmapDto(
                roadmap.getId(),
                userId,
                diagnosisId,
                roadmap.getTitle(),
                roadmap.getSummary(),
                roadmap.getTargetCompany(),
                roadmap.getTargetJobTitle(),
                roadmap.getReadinessStatus(),
                roadmap.getTotalScore(),
                roadmap.getDurationWeeks(),
                roadmap.getGenerationMode(),
                roadmap.getCreatedAt(),
                progress.totalTaskCount(),
                progress.completedTaskCount(),
                progress.inProgressTaskCount(),
                progress.completionRate(),
                findNextAction(tasks),
                tasks
        );
    }

    private PlannerTaskDto toTaskDto(PlannerTask task) {
        return new PlannerTaskDto(
                task.getId(),
                task.getWeekNumber(),
                task.getCategory(),
                task.getTitle(),
                task.getDescription(),
                task.getExpectedOutputs(),
                task.getVerificationCriteria(),
                task.getEstimatedHours(),
                task.getDifficulty(),
                task.getStatus(),
                task.getSortOrder()
        );
    }

    // ===== 상태값 검증: 프론트에서 들어온 과제 상태를 허용된 값으로 정리 =====

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (STATUS_TODO.equals(normalized) || STATUS_IN_PROGRESS.equals(normalized) || STATUS_DONE.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported planner task status: " + status);
    }

    // ===== 통계 계산: 완료율, 상태별 개수, 다음 액션 계산 =====

    private TaskProgress calculateTaskProgress(List<PlannerTaskDto> tasks) {
        int totalTaskCount = tasks.size();
        int completedTaskCount = countTasksByStatus(tasks, STATUS_DONE);
        int inProgressTaskCount = countTasksByStatus(tasks, STATUS_IN_PROGRESS);
        int completionRate = calculateCompletionRate(completedTaskCount, totalTaskCount);
        return new TaskProgress(totalTaskCount, completedTaskCount, inProgressTaskCount, completionRate);
    }

    // 생성된 과제를 화면에 보여줄 순서대로 저장하기 위한 번호를 붙입니다.
    private void assignSortOrder(List<PlannerTask> tasks) {
        for (int index = 0; index < tasks.size(); index++) {
            tasks.get(index).setSortOrder(index + 1);
        }
    }

    // 완료/진행 중 과제 수처럼 상태별 통계를 계산할 때 사용합니다.
    private int countTasksByStatus(List<PlannerTaskDto> tasks, String status) {
        return (int) tasks.stream()
                .filter(task -> status.equals(task.status()))
                .count();
    }

    // 완료 과제 수와 전체 과제 수를 기준으로 로드맵 완료율을 계산합니다.
    private int calculateCompletionRate(int completedTaskCount, int totalTaskCount) {
        if (totalTaskCount == 0) {
            return 0;
        }
        return (int) Math.round(completedTaskCount * 100.0 / totalTaskCount);
    }

    // 아직 완료되지 않은 과제 중 가장 먼저 해야 할 과제를 다음 액션으로 보여줍니다.
    private String findNextAction(List<PlannerTaskDto> tasks) {
        return tasks.stream()
                .filter(task -> !STATUS_DONE.equals(task.status()))
                .sorted(Comparator.comparing(PlannerTaskDto::weekNumber, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(PlannerTaskDto::sortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(task -> task.weekNumber() + "주차: " + task.title())
                .findFirst()
                .orElse(ALL_TASKS_DONE_MESSAGE);
    }

    private record TaskProgress(
            int totalTaskCount,
            int completedTaskCount,
            int inProgressTaskCount,
            int completionRate
    ) {
    }
}
