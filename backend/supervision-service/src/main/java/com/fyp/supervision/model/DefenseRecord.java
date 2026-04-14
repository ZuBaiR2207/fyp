package com.fyp.supervision.model;

import java.time.LocalDateTime;
import java.time.Instant;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Represents the thesis defense (viva voce) record.
 * Tracks defense scheduling, examiners, outcome, and comments.
 */
@Entity
@Table(name = "defense_records")
public class DefenseRecord {
    
    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private String id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thesis_id", nullable = false, unique = true)
    private Thesis thesis;
    
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;
    
    @Column(name = "venue", length = 200)
    private String venue;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60; // Default 1 hour
    
    // Examiners stored as comma-separated usernames
    @Column(name = "examiners", length = 500)
    private String examiners;
    
    @Column(name = "chairperson")
    private String chairperson; // Defense committee chair
    
    @Enumerated(EnumType.STRING)
    @Column(name = "outcome")
    private DefenseOutcome outcome = DefenseOutcome.PENDING;
    
    @Column(name = "comments", length = 4000)
    private String comments;
    
    @Column(name = "corrections_due_date")
    private LocalDateTime correctionsDueDate; // If corrections required
    
    @Column(name = "corrections_submitted_at")
    private Instant correctionsSubmittedAt;
    
    @Column(name = "final_grade", length = 10)
    private String finalGrade; // e.g., "A", "B+", "Pass with Distinction"
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public Thesis getThesis() {
        return thesis;
    }
    
    public void setThesis(Thesis thesis) {
        this.thesis = thesis;
    }
    
    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }
    
    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
        this.updatedAt = Instant.now();
    }
    
    public String getVenue() {
        return venue;
    }
    
    public void setVenue(String venue) {
        this.venue = venue;
    }
    
    public Integer getDurationMinutes() {
        return durationMinutes;
    }
    
    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
    
    public String getExaminers() {
        return examiners;
    }
    
    public void setExaminers(String examiners) {
        this.examiners = examiners;
    }
    
    /**
     * Get examiners as a list
     */
    public java.util.List<String> getExaminersList() {
        if (examiners == null || examiners.isBlank()) {
            return java.util.Collections.emptyList();
        }
        return java.util.Arrays.stream(examiners.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }
    
    /**
     * Set examiners from a list
     */
    public void setExaminersList(java.util.List<String> examinerList) {
        if (examinerList == null || examinerList.isEmpty()) {
            this.examiners = null;
        } else {
            this.examiners = String.join(",", examinerList);
        }
    }
    
    public String getChairperson() {
        return chairperson;
    }
    
    public void setChairperson(String chairperson) {
        this.chairperson = chairperson;
    }
    
    public DefenseOutcome getOutcome() {
        return outcome;
    }
    
    public void setOutcome(DefenseOutcome outcome) {
        this.outcome = outcome;
        this.updatedAt = Instant.now();
    }
    
    public String getComments() {
        return comments;
    }
    
    public void setComments(String comments) {
        this.comments = comments;
    }
    
    public LocalDateTime getCorrectionsDueDate() {
        return correctionsDueDate;
    }
    
    public void setCorrectionsDueDate(LocalDateTime correctionsDueDate) {
        this.correctionsDueDate = correctionsDueDate;
    }
    
    public Instant getCorrectionsSubmittedAt() {
        return correctionsSubmittedAt;
    }
    
    public void setCorrectionsSubmittedAt(Instant correctionsSubmittedAt) {
        this.correctionsSubmittedAt = correctionsSubmittedAt;
    }
    
    public String getFinalGrade() {
        return finalGrade;
    }
    
    public void setFinalGrade(String finalGrade) {
        this.finalGrade = finalGrade;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
