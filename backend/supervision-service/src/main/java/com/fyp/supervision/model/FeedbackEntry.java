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

@Entity
@Table(name = "feedback_entries")
public class FeedbackEntry {
  @Id
  @UuidGenerator
  @Column(name = "id", updatable = false, nullable = false)
  private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "session_id", nullable = false)
  private SupervisionSession session;

  @Column(name = "submitted_by_username", nullable = false)
  private String submittedByUsername;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private FeedbackStatus status;

  @Column(name = "submitted_at", nullable = false)
  private Instant submittedAt;

  @Column(name = "feedback_text", length = 4000, nullable = false)
  private String feedbackText;

  public String getId() {
    return id;
  }

  public SupervisionSession getSession() {
    return session;
  }

  public void setSession(SupervisionSession session) {
    this.session = session;
  }

  public String getSubmittedByUsername() {
    return submittedByUsername;
  }

  public void setSubmittedByUsername(String submittedByUsername) {
    this.submittedByUsername = submittedByUsername;
  }

  public FeedbackStatus getStatus() {
    return status;
  }

  public void setStatus(FeedbackStatus status) {
    this.status = status;
  }

  public Instant getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(Instant submittedAt) {
    this.submittedAt = submittedAt;
  }

  public String getFeedbackText() {
    return feedbackText;
  }

  public void setFeedbackText(String feedbackText) {
    this.feedbackText = feedbackText;
  }
}

