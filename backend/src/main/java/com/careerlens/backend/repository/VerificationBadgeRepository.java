package com.careerlens.backend.repository;

import com.careerlens.backend.entity.VerificationBadge;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationBadgeRepository extends JpaRepository<VerificationBadge, Long> {

    List<VerificationBadge> findByUserIdOrderByIssuedAtDesc(Long userId);

    List<VerificationBadge> findByPlannerTaskIdOrderByIssuedAtDesc(Long plannerTaskId);

    Optional<VerificationBadge> findByVerificationRequestIdAndBadgeType(Long verificationRequestId, String badgeType);

    @Modifying
    @Query("delete from VerificationBadge badge where badge.plannerTask.roadmap.id = :roadmapId")
    void deleteByPlannerTaskRoadmapId(@Param("roadmapId") Long roadmapId);

    @Modifying
    @Query("delete from VerificationBadge badge where badge.verificationRequest.plannerTask.roadmap.id = :roadmapId")
    void deleteByVerificationRequestTaskRoadmapId(@Param("roadmapId") Long roadmapId);
}
