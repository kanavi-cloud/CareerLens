package com.careerlens.backend.repository;

import com.careerlens.backend.entity.EmployeeProfileSample;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeProfileSampleRepository extends JpaRepository<EmployeeProfileSample, Long> {

    Optional<EmployeeProfileSample> findBySampleRef(String sampleRef);
}
