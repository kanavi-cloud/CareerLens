package com.careerlens.backend.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diagnosis_results")
public class DiagnosisResult {

    public enum ReadinessStatus {
        IMMEDIATE_APPLY,
        PREPARE_THEN_APPLY,
        LONG_TERM_PREPARE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pattern_profile_id")
    private PatternProfile patternProfile;

    private Integer totalScore;
    private Integer skillScore;
    private Integer experienceScore;
    private Integer languageScore;
    private Integer educationScore;
    private Integer portfolioScore;
    private Integer acceptanceProbabilityScore;
    private Integer salaryScore;
    private Integer workLifeBalanceScore;
    private Integer companyValueScore;
    private Integer jobFitScore;
    private Integer probabilityWeight;
    private Integer salaryWeight;
    private Integer workLifeBalanceWeight;
    private Integer companyValueWeight;
    private Integer jobFitWeight;
    private String recommendationGrade;
    private String primaryRecommendationCategory;
    private String patternRef;
    private String patternTitle;

    @Column(length = 1000)
    private String patternEvidenceSummary;

    @Enumerated(EnumType.STRING)
    private ReadinessStatus readinessStatus;

    @Column(length = 1000)
    private String recommendationSummary;

    @Column(length = 1000)
    private String nextActionSummary;

    @ElementCollection
    @CollectionTable(name = "diagnosis_missing_items", joinColumns = @JoinColumn(name = "diagnosis_id"))
    @Column(name = "missing_item")
    private List<String> missingItems = new ArrayList<>();

    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public void setJobPosting(JobPosting jobPosting) {
        this.jobPosting = jobPosting;
    }

    public PatternProfile getPatternProfile() {
        return patternProfile;
    }

    public void setPatternProfile(PatternProfile patternProfile) {
        this.patternProfile = patternProfile;
    }

    public Integer getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Integer totalScore) {
        this.totalScore = totalScore;
    }

    public Integer getSkillScore() {
        return skillScore;
    }

    public void setSkillScore(Integer skillScore) {
        this.skillScore = skillScore;
    }

    public Integer getExperienceScore() {
        return experienceScore;
    }

    public void setExperienceScore(Integer experienceScore) {
        this.experienceScore = experienceScore;
    }

    public Integer getLanguageScore() {
        return languageScore;
    }

    public void setLanguageScore(Integer languageScore) {
        this.languageScore = languageScore;
    }

    public Integer getEducationScore() {
        return educationScore;
    }

    public void setEducationScore(Integer educationScore) {
        this.educationScore = educationScore;
    }

    public Integer getPortfolioScore() {
        return portfolioScore;
    }

    public void setPortfolioScore(Integer portfolioScore) {
        this.portfolioScore = portfolioScore;
    }

    public Integer getAcceptanceProbabilityScore() {
        return acceptanceProbabilityScore;
    }

    public void setAcceptanceProbabilityScore(Integer acceptanceProbabilityScore) {
        this.acceptanceProbabilityScore = acceptanceProbabilityScore;
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

    public Integer getJobFitScore() {
        return jobFitScore;
    }

    public void setJobFitScore(Integer jobFitScore) {
        this.jobFitScore = jobFitScore;
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

    public String getRecommendationGrade() {
        return recommendationGrade;
    }

    public void setRecommendationGrade(String recommendationGrade) {
        this.recommendationGrade = recommendationGrade;
    }

    public String getPrimaryRecommendationCategory() {
        return primaryRecommendationCategory;
    }

    public void setPrimaryRecommendationCategory(String primaryRecommendationCategory) {
        this.primaryRecommendationCategory = primaryRecommendationCategory;
    }

    public String getPatternRef() {
        return patternRef;
    }

    public void setPatternRef(String patternRef) {
        this.patternRef = patternRef;
    }

    public String getPatternTitle() {
        return patternTitle;
    }

    public void setPatternTitle(String patternTitle) {
        this.patternTitle = patternTitle;
    }

    public String getPatternEvidenceSummary() {
        return patternEvidenceSummary;
    }

    public void setPatternEvidenceSummary(String patternEvidenceSummary) {
        this.patternEvidenceSummary = patternEvidenceSummary;
    }

    public ReadinessStatus getReadinessStatus() {
        return readinessStatus;
    }

    public void setReadinessStatus(ReadinessStatus readinessStatus) {
        this.readinessStatus = readinessStatus;
    }

    public String getRecommendationSummary() {
        return recommendationSummary;
    }

    public void setRecommendationSummary(String recommendationSummary) {
        this.recommendationSummary = recommendationSummary;
    }

    public String getNextActionSummary() {
        return nextActionSummary;
    }

    public void setNextActionSummary(String nextActionSummary) {
        this.nextActionSummary = nextActionSummary;
    }

    public List<String> getMissingItems() {
        return missingItems;
    }

    public void setMissingItems(List<String> missingItems) {
        this.missingItems = mutableList(missingItems);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
