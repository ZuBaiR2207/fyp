package com.fyp.supervision.controller.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fyp.supervision.model.DefenseOutcome;

import jakarta.validation.constraints.Size;

public record UpdateDefenseRequest(
    LocalDateTime scheduledAt,
    @Size(max = 200) String venue,
    Integer durationMinutes,
    List<String> examiners,
    String chairperson,
    DefenseOutcome outcome,
    @Size(max = 4000) String comments,
    LocalDateTime correctionsDueDate,
    @Size(max = 10) String finalGrade
) {}
