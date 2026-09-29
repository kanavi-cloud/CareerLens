package com.careerlens.backend.service;

import com.careerlens.backend.dto.JobPostingDto;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.repository.JobPostingRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;

    public JobPostingService(JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    @Transactional(readOnly = true)
    public List<JobPostingDto> getAllJobs() {
        return jobPostingRepository.findAllByOrderByCountryAscJobFamilyAscCompanyNameAscJobTitleAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public JobPostingDto toDto(JobPosting job) {
        LocalDate today = LocalDate.now();
        LocalDate deadline = job.getApplicationDeadline();
        Integer daysUntilDeadline = deadline == null ? null : (int) ChronoUnit.DAYS.between(today, deadline);
        return new JobPostingDto(
                job.getId(),
                job.getExternalRef(),
                job.getCompanyName(),
                job.getCountry(),
                job.getJobTitle(),
                job.getJobFamily(),
                mutableList(job.getRequiredSkills()),
                mutableList(job.getPreferredSkills()),
                mutableList(job.getRequiredLanguages()),
                job.getMinExperienceYears(),
                job.getDegreeRequirement(),
                job.getPortfolioRequired(),
                job.getVisaRequirement(),
                job.getSalaryRange(),
                job.getWorkType(),
                deadline,
                deadlineStatus(daysUntilDeadline),
                daysUntilDeadline,
                job.getSalaryScore(),
                job.getWorkLifeBalanceScore(),
                job.getCompanyValueScore(),
                displayRationale(job)
        );
    }

    private String deadlineStatus(Integer daysUntilDeadline) {
        if (daysUntilDeadline == null) {
            return "ROLLING";
        }
        if (daysUntilDeadline < 0) {
            return "CLOSED";
        }
        if (daysUntilDeadline <= 7) {
            return "URGENT";
        }
        if (daysUntilDeadline <= 21) {
            return "CLOSING_SOON";
        }
        return "OPEN";
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }

    private String displayRationale(JobPosting job) {
        String rationale = job.getEvaluationRationale();
        if (rationale != null
                && !rationale.isBlank()
                && !rationale.contains("Greenhouse")
                && !rationale.contains("Job Board API")) {
            return rationale;
        }

        String company = valueOrDefault(job.getCompanyName(), "해당 기업");
        String title = valueOrDefault(job.getJobTitle(), "해당 포지션");
        String country = valueOrDefault(job.getCountry(), "국가 미기재");
        String family = valueOrDefault(job.getJobFamily(), "직무");
        String skills = firstSkills(job.getRequiredSkills());
        return company + "의 " + title + " 공고입니다. " + country + " 기준 " + family
                + " 직무로 분류되며, 핵심 확인 역량은 " + skills
                + "입니다. 공고 원문에서 세부 자격요건과 근무 조건을 함께 확인하는 것을 권장합니다.";
    }

    private String firstSkills(List<String> skills) {
        if (skills == null || skills.isEmpty()) {
            return "공고 본문에서 확인되는 직무 역량";
        }
        List<String> firstSkills = new ArrayList<>();
        for (String skill : skills) {
            if (firstSkills.size() >= 4) {
                break;
            }
            firstSkills.add(skill);
        }
        return String.join(", ", firstSkills);
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
