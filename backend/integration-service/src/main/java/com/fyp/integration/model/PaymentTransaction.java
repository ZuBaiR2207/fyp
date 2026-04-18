package com.fyp.integration.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String stripeSessionId;

  @Column(nullable = false)
  private String username;

  @Column(nullable = false)
  private double amount;

  @Column(nullable = false, length = 10)
  private String currency;

  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentStatus status;

  @Column(nullable = false)
  private Instant createdAt;

  private Instant completedAt;

  public enum PaymentStatus {
    PENDING, COMPLETED, CANCELLED, FAILED
  }

  // Getters & setters

  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public String getStripeSessionId() { return stripeSessionId; }
  public void setStripeSessionId(String stripeSessionId) { this.stripeSessionId = stripeSessionId; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }

  public String getCurrency() { return currency; }
  public void setCurrency(String currency) { this.currency = currency; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public PaymentStatus getStatus() { return status; }
  public void setStatus(PaymentStatus status) { this.status = status; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public Instant getCompletedAt() { return completedAt; }
  public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
