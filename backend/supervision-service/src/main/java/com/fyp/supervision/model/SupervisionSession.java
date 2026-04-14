package com.fyp.supervision.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "supervision_sessions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"program_id", "student_username", "scheduled_at"})
)
public class SupervisionSession {
  @Id
  @UuidGenerator
  @Column(name = "id", updatable = false, nullable = false)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "program_id")
  private Program program;

  @Column(name = "student_username", nullable = false)
  private String studentUsername;

  @Column(name = "supervisor_username", nullable = false)
  private String supervisorUsername;

  @Column(name = "scheduled_at", nullable = false)
  private LocalDateTime scheduledAt;

  @Column(name = "feedback_deadline_at")
  private LocalDateTime feedbackDeadlineAt;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private SessionStatus status;

  @Column(name = "notes", length = 4000)
  private String notes;

  @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
  private java.util.List<FeedbackEntry> feedbackEntries = new java.util.ArrayList<>();

  public String getId() {
    return id;
  }

  public Program getProgram() {
    return program;
  }

  public void setProgram(Program program) {
    this.program = program;
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

  public LocalDateTime getScheduledAt() {
    return scheduledAt;
  }

  public void setScheduledAt(LocalDateTime scheduledAt) {
    this.scheduledAt = scheduledAt;
  }

  public LocalDateTime getFeedbackDeadlineAt() {
    return feedbackDeadlineAt;
  }

  public void setFeedbackDeadlineAt(LocalDateTime feedbackDeadlineAt) {
    this.feedbackDeadlineAt = feedbackDeadlineAt;
  }

  public SessionStatus getStatus() {
    return status;
  }

  public void setStatus(SessionStatus status) {
    this.status = status;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public java.util.List<FeedbackEntry> getFeedbackEntries() {
    return feedbackEntries;
  }

  public void addFeedbackEntry(FeedbackEntry entry) {
    entry.setSession(this);
    feedbackEntries.add(entry);
  }
}

