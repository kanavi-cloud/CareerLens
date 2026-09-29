package com.careerlens.backend.repository;

import com.careerlens.backend.entity.JobPosting;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    Optional<JobPosting> findByExternalRef(String externalRef);

    List<JobPosting> findByCountryIgnoreCaseAndJobFamilyIgnoreCase(String country, String jobFamily);

    List<JobPosting> findAllByOrderByCountryAscJobFamilyAscCompanyNameAscJobTitleAsc();
}
