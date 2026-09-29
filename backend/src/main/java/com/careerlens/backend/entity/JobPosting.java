package com.careerlens.backend.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_postings")
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String externalRef;
    private String companyName;
    private String country;
    private String jobTitle;
    private String jobFamily;
    private Integer minExperienceYears;
    private String degreeRequirement;
    private Boolean portfolioRequired;
    private String visaRequirement;
    private String salaryRange;
    private String workType;
    private LocalDate applicationDeadline;
    private Integer salaryScore;
    private Integer workLifeBalanceScore;
    private Integer companyValueScore;
    private Integer probabilityWeight;
    private Integer salaryWeight;
    private Integer workLifeBalanceWeight;
    private Integer companyValueWeight;
    private Integer jobFitWeight;

    @Column(length = 1000)
    private String evaluationRationale;

    @ElementCollection
    @CollectionTable(name = "job_required_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    private List<String> requiredSkills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "job_preferred_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    private List<String> preferredSkills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "job_required_languages", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "language_requirement")
    private List<String> requiredLanguages = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getExternalRef() {
        return externalRef;
    }

    public void setExternalRef(String externalRef) {
        this.externalRef = externalRef;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getJobFamily() {
        return jobFamily;
    }

    public void setJobFamily(String jobFamily) {
        this.jobFamily = jobFamily;
    }

    public Integer getMinExperienceYears() {
        return minExperienceYears;
    }

    public void setMinExperienceYears(Integer minExperienceYears) {
        this.minExperienceYears = minExperienceYears;
    }

    public String getDegreeRequirement() {
        return degreeRequirement;
    }

    public void setDegreeRequirement(String degreeRequirement) {
        this.degreeRequirement = degreeRequirement;
    }

    public Boolean getPortfolioRequired() {
        return portfolioRequired;
    }

    public void setPortfolioRequired(Boolean portfolioRequired) {
        this.portfolioRequired = portfolioRequired;
    }

    public String getVisaRequirement() {
        return visaRequirement;
    }

    public void setVisaRequirement(String visaRequirement) {
        this.visaRequirement = visaRequirement;
    }

    public String getSalaryRange() {
        return salaryRange;
    }

    public void setSalaryRange(String salaryRange) {
        this.salaryRange = salaryRange;
    }

    public String getWorkType() {
        return workType;
    }

    public void setWorkType(String workType) {
        this.workType = workType;
    }

    public LocalDate getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(LocalDate applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public Integer getSalaryScore() {
        return salaryScore;
    }

    public void setSalaryScore(Integer salaryScore) {
        this.salaryScore = salaryScore;
    }

    public Integer getWorkLifeBalanceScore() {
        return workLifeBalanceScore;
    }

    public void setWorkLifeBalanceScore(Integer workLifeBalanceScore) {
        this.workLifeBalanceScore = workLifeBalanceScore;
    }

    public Integer getCompanyValueScore() {
        return companyValueScore;
    }

    public void setCompanyValueScore(Integer companyValueScore) {
        this.companyValueScore = companyValueScore;
    }

    public Integer getProbabilityWeight() {
        return probabilityWeight;
    }

    public void setProbabilityWeight(Integer probabilityWeight) {
        this.probabilityWeight = probabilityWeight;
    }

    public Integer getSalaryWeight() {
        return salaryWeight;
    }

    public void setSalaryWeight(Integer salaryWeight) {
        this.salaryWeight = salaryWeight;
    }

    public Integer getWorkLifeBalanceWeight() {
        return workLifeBalanceWeight;
    }

    public void setWorkLifeBalanceWeight(Integer workLifeBalanceWeight) {
        this.workLifeBalanceWeight = workLifeBalanceWeight;
    }

    public Integer getCompanyValueWeight() {
        return companyValueWeight;
    }

    public void setCompanyValueWeight(Integer companyValueWeight) {
        this.companyValueWeight = companyValueWeight;
    }

    public Integer getJobFitWeight() {
        return jobFitWeight;
    }

    public void setJobFitWeight(Integer jobFitWeight) {
        this.jobFitWeight = jobFitWeight;
    }

    public String getEvaluationRationale() {
        return evaluationRationale;
    }

    public void setEvaluationRationale(String evaluationRationale) {
        this.evaluationRationale = evaluationRationale;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(List<String> requiredSkills) {
        this.requiredSkills = mutableList(requiredSkills);
    }

    public List<String> getPreferredSkills() {
        return preferredSkills;
    }

    public void setPreferredSkills(List<String> preferredSkills) {
        this.preferredSkills = mutableList(preferredSkills);
    }

    public List<String> getRequiredLanguages() {
        return requiredLanguages;
    }

    public void setRequiredLanguages(List<String> requiredLanguages) {
        this.requiredLanguages = mutableList(requiredLanguages);
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
