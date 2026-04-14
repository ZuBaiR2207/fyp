package com.fyp.supervision.model;

import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Represents a Master's thesis being tracked in the system.
 * Each student has one active thesis at a time.
 */
@Entity
@Table(name = "theses")
public class Thesis {
    
    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private String id;
    
    @Column(name = "title", nullable = false, length = 500)
    private String title;
    
    @Column(name = "abstract_text", length = 5000)
    private String abstractText;
    
    @Column(name = "keywords", length = 500)
    private String keywords; // Comma-separated keywords
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ThesisStatus status = ThesisStatus.TOPIC_PROPOSED;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "expected_end_date")
    private LocalDate expectedEndDate;
    
    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;
    
    @Column(name = "student_username", nullable = false)
    private String studentUsername;
    
    @Column(name = "supervisor_username")
    private String supervisorUsername;
    
    @Column(name = "co_supervisor_username")
    private String coSupervisorUsername;
    
    @Column(name = "progress", nullable = false)
    private Integer progress = 0; // 0-100 percentage
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    private Program program;
    
    @Column(name = "research_area", length = 200)
    private String researchArea;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "thesis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Milestone> milestones = new ArrayList<>();
    
    @OneToMany(mappedBy = "thesis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ThesisSubmission> submissions = new ArrayList<>();
    
    @OneToOne(mappedBy = "thesis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private DefenseRecord defenseRecord;
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getAbstractText() {
        return abstractText;
    }
    
    public void setAbstractText(String abstractText) {
        this.abstractText = abstractText;
    }
    
    public String getKeywords() {
        return keywords;
    }
    
    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }
    
    public ThesisStatus getStatus() {
        return status;
    }
    
    public void setStatus(ThesisStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getExpectedEndDate() {
        return expectedEndDate;
    }
    
    public void setExpectedEndDate(LocalDate expectedEndDate) {
        this.expectedEndDate = expectedEndDate;
    }
    
    public LocalDate getActualEndDate() {
        return actualEndDate;
    }
    
    public void setActualEndDate(LocalDate actualEndDate) {
        this.actualEndDate = actualEndDate;
    }
    
    public String getStudentUsername() {
        return studentUsername;
    }
    
    public void setStudentUsername(String studentUsername) {
        this.studentUsername = studentUsername;
    }
    
    public String getSupervisorUsername() {
        return supervisorUsername;
    }
    
    public void setSupervisorUsername(String supervisorUsername) {
        this.supervisorUsername = supervisorUsername;
    }
    
    public String getCoSupervisorUsername() {
        return coSupervisorUsername;
    }
    
    public void setCoSupervisorUsername(String coSupervisorUsername) {
        this.coSupervisorUsername = coSupervisorUsername;
    }
    
    public Integer getProgress() {
        return progress;
    }
    
    public void setProgress(Integer progress) {
        this.progress = Math.max(0, Math.min(100, progress));
        this.updatedAt = Instant.now();
    }
    
    public Program getProgram() {
        return program;
    }
    
    public void setProgram(Program program) {
        this.program = program;
    }
    
    public String getResearchArea() {
        return researchArea;
    }
    
    public void setResearchArea(String researchArea) {
        this.researchArea = researchArea;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public List<Milestone> getMilestones() {
        return milestones;
    }
    
    public void addMilestone(Milestone milestone) {
        milestones.add(milestone);
        milestone.setThesis(this);
    }
    
    public void removeMilestone(Milestone milestone) {
        milestones.remove(milestone);
        milestone.setThesis(null);
    }
    
    public List<ThesisSubmission> getSubmissions() {
        return submissions;
    }
    
    public void addSubmission(ThesisSubmission submission) {
        submissions.add(submission);
        submission.setThesis(this);
    }
    
    public DefenseRecord getDefenseRecord() {
        return defenseRecord;
    }
    
    public void setDefenseRecord(DefenseRecord defenseRecord) {
        this.defenseRecord = defenseRecord;
        if (defenseRecord != null) {
            defenseRecord.setThesis(this);
        }
    }
    
    /**
     * Calculate progress based on completed milestones
     */
    public void recalculateProgress() {
        if (milestones.isEmpty()) {
            return;
        }
        long approved = milestones.stream()
            .filter(m -> m.getStatus() == MilestoneStatus.APPROVED)
            .count();
        this.progress = (int) ((approved * 100) / milestones.size());
        this.updatedAt = Instant.now();
    }
}
