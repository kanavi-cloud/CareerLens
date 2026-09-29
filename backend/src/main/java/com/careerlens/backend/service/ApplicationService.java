package com.careerlens.backend.service;

import com.careerlens.backend.dto.ApplicationDocumentStatusDto;
import com.careerlens.backend.dto.ApplicationRecordDto;
import com.careerlens.backend.dto.ApplicationWorkspaceUpdateRequestDto;
import com.careerlens.backend.entity.ApplicationRecord;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PlannerRoadmap;
import com.careerlens.backend.entity.PlannerTask;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.VerificationRequest;
import com.careerlens.backend.repository.ApplicationRecordRepository;
import com.careerlens.backend.repository.JobPostingRepository;
import com.careerlens.backend.repository.PlannerRoadmapRepository;
import com.careerlens.backend.repository.PlannerTaskRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.repository.VerificationRequestRepository;
import com.careerlens.backend.security.AccessGuard;
import com.careerlens.backend.security.JwtClaims;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {

    private static final String STATUS_INTERESTED = "INTERESTED";
    private static final String STATUS_PREPARING_DOCUMENTS = "PREPARING_DOCUMENTS";
    private static final String STATUS_APPLIED = "APPLIED";
    private static final String STATUS_INTERVIEW = "INTERVIEW";
    private static final String STATUS_CLOSED = "CLOSED";

    private final ApplicationRecordRepository applicationRecordRepository;
    private final PlannerRoadmapRepository plannerRoadmapRepository;
    private final PlannerTaskRepository plannerTaskRepository;
    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;

    public ApplicationService(
            ApplicationRecordRepository applicationRecordRepository,
            PlannerRoadmapRepository plannerRoadmapRepository,
            PlannerTaskRepository plannerTaskRepository,
            VerificationRequestRepository verificationRequestRepository,
            UserRepository userRepository,
            JobPostingRepository jobPostingRepository
    ) {
        this.applicationRecordRepository = applicationRecordRepository;
        this.plannerRoadmapRepository = plannerRoadmapRepository;
        this.plannerTaskRepository = plannerTaskRepository;
        this.verificationRequestRepository = verificationRequestRepository;
        this.userRepository = userRepository;
        this.jobPostingRepository = jobPostingRepository;
    }

    @Transactional(readOnly = true)
    public List<ApplicationRecordDto> getUserApplications(Long userId) {
        return applicationRecordRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    @Transactional(readOnly = true)
    public ApplicationRecordDto getApplication(Long applicationId) {
        return getApplication(applicationId, null);
    }

    @Transactional(readOnly = true)
    public ApplicationRecordDto getApplication(Long applicationId, JwtClaims claims) {
        return applicationRecordRepository.findWithDetailsById(applicationId)
                .map(record -> verifyOwner(record, claims))
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Application record not found: " + applicationId));
    }

    @Transactional
    public ApplicationRecordDto createFromRoadmap(Long roadmapId) {
        return createFromRoadmap(roadmapId, null);
    }

    @Transactional
    public ApplicationRecordDto createFromRoadmap(Long roadmapId, JwtClaims claims) {
        ApplicationRecord existing = applicationRecordRepository.findByPlannerRoadmapId(roadmapId).orElse(null);
        if (existing != null) {
            verifyOwner(existing, claims);
            return toDto(existing);
        }

        PlannerRoadmap roadmap = plannerRoadmapRepository.findWithDetailsById(roadmapId)
                .orElseThrow(() -> new IllegalArgumentException("Planner roadmap not found: " + roadmapId));
        verifyRoadmapOwner(roadmap, claims);
        if (roadmap.getDiagnosisResult() == null || roadmap.getDiagnosisResult().getJobPosting() == null) {
            throw new IllegalArgumentException("Planner roadmap is not connected to a diagnosis result.");
        }

        JobPosting job = roadmap.getDiagnosisResult().getJobPosting();
        LocalDateTime now = LocalDateTime.now();

        ApplicationRecord record = new ApplicationRecord();
        record.setUser(roadmap.getUser());
        record.setJobPosting(job);
        record.setPlannerRoadmap(roadmap);
        record.setStatus(STATUS_PREPARING_DOCUMENTS);
        record.setNextAction(nextActionFor(STATUS_PREPARING_DOCUMENTS, job));
        record.setRequiredDocuments(requiredDocumentsFor(job));
        record.setCandidateNotes("");
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        record.setLastActivityAt(now);
        return toDto(applicationRecordRepository.save(record));
    }

    @Transactional
    public ApplicationRecordDto createFromJob(Long userId, Long jobId) {
        ApplicationRecord existing = applicationRecordRepository.findByUserIdAndJobPostingId(userId, jobId).orElse(null);
        if (existing != null) {
            return toDto(existing);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found: " + jobId));
        LocalDateTime now = LocalDateTime.now();

        ApplicationRecord record = new ApplicationRecord();
        record.setUser(user);
        record.setJobPosting(job);
        record.setStatus(STATUS_INTERESTED);
        record.setNextAction(nextActionFor(STATUS_INTERESTED, job));
        record.setRequiredDocuments(requiredDocumentsFor(job));
        record.setCandidateNotes("");
        record.setCreatedAt(now);
        record.setUpdatedAt(now);
        record.setLastActivityAt(now);
        return toDto(applicationRecordRepository.save(record));
    }

    @Transactional
    public ApplicationRecordDto updateStatus(Long applicationId, String status) {
        return updateStatus(applicationId, status, null);
    }

    @Transactional
    public ApplicationRecordDto updateStatus(Long applicationId, String status, JwtClaims claims) {
        ApplicationRecord record = applicationRecordRepository.findWithDetailsById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application record not found: " + applicationId));
        verifyOwner(record, claims);
        String normalizedStatus = normalizeStatus(status);
        record.setStatus(normalizedStatus);
        record.setNextAction(nextActionFor(normalizedStatus, record.getJobPosting()));
        record.setUpdatedAt(LocalDateTime.now());
        record.setLastActivityAt(LocalDateTime.now());
        return toDto(applicationRecordRepository.save(record));
    }

    @Transactional
    public ApplicationRecordDto updateWorkspace(Long applicationId, ApplicationWorkspaceUpdateRequestDto request) {
        return updateWorkspace(applicationId, request, null);
    }

    @Transactional
    public ApplicationRecordDto updateWorkspace(Long applicationId, ApplicationWorkspaceUpdateRequestDto request, JwtClaims claims) {
        ApplicationRecord record = applicationRecordRepository.findWithDetailsById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application record not found: " + applicationId));
        verifyOwner(record, claims);
        if (request.candidateNotes() != null) {
            record.setCandidateNotes(trimToLength(request.candidateNotes(), 2000));
        }
        if (request.nextAction() != null && !request.nextAction().isBlank()) {
            record.setNextAction(trimToLength(request.nextAction(), 1000));
        }
        record.setUpdatedAt(LocalDateTime.now());
        record.setLastActivityAt(LocalDateTime.now());
        return toDto(applicationRecordRepository.save(record));
    }

    private ApplicationRecord verifyOwner(ApplicationRecord record, JwtClaims claims) {
        if (claims != null) {
            Long ownerUserId = record.getUser() == null ? null : record.getUser().getId();
            AccessGuard.requireUserOrAdmin(claims, ownerUserId);
        }
        return record;
    }

    private void verifyRoadmapOwner(PlannerRoadmap roadmap, JwtClaims claims) {
        if (claims != null) {
            Long ownerUserId = roadmap.getUser() == null ? null : roadmap.getUser().getId();
            AccessGuard.requireUserOrAdmin(claims, ownerUserId);
        }
    }

    private ApplicationRecordDto toDto(ApplicationRecord record) {
        JobPosting job = record.getJobPosting();
        Long roadmapId = record.getPlannerRoadmap() == null ? null : record.getPlannerRoadmap().getId();
        List<PlannerTask> tasks = roadmapId == null
                ? new ArrayList<>()
                : plannerTaskRepository.findByRoadmapIdOrderBySortOrderAsc(roadmapId);
        List<Long> taskIds = tasks.stream()
                .map(PlannerTask::getId)
                .collect(Collectors.toCollection(ArrayList::new));
        List<VerificationRequest> verifications = taskIds.isEmpty()
                ? new ArrayList<>()
                : verificationRequestRepository.findByPlannerTaskIdIn(taskIds);
        Map<Long, List<VerificationRequest>> verificationsByTaskId = verifications.stream()
                .filter(request -> request.getPlannerTask() != null)
                .collect(Collectors.groupingBy(request -> request.getPlannerTask().getId()));

        int totalTaskCount = tasks.size();
        int completedTaskCount = (int) tasks.stream().filter(this::isDone).count();
        int verifiedTaskCount = (int) tasks.stream()
                .filter(task -> hasPassingVerification(verificationsByTaskId.get(task.getId())))
                .count();
        int completionRate = totalTaskCount == 0 ? 0 : Math.round((completedTaskCount * 100.0f) / totalTaskCount);
        int verificationRate = totalTaskCount == 0 ? 0 : Math.round((verifiedTaskCount * 100.0f) / totalTaskCount);
        int matchScore = record.getPlannerRoadmap() == null || record.getPlannerRoadmap().getTotalScore() == null
                ? 0
                : record.getPlannerRoadmap().getTotalScore();
        int readinessScore = Math.min(100, Math.round(matchScore * 0.55f + completionRate * 0.30f + verificationRate * 0.15f));
        if (record.getPlannerRoadmap() == null) {
            readinessScore = readinessFromJobOnly(job);
        }

        LocalDate deadline = job.getApplicationDeadline();
        Long daysUntilDeadline = deadline == null ? null : ChronoUnit.DAYS.between(LocalDate.now(), deadline);

        return new ApplicationRecordDto(
                record.getId(),
                record.getUser().getId(),
                job.getId(),
                roadmapId,
                job.getCompanyName(),
                job.getCountry(),
                job.getJobTitle(),
                job.getJobFamily(),
                job.getExternalRef(),
                applicationUrlFor(job),
                job.getSalaryRange(),
                job.getWorkType(),
                record.getStatus(),
                record.getNextAction(),
                record.getCandidateNotes(),
                new ArrayList<>(record.getRequiredDocuments()),
                companyBrief(job),
                workspaceFocusItems(record, job, completionRate, verificationRate),
                riskNotes(job, daysUntilDeadline, completionRate, verificationRate),
                deadline,
                daysUntilDeadline,
                deadlineStatus(daysUntilDeadline),
                readinessScore,
                completionRate,
                completedTaskCount,
                totalTaskCount,
                verifiedTaskCount,
                documentChecklistFor(record, job, tasks, verifications),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.getLastActivityAt()
        );
    }

    private List<String> requiredDocumentsFor(JobPosting job) {
        List<String> documents = new ArrayList<>();
        documents.add("영문 이력서");
        documents.add("지원 동기 또는 커버레터 초안");
        if (Boolean.TRUE.equals(job.getPortfolioRequired())) {
            documents.add("포트폴리오");
        }
        documents.add("GitHub/프로젝트 링크");
        documents.add("학력 및 자격 증빙");
        documents.add("비자/근무 자격 확인 메모");
        return documents;
    }

    private List<ApplicationDocumentStatusDto> documentChecklistFor(
            ApplicationRecord record,
            JobPosting job,
            List<PlannerTask> tasks,
            List<VerificationRequest> verifications
    ) {
        List<ApplicationDocumentStatusDto> checklist = new ArrayList<>();
        checklist.add(new ApplicationDocumentStatusDto(
                "resume",
                "영문 이력서",
                taskOrVerificationStatus(tasks, verifications, "이력서", "resume"),
                "공고 요구 기술과 프로젝트 성과가 문제-행동-결과 구조로 정리되어야 합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "cover_letter",
                "지원 동기/커버레터",
                taskOrVerificationStatus(tasks, verifications, "커버레터", "cover"),
                "회사와 직무를 연결하는 지원 메시지를 5문장 이내로 정리합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "portfolio",
                Boolean.TRUE.equals(job.getPortfolioRequired()) ? "포트폴리오 필수" : "포트폴리오/프로젝트 링크",
                taskOrVerificationStatus(tasks, verifications, "포트폴리오", "portfolio"),
                Boolean.TRUE.equals(job.getPortfolioRequired())
                        ? "이 공고는 포트폴리오 제출 가능성이 높으므로 산출물 검증을 권장합니다."
                        : "프로젝트 근거가 있으면 추천 점수와 면접 준비에 유리합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "github",
                "GitHub 저장소",
                githubVerificationStatus(verifications),
                "실제 프로젝트 repository URL로 README, 구조, 기술 근거를 검증합니다."
        ));
        checklist.add(new ApplicationDocumentStatusDto(
                "eligibility",
                "학력/언어/비자 증빙",
                STATUS_APPLIED.equals(record.getStatus()) || STATUS_INTERVIEW.equals(record.getStatus()) ? "DONE" : "TODO",
                "학위, 언어 수준, 자격증, 비자 스폰서십 메모를 지원 패키지에 정리합니다."
        ));
        return checklist;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (STATUS_INTERESTED.equals(normalized)
                || STATUS_PREPARING_DOCUMENTS.equals(normalized)
                || STATUS_APPLIED.equals(normalized)
                || STATUS_INTERVIEW.equals(normalized)
                || STATUS_CLOSED.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("Unsupported application status: " + status);
    }

    private String nextActionFor(String status, JobPosting job) {
        String baseAction = switch (status) {
            case STATUS_INTERESTED -> "공고 원문과 추천 근거를 확인하고 지원 우선순위를 결정하세요.";
            case STATUS_PREPARING_DOCUMENTS -> "영문 이력서, 포트폴리오, GitHub 링크를 공고 요구사항에 맞게 정리하세요.";
            case STATUS_APPLIED -> "지원 완료일과 채용 담당자 응답 여부를 기록하고 면접 예상 질문을 준비하세요.";
            case STATUS_INTERVIEW -> "직무 경험, 프로젝트 근거, 비자 가능 여부를 면접 답변으로 정리하세요.";
            case STATUS_CLOSED -> "지원 결과와 보완점을 기록하고 다음 추천 공고에 반영하세요.";
            default -> "다음 지원 액션을 정리하세요.";
        };
        if (job == null || job.getApplicationDeadline() == null || STATUS_CLOSED.equals(status)) {
            return baseAction;
        }
        long days = ChronoUnit.DAYS.between(LocalDate.now(), job.getApplicationDeadline());
        if (days < 0) {
            return "공고 마감일이 지났습니다. 지원 결과와 보완점을 기록하고 다음 추천 공고로 전환하세요.";
        }
        if (days <= 7 && !STATUS_APPLIED.equals(status) && !STATUS_INTERVIEW.equals(status)) {
            return "마감까지 " + days + "일 남았습니다. 필수 서류와 포트폴리오 링크를 먼저 완성하고 지원 여부를 결정하세요.";
        }
        return baseAction;
    }

    private List<String> workspaceFocusItems(ApplicationRecord record, JobPosting job, int completionRate, int verificationRate) {
        List<String> items = new ArrayList<>();
        if (record.getPlannerRoadmap() == null) {
            items.add("추천 진단 또는 전체 공고에서 만든 지원 기록입니다. 필요하면 커리어 플래너를 먼저 생성하세요.");
        } else if (completionRate < 60) {
            items.add("커리어 플래너 과제 완료율이 낮습니다. 핵심 부족 요소 과제를 먼저 마무리하세요.");
        } else {
            items.add("커리어 플래너 과제가 진행 중입니다. 완료 과제를 지원 서류 근거로 전환하세요.");
        }
        if (verificationRate < 50) {
            items.add("AI 문서 분석 또는 GitHub 검증을 통해 제출 근거를 보강하세요.");
        }
        if (Boolean.TRUE.equals(job.getPortfolioRequired())) {
            items.add("포트폴리오 요구 가능성이 높습니다. 대표 프로젝트와 산출물 링크를 우선 정리하세요.");
        }
        if (blank(job.getVisaRequirement()) || containsIgnoreCase(job.getVisaRequirement(), "not specified")) {
            items.add("비자 조건이 명확하지 않습니다. 원문 공고와 Apply 페이지에서 근무 자격 문구를 확인하세요.");
        }
        return items;
    }

    private List<String> riskNotes(JobPosting job, Long daysUntilDeadline, int completionRate, int verificationRate) {
        List<String> risks = new ArrayList<>();
        if (daysUntilDeadline != null && daysUntilDeadline < 0) {
            risks.add("마감일이 지난 공고입니다.");
        } else if (daysUntilDeadline != null && daysUntilDeadline <= 7) {
            risks.add("마감이 임박했습니다. 서류 검토보다 제출 가능 여부 판단이 우선입니다.");
        }
        if (blank(job.getSalaryRange()) || containsIgnoreCase(job.getSalaryRange(), "not disclosed")) {
            risks.add("연봉 정보가 공고에 명확히 공개되지 않았습니다.");
        }
        if (completionRate < 50) {
            risks.add("로드맵 과제 완료율이 낮아 지원 근거가 약할 수 있습니다.");
        }
        if (verificationRate == 0) {
            risks.add("AI 문서 분석 또는 GitHub 검증 기록이 아직 없습니다.");
        }
        return risks;
    }

    private String companyBrief(JobPosting job) {
        String company = valueOrDefault(job.getCompanyName(), "해당 기업");
        String title = valueOrDefault(job.getJobTitle(), "해당 포지션");
        String country = valueOrDefault(job.getCountry(), "국가 미기재");
        String family = valueOrDefault(job.getJobFamily(), "직무");
        String skills = firstSkills(job.getRequiredSkills());
        return company + "의 " + title + " 공고입니다. " + country + " 기준 " + family
                + " 직무로 분류되며, 지원 준비 시 " + skills + " 역량을 우선 확인해야 합니다.";
    }

    private String applicationUrlFor(JobPosting job) {
        String externalRef = job.getExternalRef();
        if (externalRef == null || !externalRef.startsWith("greenhouse:")) {
            return null;
        }
        String[] parts = externalRef.split(":");
        if (parts.length < 3 || parts[1].isBlank() || parts[2].isBlank()) {
            return null;
        }
        return "https://boards.greenhouse.io/" + parts[1] + "/jobs/" + parts[2];
    }

    private int readinessFromJobOnly(JobPosting job) {
        int score = 50;
        if (!blank(job.getSalaryRange()) && !containsIgnoreCase(job.getSalaryRange(), "not disclosed")) {
            score += 8;
        }
        if (Boolean.TRUE.equals(job.getPortfolioRequired())) {
            score -= 4;
        }
        if (job.getMinExperienceYears() != null && job.getMinExperienceYears() <= 2) {
            score += 8;
        }
        if (job.getApplicationDeadline() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), job.getApplicationDeadline());
            if (days >= 14) {
                score += 6;
            } else if (days >= 0) {
                score -= 6;
            }
        }
        return Math.max(0, Math.min(100, score));
    }

    private boolean isDone(PlannerTask task) {
        String status = task.getStatus() == null ? "" : task.getStatus().trim().toUpperCase(Locale.ROOT);
        return "DONE".equals(status) || "완료".equals(status);
    }

    private boolean hasPassingVerification(List<VerificationRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return false;
        }
        return requests.stream()
                .anyMatch(request -> request.getVerificationScore() != null && request.getVerificationScore() >= 60);
    }

    private String deadlineStatus(Long daysUntilDeadline) {
        if (daysUntilDeadline == null) {
            return "ONGOING";
        }
        if (daysUntilDeadline < 0) {
            return "EXPIRED";
        }
        if (daysUntilDeadline <= 7) {
            return "URGENT";
        }
        if (daysUntilDeadline <= 21) {
            return "SOON";
        }
        return "OPEN";
    }

    private String taskOrVerificationStatus(List<PlannerTask> tasks, List<VerificationRequest> verifications, String koreanKeyword, String requestTypeKeyword) {
        boolean doneTask = tasks.stream()
                .filter(this::isDone)
                .anyMatch(task -> containsIgnoreCase(task.getTitle(), koreanKeyword) || containsIgnoreCase(task.getDescription(), koreanKeyword));
        if (doneTask) {
            return "DONE";
        }
        boolean verified = verifications.stream()
                .filter(request -> request.getVerificationScore() != null && request.getVerificationScore() >= 60)
                .anyMatch(request -> containsIgnoreCase(request.getRequestType(), requestTypeKeyword)
                        || containsIgnoreCase(request.getSubmittedText(), koreanKeyword));
        if (verified) {
            return "VERIFIED";
        }
        return "TODO";
    }

    private String githubVerificationStatus(List<VerificationRequest> verifications) {
        return verifications.stream()
                .filter(request -> request.getVerificationScore() != null && request.getVerificationScore() >= 75)
                .anyMatch(request -> containsIgnoreCase(request.getRequestType(), "github"))
                ? "VERIFIED"
                : "TODO";
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

    private String valueOrDefault(String value, String fallback) {
        return blank(value) ? fallback : value;
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && keyword != null && value.toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT));
    }
}
