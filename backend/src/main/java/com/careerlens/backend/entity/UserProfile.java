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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String targetCountry;
    private String targetCity;
    private String targetJobFamily;
    private String desiredJobTitle;
    private String currentCountry;
    private String nationality;
    private Integer experienceYears;
    private Integer relatedExperienceYears;
    private String languageLevel;
    private String englishLevel;
    private String japaneseLevel;
    private String education;
    private String major;
    private String graduationStatus;
    private String preferredWorkType;
    private String expectedSalaryRange;
    private String availableStartDate;
    private Boolean visaSponsorshipNeeded;
    private Boolean githubPresent;
    private Boolean portfolioPresent;
    private String githubUrl;
    private String portfolioUrl;
    private Boolean prioritizeSalary;
    private Boolean prioritizeAcceptanceProbability;
    private Boolean prioritizeWorkLifeBalance;
    private Boolean prioritizeCompanyValue;
    private Boolean prioritizeJobFit;

    @Column(length = 1000)
    private String projectExperienceSummary;

    @Column(length = 1000)
    private String domainExperience;

    @Column(length = 1000)
    private String cloudExperience;

    @Column(length = 1000)
    private String databaseExperience;

    @Column(length = 1000)
    private String deploymentExperience;

    @Column(length = 1000)
    private String languageTestScores;

    @ElementCollection
    @CollectionTable(name = "user_profile_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill")
    private List<String> techStack = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_profile_certifications", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "certification")
    private List<String> certifications = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_profile_preferences", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preference")
    private List<String> preferences = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTargetCountry() {
        return targetCountry;
    }

    public void setTargetCountry(String targetCountry) {
        this.targetCountry = targetCountry;
    }

    public String getTargetCity() {
        return targetCity;
    }

    public void setTargetCity(String targetCity) {
        this.targetCity = targetCity;
    }

    public String getTargetJobFamily() {
        return targetJobFamily;
    }

    public void setTargetJobFamily(String targetJobFamily) {
        this.targetJobFamily = targetJobFamily;
    }

    public String getDesiredJobTitle() {
        return desiredJobTitle;
    }

    public void setDesiredJobTitle(String desiredJobTitle) {
        this.desiredJobTitle = desiredJobTitle;
    }

    public String getCurrentCountry() {
        return currentCountry;
    }

    public void setCurrentCountry(String currentCountry) {
        this.currentCountry = currentCountry;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public Integer getRelatedExperienceYears() {
        return relatedExperienceYears;
    }

    public void setRelatedExperienceYears(Integer relatedExperienceYears) {
        this.relatedExperienceYears = relatedExperienceYears;
    }

    public String getLanguageLevel() {
        return languageLevel;
    }

    public void setLanguageLevel(String languageLevel) {
        this.languageLevel = languageLevel;
    }

    public String getEnglishLevel() {
        return englishLevel;
    }

    public void setEnglishLevel(String englishLevel) {
        this.englishLevel = englishLevel;
    }

    public String getJapaneseLevel() {
        return japaneseLevel;
    }

    public void setJapaneseLevel(String japaneseLevel) {
        this.japaneseLevel = japaneseLevel;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public String getMajor() {
        return major;
    }

    public void setMajor(String major) {
        this.major = major;
    }

    public String getGraduationStatus() {
        return graduationStatus;
    }

    public void setGraduationStatus(String graduationStatus) {
        this.graduationStatus = graduationStatus;
    }

    public String getPreferredWorkType() {
        return preferredWorkType;
    }

    public void setPreferredWorkType(String preferredWorkType) {
        this.preferredWorkType = preferredWorkType;
    }

    public String getExpectedSalaryRange() {
        return expectedSalaryRange;
    }

    public void setExpectedSalaryRange(String expectedSalaryRange) {
        this.expectedSalaryRange = expectedSalaryRange;
    }

    public String getAvailableStartDate() {
        return availableStartDate;
    }

    public void setAvailableStartDate(String availableStartDate) {
        this.availableStartDate = availableStartDate;
    }

    public Boolean getVisaSponsorshipNeeded() {
        return visaSponsorshipNeeded;
    }

    public void setVisaSponsorshipNeeded(Boolean visaSponsorshipNeeded) {
        this.visaSponsorshipNeeded = visaSponsorshipNeeded;
    }

    public Boolean getGithubPresent() {
        return githubPresent;
    }

    public void setGithubPresent(Boolean githubPresent) {
        this.githubPresent = githubPresent;
    }

    public Boolean getPortfolioPresent() {
        return portfolioPresent;
    }

    public void setPortfolioPresent(Boolean portfolioPresent) {
        this.portfolioPresent = portfolioPresent;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }

    public String getPortfolioUrl() {
        return portfolioUrl;
    }

    public void setPortfolioUrl(String portfolioUrl) {
        this.portfolioUrl = portfolioUrl;
    }

    public Boolean getPrioritizeSalary() {
        return prioritizeSalary;
    }

    public void setPrioritizeSalary(Boolean prioritizeSalary) {
        this.prioritizeSalary = prioritizeSalary;
    }

    public Boolean getPrioritizeAcceptanceProbability() {
        return prioritizeAcceptanceProbability;
    }

    public void setPrioritizeAcceptanceProbability(Boolean prioritizeAcceptanceProbability) {
        this.prioritizeAcceptanceProbability = prioritizeAcceptanceProbability;
    }

    public Boolean getPrioritizeWorkLifeBalance() {
        return prioritizeWorkLifeBalance;
    }

    public void setPrioritizeWorkLifeBalance(Boolean prioritizeWorkLifeBalance) {
        this.prioritizeWorkLifeBalance = prioritizeWorkLifeBalance;
    }

    public Boolean getPrioritizeCompanyValue() {
        return prioritizeCompanyValue;
    }

    public void setPrioritizeCompanyValue(Boolean prioritizeCompanyValue) {
        this.prioritizeCompanyValue = prioritizeCompanyValue;
    }

    public Boolean getPrioritizeJobFit() {
        return prioritizeJobFit;
    }

    public void setPrioritizeJobFit(Boolean prioritizeJobFit) {
        this.prioritizeJobFit = prioritizeJobFit;
    }

    public String getProjectExperienceSummary() {
        return projectExperienceSummary;
    }

    public void setProjectExperienceSummary(String projectExperienceSummary) {
        this.projectExperienceSummary = projectExperienceSummary;
    }

    public String getDomainExperience() {
        return domainExperience;
    }

    public void setDomainExperience(String domainExperience) {
        this.domainExperience = domainExperience;
    }

    public String getCloudExperience() {
        return cloudExperience;
    }

    public void setCloudExperience(String cloudExperience) {
        this.cloudExperience = cloudExperience;
    }

    public String getDatabaseExperience() {
        return databaseExperience;
    }

    public void setDatabaseExperience(String databaseExperience) {
        this.databaseExperience = databaseExperience;
    }

    public String getDeploymentExperience() {
        return deploymentExperience;
    }

    public void setDeploymentExperience(String deploymentExperience) {
        this.deploymentExperience = deploymentExperience;
    }

    public String getLanguageTestScores() {
        return languageTestScores;
    }

    public void setLanguageTestScores(String languageTestScores) {
        this.languageTestScores = languageTestScores;
    }

    public List<String> getTechStack() {
        return techStack;
    }

    public void setTechStack(List<String> techStack) {
        this.techStack = mutableList(techStack);
    }

    public List<String> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<String> certifications) {
        this.certifications = mutableList(certifications);
    }

    public List<String> getPreferences() {
        return preferences;
    }

    public void setPreferences(List<String> preferences) {
        this.preferences = mutableList(preferences);
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
