package com.careerlens.backend.repository;

import com.careerlens.backend.entity.DepartureMilestone;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartureMilestoneRepository extends JpaRepository<DepartureMilestone, Long> {

    List<DepartureMilestone> findByDepartureRoadmapIdOrderBySortOrderAsc(Long departureRoadmapId);

    void deleteByDepartureRoadmapId(Long departureRoadmapId);
}
