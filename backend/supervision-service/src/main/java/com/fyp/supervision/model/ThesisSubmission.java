package com.fyp.supervision.model;

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
 * Represents a document submission for a thesis.
 * Tracks proposals, drafts, revisions, and final submissions.
 */
@Entity
@Table(name = "thesis_submissions")
public class ThesisSubmission {
    
    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thesis_id", nullable = false)
    private Thesis thesis;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "submission_type", nullable = false)
    private SubmissionType type;
    
    @Column(name = "title", length = 300)
    private String title; // e.g., "Draft v1", "Chapter 3 submission"
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @Column(name = "file_url", length = 1000)
    private String fileUrl; // URL/path to the uploaded document
    
    @Column(name = "file_name", length = 255)
    private String fileName;
    
    @Column(name = "file_size")
    private Long fileSize; // in bytes
    
    @Column(name = "submitted_by", nullable = false)
    private String submittedBy; // Username
    
    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt = Instant.now();
    
    @Column(name = "reviewer_username")
    private String reviewerUsername;
    
    @Column(name = "reviewer_comments", length = 4000)
    private String reviewerComments;
    
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    
    @Column(name = "is_approved")
    private Boolean isApproved;
    
    @Column(name = "version_number")
    private Integer versionNumber = 1;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id")
    private Milestone relatedMilestone; // Optional link to a specific milestone
    
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
    
    public SubmissionType getType() {
        return type;
    }
    
    public void setType(SubmissionType type) {
        this.type = type;
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
    
    public String getFileUrl() {
        return fileUrl;
    }
    
    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getSubmittedBy() {
        return submittedBy;
    }
    
    public void setSubmittedBy(String submittedBy) {
        this.submittedBy = submittedBy;
    }
    
    public Instant getSubmittedAt() {
        return submittedAt;
    }
    
    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
    
    public String getReviewerUsername() {
        return reviewerUsername;
    }
    
    public void setReviewerUsername(String reviewerUsername) {
        this.reviewerUsername = reviewerUsername;
    }
    
    public String getReviewerComments() {
        return reviewerComments;
    }
    
    public void setReviewerComments(String reviewerComments) {
        this.reviewerComments = reviewerComments;
        this.reviewedAt = Instant.now();
    }
    
    public Instant getReviewedAt() {
        return reviewedAt;
    }
    
    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
    
    public Boolean getIsApproved() {
        return isApproved;
    }
    
    public void setIsApproved(Boolean isApproved) {
        this.isApproved = isApproved;
    }
    
    public Integer getVersionNumber() {
        return versionNumber;
    }
    
    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }
    
    public Milestone getRelatedMilestone() {
        return relatedMilestone;
    }
    
    public void setRelatedMilestone(Milestone relatedMilestone) {
        this.relatedMilestone = relatedMilestone;
    }
}
