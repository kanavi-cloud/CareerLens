package com.careerlens.backend.repository;

import com.careerlens.backend.entity.DiagnosisResult;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiagnosisResultRepository extends JpaRepository<DiagnosisResult, Long> {

    @EntityGraph(attributePaths = {"jobPosting", "patternProfile"})
    List<DiagnosisResult> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "jobPosting", "patternProfile", "missingItems"})
    Optional<DiagnosisResult> findWithDetailsById(Long id);

}
