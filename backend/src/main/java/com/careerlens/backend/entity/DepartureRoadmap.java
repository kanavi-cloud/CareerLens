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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "departure_roadmaps",
        uniqueConstraints = @UniqueConstraint(name = "uk_departure_roadmap_planner", columnNames = "planner_roadmap_id")
)
public class DepartureRoadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planner_roadmap_id", nullable = false)
    private PlannerRoadmap plannerRoadmap;

    private String targetCountry;
    private String destinationCity;
    private String originAirport;
    private String destinationAirport;
    private LocalDate startDate;
    private LocalDate recommendedArrivalDate;
    private LocalDate departureWindowStart;
    private LocalDate departureWindowEnd;
    private Long daysUntilDepartureWindow;
    private String urgencyStatus;

    @Column(length = 2000)
    private String summary;

    @Column(length = 2000)
    private String flightSearchNote;

    private String flightDataStatus;
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

    public String getTargetCountry() {
        return targetCountry;
    }

    public void setTargetCountry(String targetCountry) {
        this.targetCountry = targetCountry;
    }

    public String getDestinationCity() {
        return destinationCity;
    }

    public void setDestinationCity(String destinationCity) {
        this.destinationCity = destinationCity;
    }

    public String getOriginAirport() {
        return originAirport;
    }

    public void setOriginAirport(String originAirport) {
        this.originAirport = originAirport;
    }

    public String getDestinationAirport() {
        return destinationAirport;
    }

    public void setDestinationAirport(String destinationAirport) {
        this.destinationAirport = destinationAirport;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getRecommendedArrivalDate() {
        return recommendedArrivalDate;
    }

    public void setRecommendedArrivalDate(LocalDate recommendedArrivalDate) {
        this.recommendedArrivalDate = recommendedArrivalDate;
    }

    public LocalDate getDepartureWindowStart() {
        return departureWindowStart;
    }

    public void setDepartureWindowStart(LocalDate departureWindowStart) {
        this.departureWindowStart = departureWindowStart;
    }

    public LocalDate getDepartureWindowEnd() {
        return departureWindowEnd;
    }

    public void setDepartureWindowEnd(LocalDate departureWindowEnd) {
        this.departureWindowEnd = departureWindowEnd;
    }

    public Long getDaysUntilDepartureWindow() {
        return daysUntilDepartureWindow;
    }

    public void setDaysUntilDepartureWindow(Long daysUntilDepartureWindow) {
        this.daysUntilDepartureWindow = daysUntilDepartureWindow;
    }

    public String getUrgencyStatus() {
        return urgencyStatus;
    }

    public void setUrgencyStatus(String urgencyStatus) {
        this.urgencyStatus = urgencyStatus;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getFlightSearchNote() {
        return flightSearchNote;
    }

    public void setFlightSearchNote(String flightSearchNote) {
        this.flightSearchNote = flightSearchNote;
    }

    public String getFlightDataStatus() {
        return flightDataStatus;
    }

    public void setFlightDataStatus(String flightDataStatus) {
        this.flightDataStatus = flightDataStatus;
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
