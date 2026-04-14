package com.fyp.supervision.model;

import java.time.LocalDate;
import java.time.Instant;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Represents a thesis milestone/chapter that needs to be completed.
 * Milestones track progress through the thesis writing process.
 */
@Entity
@Table(name = "milestones")
public class Milestone {
    
    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thesis_id", nullable = false)
    private Thesis thesis;
    
    @Column(name = "name", nullable = false, length = 200)
    private String name; // e.g., "Chapter 1: Introduction", "Literature Review"
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex = 0; // For sorting milestones in order
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MilestoneStatus status = MilestoneStatus.NOT_STARTED;
    
    @Column(name = "submitted_at")
    private Instant submittedAt;
    
    @Column(name = "approved_at")
    private Instant approvedAt;
    
    @Column(name = "feedback", length = 4000)
    private String feedback;
    
    @Column(name = "feedback_by")
    private String feedbackBy; // Username of who gave feedback
    
    @Column(name = "feedback_at")
    private Instant feedbackAt;
    
    @Column(name = "weight_percentage")
    private Integer weightPercentage = 0; // Contribution to overall progress (optional)
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    
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
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getOrderIndex() {
        return orderIndex;
    }
    
    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
    
    public LocalDate getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
    
    public MilestoneStatus getStatus() {
        return status;
    }
    
    public void setStatus(MilestoneStatus status) {
        this.status = status;
        if (status == MilestoneStatus.SUBMITTED) {
            this.submittedAt = Instant.now();
        } else if (status == MilestoneStatus.APPROVED) {
            this.approvedAt = Instant.now();
        }
    }
    
    public Instant getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public Instant getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public String getFeedback() {
        return feedback;
    }
    
    public void setFeedback(String feedback) {
        this.feedback = feedback;
        this.feedbackAt = Instant.now();
    }
    
    public String getFeedbackBy() {
        return feedbackBy;
    }
    
    public void setFeedbackBy(String feedbackBy) {
        this.feedbackBy = feedbackBy;
    }
    
    public Instant getFeedbackAt() {
        return feedbackAt;
    }
    
    public Integer getWeightPercentage() {
        return weightPercentage;
    }
    
    public void setWeightPercentage(Integer weightPercentage) {
        this.weightPercentage = weightPercentage;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    /**
     * Check if milestone is overdue
     */
    public boolean isOverdue() {
        if (dueDate == null || status == MilestoneStatus.APPROVED) {
            return false;
        }
        return LocalDate.now().isAfter(dueDate);
    }
}
