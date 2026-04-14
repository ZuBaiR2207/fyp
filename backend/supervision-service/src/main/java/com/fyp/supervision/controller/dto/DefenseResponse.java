package com.fyp.supervision.controller.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import com.fyp.supervision.model.DefenseOutcome;

public record DefenseResponse(
    String id,
    String thesisId,
    LocalDateTime scheduledAt,
    String venue,
    Integer durationMinutes,
    List<String> examiners,
    String chairperson,
    DefenseOutcome outcome,
    String comments,
    LocalDateTime correctionsDueDate,
    Instant correctionsSubmittedAt,
    String finalGrade,
    Instant createdAt,
    Instant updatedAt
) {}
