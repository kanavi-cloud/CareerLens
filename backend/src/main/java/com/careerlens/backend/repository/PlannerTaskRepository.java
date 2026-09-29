package com.careerlens.backend.repository;

import com.careerlens.backend.entity.PlannerTask;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlannerTaskRepository extends JpaRepository<PlannerTask, Long> {

    List<PlannerTask> findByRoadmapIdOrderBySortOrderAsc(Long roadmapId);

    void deleteByRoadmapId(Long roadmapId);
}
