package com.fyp.notification.model;

import java.time.Instant;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reminders")
public class Reminder {
  @Id
  @UuidGenerator
  @Column(name = "id", updatable = false, nullable = false)
  private String id;

  @Column(name = "recipient_username", nullable = false)
  private String recipientUsername;

  @Column(name = "related_session_id", nullable = false, length = 64)
  private String relatedSessionId;

  @Column(name = "due_at", nullable = false)
  private Instant dueAt;

  @Column(name = "message", length = 2000, nullable = false)
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private ReminderStatus status;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "sent_at")
  private Instant sentAt;

  public String getId() {
    return id;
  }

  public String getRecipientUsername() {
    return recipientUsername;
  }

  public void setRecipientUsername(String recipientUsername) {
    this.recipientUsername = recipientUsername;
  }

  public String getRelatedSessionId() {
    return relatedSessionId;
  }

  public void setRelatedSessionId(String relatedSessionId) {
    this.relatedSessionId = relatedSessionId;
  }

  public Instant getDueAt() {
    return dueAt;
  }

  public void setDueAt(Instant dueAt) {
    this.dueAt = dueAt;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public ReminderStatus getStatus() {
    return status;
  }

  public void setStatus(ReminderStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getSentAt() {
    return sentAt;
  }

  public void setSentAt(Instant sentAt) {
    this.sentAt = sentAt;
  }
}

