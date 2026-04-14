package com.fyp.notification.model;

import java.time.Instant;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "announcements")
public class Announcement {
  @Id
  @UuidGenerator
  @Column(name = "id", updatable = false, nullable = false)
  private String id;

  @Column(name = "title", nullable = false, length = 180)
  private String title;

  @Column(name = "content", nullable = false, length = 4000)
  private String content;

  @Column(name = "image_url", length = 1000)
  private String imageUrl;

  @Column(name = "link_url", length = 1000)
  private String linkUrl;

  @Column(name = "pinned", nullable = false)
  private boolean pinned;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "created_by_username", nullable = false, length = 120)
  private String createdByUsername;

  public String getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public String getLinkUrl() {
    return linkUrl;
  }

  public void setLinkUrl(String linkUrl) {
    this.linkUrl = linkUrl;
  }

  public boolean isPinned() {
    return pinned;
  }

  public void setPinned(boolean pinned) {
    this.pinned = pinned;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public String getCreatedByUsername() {
    return createdByUsername;
  }

  public void setCreatedByUsername(String createdByUsername) {
    this.createdByUsername = createdByUsername;
  }
}
