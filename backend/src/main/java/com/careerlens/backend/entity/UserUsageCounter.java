package com.careerlens.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_usage_counters",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "period_month"})
)
public class UserUsageCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "period_month", nullable = false, length = 7)
    private String periodMonth;

    private Integer roadmapCreatedCount;

    private Integer aiDocumentAnalysisCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPeriodMonth() {
        return periodMonth;
    }

    public void setPeriodMonth(String periodMonth) {
        this.periodMonth = periodMonth;
    }

    public Integer getRoadmapCreatedCount() {
        return roadmapCreatedCount;
    }

    public void setRoadmapCreatedCount(Integer roadmapCreatedCount) {
        this.roadmapCreatedCount = roadmapCreatedCount;
    }

    public Integer getAiDocumentAnalysisCount() {
        return aiDocumentAnalysisCount;
    }

    public void setAiDocumentAnalysisCount(Integer aiDocumentAnalysisCount) {
        this.aiDocumentAnalysisCount = aiDocumentAnalysisCount;
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
}
