package com.careerlens.backend.repository;

import com.careerlens.backend.entity.AdministrationRoadmap;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministrationRoadmapRepository extends JpaRepository<AdministrationRoadmap, Long> {

    Optional<AdministrationRoadmap> findByPlannerRoadmapId(Long plannerRoadmapId);

    void deleteByPlannerRoadmapId(Long plannerRoadmapId);
}
