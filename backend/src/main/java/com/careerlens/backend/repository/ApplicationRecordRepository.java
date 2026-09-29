package com.careerlens.backend.repository;

import com.careerlens.backend.entity.ApplicationRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRecordRepository extends JpaRepository<ApplicationRecord, Long> {

    @EntityGraph(attributePaths = {"user", "jobPosting", "plannerRoadmap"})
    List<ApplicationRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "jobPosting", "plannerRoadmap"})
    Optional<ApplicationRecord> findByPlannerRoadmapId(Long roadmapId);

    @EntityGraph(attributePaths = {"user", "jobPosting", "plannerRoadmap"})
    @Query("select record from ApplicationRecord record where record.id = :id")
    Optional<ApplicationRecord> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user", "jobPosting", "plannerRoadmap"})
    Optional<ApplicationRecord> findByUserIdAndJobPostingId(Long userId, Long jobPostingId);

    void deleteByPlannerRoadmapId(Long roadmapId);
}
