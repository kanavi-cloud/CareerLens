package com.careerlens.backend.service;

import com.careerlens.backend.dto.MembershipSummaryDto;
import com.careerlens.backend.entity.PaymentOrder;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserMembership;
import com.careerlens.backend.entity.UserUsageCounter;
import com.careerlens.backend.exception.QuotaExceededException;
import com.careerlens.backend.repository.UserMembershipRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.repository.UserUsageCounterRepository;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MembershipService {

    private static final String PLAN_FREE = "FREE";
    private static final String PLAN_PRO = "PRO";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_EXPIRED = "EXPIRED";
    private static final String PRICE_LABEL = "4,900원 / 30일";

    private static final int FREE_ROADMAP_LIMIT = 2;
    private static final int FREE_AI_DOCUMENT_LIMIT = 5;
    private static final int PRO_ROADMAP_LIMIT = 30;
    private static final int PRO_AI_DOCUMENT_LIMIT = 100;

    private final UserRepository userRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final UserUsageCounterRepository userUsageCounterRepository;

    public MembershipService(
            UserRepository userRepository,
            UserMembershipRepository userMembershipRepository,
            UserUsageCounterRepository userUsageCounterRepository
    ) {
        this.userRepository = userRepository;
        this.userMembershipRepository = userMembershipRepository;
        this.userUsageCounterRepository = userUsageCounterRepository;
    }

    @Transactional
    public MembershipSummaryDto getSummary(Long userId) {
        User user = findUser(userId);
        UsagePolicy policy = policyFor(userId, LocalDateTime.now());
        UserUsageCounter counter = findOrCreateCounter(user, currentPeriodMonth(), false);
        return toSummary(userId, policy, counter);
    }

    @Transactional
    public void activatePro(User user, PaymentOrder order) {
        LocalDateTime now = LocalDateTime.now();
        UserMembership membership = userMembershipRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserMembership created = new UserMembership();
            created.setUser(user);
            created.setCreatedAt(now);
            return created;
        });

        LocalDateTime startsAt = now;
        if (isActivePro(membership, now) && membership.getExpiresAt() != null && membership.getExpiresAt().isAfter(now)) {
            startsAt = membership.getExpiresAt();
        }

        membership.setPlan(PLAN_PRO);
        membership.setStatus(STATUS_ACTIVE);
        membership.setStartedAt(now);
        membership.setExpiresAt(startsAt.plusDays(30));
        membership.setLastPaymentOrderId(order.getId());
        membership.setUpdatedAt(now);
        userMembershipRepository.save(membership);
    }

    @Transactional
    public void assertCanCreateRoadmap(Long userId) {
        User user = findUser(userId);
        UsagePolicy policy = policyFor(userId, LocalDateTime.now());
        UserUsageCounter counter = findOrCreateCounter(user, currentPeriodMonth(), true);
        if (count(counter.getRoadmapCreatedCount()) >= policy.roadmapLimit()) {
            throw new QuotaExceededException(limitMessage("커리어 플래너 생성", policy.roadmapLimit()));
        }
    }

    @Transactional
    public void recordRoadmapCreated(Long userId) {
        User user = findUser(userId);
        UserUsageCounter counter = findOrCreateCounter(user, currentPeriodMonth(), true);
        counter.setRoadmapCreatedCount(count(counter.getRoadmapCreatedCount()) + 1);
        counter.setUpdatedAt(LocalDateTime.now());
        userUsageCounterRepository.save(counter);
    }

    @Transactional
    public void assertCanAnalyzeDocument(Long userId) {
        User user = findUser(userId);
        UsagePolicy policy = policyFor(userId, LocalDateTime.now());
        UserUsageCounter counter = findOrCreateCounter(user, currentPeriodMonth(), true);
        if (count(counter.getAiDocumentAnalysisCount()) >= policy.aiDocumentAnalysisLimit()) {
            throw new QuotaExceededException(limitMessage("AI 문서 분석", policy.aiDocumentAnalysisLimit()));
        }
    }

    @Transactional
    public void recordDocumentAnalysis(Long userId) {
        User user = findUser(userId);
        UserUsageCounter counter = findOrCreateCounter(user, currentPeriodMonth(), true);
        counter.setAiDocumentAnalysisCount(count(counter.getAiDocumentAnalysisCount()) + 1);
        counter.setUpdatedAt(LocalDateTime.now());
        userUsageCounterRepository.save(counter);
    }

    private MembershipSummaryDto toSummary(Long userId, UsagePolicy policy, UserUsageCounter counter) {
        int roadmapUsed = count(counter.getRoadmapCreatedCount());
        int aiUsed = count(counter.getAiDocumentAnalysisCount());
        return new MembershipSummaryDto(
                userId,
                policy.plan(),
                PLAN_PRO.equals(policy.plan()),
                policy.proExpiresAt(),
                counter.getPeriodMonth(),
                policy.roadmapLimit(),
                roadmapUsed,
                Math.max(0, policy.roadmapLimit() - roadmapUsed),
                policy.aiDocumentAnalysisLimit(),
                aiUsed,
                Math.max(0, policy.aiDocumentAnalysisLimit() - aiUsed),
                PRICE_LABEL
        );
    }

    private UsagePolicy policyFor(Long userId, LocalDateTime now) {
        Optional<UserMembership> optionalMembership = userMembershipRepository.findByUserId(userId);
        if (optionalMembership.isPresent() && isActivePro(optionalMembership.get(), now)) {
            UserMembership membership = optionalMembership.get();
            return new UsagePolicy(PLAN_PRO, PRO_ROADMAP_LIMIT, PRO_AI_DOCUMENT_LIMIT, membership.getExpiresAt());
        }
        optionalMembership.ifPresent(membership -> markExpiredIfNeeded(membership, now));
        return new UsagePolicy(PLAN_FREE, FREE_ROADMAP_LIMIT, FREE_AI_DOCUMENT_LIMIT, null);
    }

    private void markExpiredIfNeeded(UserMembership membership, LocalDateTime now) {
        if (membership.getExpiresAt() != null && !membership.getExpiresAt().isAfter(now) && !STATUS_EXPIRED.equals(membership.getStatus())) {
            membership.setStatus(STATUS_EXPIRED);
            membership.setUpdatedAt(now);
            userMembershipRepository.save(membership);
        }
    }

    private boolean isActivePro(UserMembership membership, LocalDateTime now) {
        return PLAN_PRO.equals(membership.getPlan())
                && STATUS_ACTIVE.equals(membership.getStatus())
                && membership.getExpiresAt() != null
                && membership.getExpiresAt().isAfter(now);
    }

    private UserUsageCounter findOrCreateCounter(User user, String periodMonth, boolean persistIfMissing) {
        Optional<UserUsageCounter> optionalCounter = userUsageCounterRepository.findByUserIdAndPeriodMonth(user.getId(), periodMonth);
        if (optionalCounter.isPresent()) {
            return optionalCounter.get();
        }
        UserUsageCounter counter = new UserUsageCounter();
        counter.setUser(user);
        counter.setPeriodMonth(periodMonth);
        counter.setRoadmapCreatedCount(0);
        counter.setAiDocumentAnalysisCount(0);
        counter.setCreatedAt(LocalDateTime.now());
        counter.setUpdatedAt(LocalDateTime.now());
        return persistIfMissing ? userUsageCounterRepository.save(counter) : counter;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private String currentPeriodMonth() {
        return YearMonth.now().toString();
    }

    private int count(Integer value) {
        return value == null ? 0 : value;
    }

    private String limitMessage(String featureName, int limit) {
        return "무료 플랜의 " + featureName + " 월 " + limit + "회 한도를 모두 사용했습니다. Pro 멤버십으로 업그레이드하면 더 많이 이용할 수 있습니다.";
    }

    private record UsagePolicy(
            String plan,
            int roadmapLimit,
            int aiDocumentAnalysisLimit,
            LocalDateTime proExpiresAt
    ) {
    }
}
