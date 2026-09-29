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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employee_profile_samples")
public class EmployeeProfileSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sampleRef;
    private String currentCompany;
    private String matchedJobFamily;
    private String education;
    private String major;
    private Integer experienceYears;
    private String languages;
    private Boolean githubPresent;
    private Boolean portfolioPresent;

    @Column(length = 1000)
    private String projectExperienceNotes;

    @ElementCollection
    @CollectionTable(name = "employee_sample_tech_stack", joinColumns = @JoinColumn(name = "sample_id"))
    @Column(name = "skill")
    private List<String> techStack = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "employee_sample_certifications", joinColumns = @JoinColumn(name = "sample_id"))
    @Column(name = "certification")
    private List<String> certifications = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getSampleRef() {
        return sampleRef;
    }

    public void setSampleRef(String sampleRef) {
        this.sampleRef = sampleRef;
    }

    public String getCurrentCompany() {
        return currentCompany;
    }

    public void setCurrentCompany(String currentCompany) {
        this.currentCompany = currentCompany;
    }

    public String getMatchedJobFamily() {
        return matchedJobFamily;
    }

    public void setMatchedJobFamily(String matchedJobFamily) {
        this.matchedJobFamily = matchedJobFamily;
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

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getLanguages() {
        return languages;
    }

    public void setLanguages(String languages) {
        this.languages = languages;
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

    public String getProjectExperienceNotes() {
        return projectExperienceNotes;
    }

    public void setProjectExperienceNotes(String projectExperienceNotes) {
        this.projectExperienceNotes = projectExperienceNotes;
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

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
