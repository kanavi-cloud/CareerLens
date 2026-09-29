package com.careerlens.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "planner_tasks")
public class PlannerTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_id", nullable = false)
    private PlannerRoadmap roadmap;

    private Integer weekNumber;
    private String category;
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 1000)
    private String expectedOutputs;

    @Column(length = 1000)
    private String verificationCriteria;

    private Integer estimatedHours;
    private String difficulty;
    private String status;
    private Integer sortOrder;

    public Long getId() {
        return id;
    }

    public PlannerRoadmap getRoadmap() {
        return roadmap;
    }

    public void setRoadmap(PlannerRoadmap roadmap) {
        this.roadmap = roadmap;
    }

    public Integer getWeekNumber() {
        return weekNumber;
    }

    public void setWeekNumber(Integer weekNumber) {
        this.weekNumber = weekNumber;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getExpectedOutputs() {
        return expectedOutputs;
    }

    public void setExpectedOutputs(String expectedOutputs) {
        this.expectedOutputs = expectedOutputs;
    }

    public String getVerificationCriteria() {
        return verificationCriteria;
    }

    public void setVerificationCriteria(String verificationCriteria) {
        this.verificationCriteria = verificationCriteria;
    }

    public Integer getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(Integer estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
