package com.fyp.supervision.controller.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.fyp.supervision.model.ThesisStatus;

public record ThesisResponse(
    String id,
    String title,
    String abstractText,
    String keywords,
    ThesisStatus status,
    LocalDate startDate,
    LocalDate expectedEndDate,
    LocalDate actualEndDate,
    String studentUsername,
    String supervisorUsername,
    String coSupervisorUsername,
    Integer progress,
    String programId,
    String programName,
    String researchArea,
    Instant createdAt,
    Instant updatedAt,
    List<MilestoneResponse> milestones,
    DefenseResponse defense
) {}
