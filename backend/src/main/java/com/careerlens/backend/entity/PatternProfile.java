package com.careerlens.backend.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pattern_profiles")
public class PatternProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patternRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_sample_id")
    private EmployeeProfileSample employeeProfileSample;

    private String patternTitle;
    private String jobFamily;
    private Integer targetExperienceYears;
    private String languageBenchmark;
    private String educationBenchmark;
    private Boolean githubExpected;
    private Boolean portfolioExpected;

    @Column(length = 1000)
    private String projectExperienceBenchmark;

    @Column(length = 1000)
    private String evidenceSummary;

    @ElementCollection
    @CollectionTable(name = "pattern_core_skills", joinColumns = @JoinColumn(name = "pattern_id"))
    @Column(name = "skill")
    private List<String> coreSkills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pattern_preferred_skills", joinColumns = @JoinColumn(name = "pattern_id"))
    @Column(name = "skill")
    private List<String> preferredSkills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "pattern_certifications", joinColumns = @JoinColumn(name = "pattern_id"))
    @Column(name = "certification")
    private List<String> certifications = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getPatternRef() {
        return patternRef;
    }

    public void setPatternRef(String patternRef) {
        this.patternRef = patternRef;
    }

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public void setJobPosting(JobPosting jobPosting) {
        this.jobPosting = jobPosting;
    }

    public EmployeeProfileSample getEmployeeProfileSample() {
        return employeeProfileSample;
    }

    public void setEmployeeProfileSample(EmployeeProfileSample employeeProfileSample) {
        this.employeeProfileSample = employeeProfileSample;
    }

    public String getPatternTitle() {
        return patternTitle;
    }

    public void setPatternTitle(String patternTitle) {
        this.patternTitle = patternTitle;
    }

    public String getJobFamily() {
        return jobFamily;
    }

    public void setJobFamily(String jobFamily) {
        this.jobFamily = jobFamily;
    }

    public Integer getTargetExperienceYears() {
        return targetExperienceYears;
    }

    public void setTargetExperienceYears(Integer targetExperienceYears) {
        this.targetExperienceYears = targetExperienceYears;
    }

    public String getLanguageBenchmark() {
        return languageBenchmark;
    }

    public void setLanguageBenchmark(String languageBenchmark) {
        this.languageBenchmark = languageBenchmark;
    }

    public String getEducationBenchmark() {
        return educationBenchmark;
    }

    public void setEducationBenchmark(String educationBenchmark) {
        this.educationBenchmark = educationBenchmark;
    }

    public Boolean getGithubExpected() {
        return githubExpected;
    }

    public void setGithubExpected(Boolean githubExpected) {
        this.githubExpected = githubExpected;
    }

    public Boolean getPortfolioExpected() {
        return portfolioExpected;
    }

    public void setPortfolioExpected(Boolean portfolioExpected) {
        this.portfolioExpected = portfolioExpected;
    }

    public String getProjectExperienceBenchmark() {
        return projectExperienceBenchmark;
    }

    public void setProjectExperienceBenchmark(String projectExperienceBenchmark) {
        this.projectExperienceBenchmark = projectExperienceBenchmark;
    }

    public String getEvidenceSummary() {
        return evidenceSummary;
    }

    public void setEvidenceSummary(String evidenceSummary) {
        this.evidenceSummary = evidenceSummary;
    }

    public List<String> getCoreSkills() {
        return coreSkills;
    }

    public void setCoreSkills(List<String> coreSkills) {
        this.coreSkills = mutableList(coreSkills);
    }

    public List<String> getPreferredSkills() {
        return preferredSkills;
    }

    public void setPreferredSkills(List<String> preferredSkills) {
        this.preferredSkills = mutableList(preferredSkills);
    }

    public List<String> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<String> certifications) {
        this.certifications = mutableList(certifications);
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
