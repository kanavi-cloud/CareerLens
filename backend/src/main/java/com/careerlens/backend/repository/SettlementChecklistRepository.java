package com.careerlens.backend.repository;

import com.careerlens.backend.entity.SettlementChecklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SettlementChecklistRepository extends JpaRepository<SettlementChecklist, Long> {

    List<SettlementChecklist> findByUserIdOrderByCountryAscSortOrderAsc(Long userId);

    boolean existsByUserId(Long userId);
}
