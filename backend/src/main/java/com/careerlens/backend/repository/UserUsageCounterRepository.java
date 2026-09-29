package com.careerlens.backend.repository;

import com.careerlens.backend.entity.UserUsageCounter;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserUsageCounterRepository extends JpaRepository<UserUsageCounter, Long> {
    Optional<UserUsageCounter> findByUserIdAndPeriodMonth(Long userId, String periodMonth);
}
