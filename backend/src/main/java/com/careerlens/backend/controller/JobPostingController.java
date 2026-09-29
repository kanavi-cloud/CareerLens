package com.careerlens.backend.controller;

import com.careerlens.backend.dto.JobPostingDto;
import com.careerlens.backend.service.JobPostingService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    public JobPostingController(JobPostingService jobPostingService) {
        this.jobPostingService = jobPostingService;
    }

    @GetMapping
    public List<JobPostingDto> getAllJobs() {
        return jobPostingService.getAllJobs();
    }
}
