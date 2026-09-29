package com.careerlens.backend.repository;

import com.careerlens.backend.entity.PlannerRoadmap;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlannerRoadmapRepository extends JpaRepository<PlannerRoadmap, Long> {

    @EntityGraph(attributePaths = {"user", "diagnosisResult", "diagnosisResult.jobPosting"})
    Optional<PlannerRoadmap> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"user", "diagnosisResult", "diagnosisResult.jobPosting"})
    Optional<PlannerRoadmap> findByDiagnosisResultId(Long diagnosisResultId);

    @EntityGraph(attributePaths = {"user", "diagnosisResult", "diagnosisResult.jobPosting"})
    List<PlannerRoadmap> findByUserIdOrderByCreatedAtDesc(Long userId);
}
