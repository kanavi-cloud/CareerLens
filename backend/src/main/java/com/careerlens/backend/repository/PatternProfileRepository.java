package com.careerlens.backend.repository;

import com.careerlens.backend.entity.PatternProfile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatternProfileRepository extends JpaRepository<PatternProfile, Long> {

    Optional<PatternProfile> findByPatternRef(String patternRef);

    @EntityGraph(attributePaths = {"jobPosting", "employeeProfileSample"})
    List<PatternProfile> findByJobPostingId(Long jobPostingId);
}
