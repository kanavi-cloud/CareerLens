package com.careerlens.backend.repository;

import com.careerlens.backend.entity.VerificationRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    List<VerificationRequest> findByPlannerTaskIdOrderByRequestedAtDesc(Long plannerTaskId);

    List<VerificationRequest> findByPlannerTaskIdIn(List<Long> plannerTaskIds);

    @Modifying
    @Query("delete from VerificationRequest request where request.plannerTask.roadmap.id = :roadmapId")
    void deleteByPlannerTaskRoadmapId(@Param("roadmapId") Long roadmapId);
}
