package com.fyp.supervision.controller.dto;

import java.time.LocalDate;

import com.fyp.supervision.model.ThesisStatus;

import jakarta.validation.constraints.Size;

public record UpdateThesisRequest(
    @Size(max = 500) String title,
    @Size(max = 5000) String abstractText,
    @Size(max = 500) String keywords,
    ThesisStatus status,
    LocalDate startDate,
    LocalDate expectedEndDate,
    LocalDate actualEndDate,
    String supervisorUsername,
    String coSupervisorUsername,
    Integer progress,
    @Size(max = 200) String researchArea
) {}
