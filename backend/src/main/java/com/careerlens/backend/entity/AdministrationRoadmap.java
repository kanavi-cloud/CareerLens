package com.careerlens.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "administration_roadmaps",
        uniqueConstraints = @UniqueConstraint(name = "uk_administration_roadmap_planner", columnNames = "planner_roadmap_id")
)
public class AdministrationRoadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planner_roadmap_id", nullable = false)
    private PlannerRoadmap plannerRoadmap;

    private String overallStatus;
    private Integer completionRate;

    @Column(length = 2000)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String priorityActionsJson;

    @Column(columnDefinition = "TEXT")
    private String countrySummariesJson;

    private String generationMode;

    @Column(length = 1000)
    private String disclaimer;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime refreshedAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public PlannerRoadmap getPlannerRoadmap() {
        return plannerRoadmap;
    }

    public void setPlannerRoadmap(PlannerRoadmap plannerRoadmap) {
        this.plannerRoadmap = plannerRoadmap;
    }

    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }

    public Integer getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(Integer completionRate) {
        this.completionRate = completionRate;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getPriorityActionsJson() {
        return priorityActionsJson;
    }

    public void setPriorityActionsJson(String priorityActionsJson) {
        this.priorityActionsJson = priorityActionsJson;
    }

    public String getCountrySummariesJson() {
        return countrySummariesJson;
    }

    public void setCountrySummariesJson(String countrySummariesJson) {
        this.countrySummariesJson = countrySummariesJson;
    }

    public String getGenerationMode() {
        return generationMode;
    }

    public void setGenerationMode(String generationMode) {
        this.generationMode = generationMode;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getRefreshedAt() {
        return refreshedAt;
    }

    public void setRefreshedAt(LocalDateTime refreshedAt) {
        this.refreshedAt = refreshedAt;
    }
}
