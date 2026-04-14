package com.fyp.supervision.controller.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.fyp.supervision.model.MilestoneStatus;

public record MilestoneResponse(
    String id,
    String thesisId,
    String name,
    String description,
    Integer orderIndex,
    LocalDate dueDate,
    MilestoneStatus status,
    Instant submittedAt,
    Instant approvedAt,
    String feedback,
    String feedbackBy,
    Instant feedbackAt,
    Integer weightPercentage,
    boolean isOverdue,
    Instant createdAt
) {}
