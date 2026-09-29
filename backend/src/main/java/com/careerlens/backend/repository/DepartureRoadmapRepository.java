package com.careerlens.backend.repository;

import com.careerlens.backend.entity.DepartureRoadmap;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartureRoadmapRepository extends JpaRepository<DepartureRoadmap, Long> {

    Optional<DepartureRoadmap> findByPlannerRoadmapId(Long plannerRoadmapId);
}
