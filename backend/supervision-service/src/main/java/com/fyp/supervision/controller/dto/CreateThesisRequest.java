package com.fyp.supervision.controller.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ===================== THESIS DTOs =====================

public record CreateThesisRequest(
    @NotBlank @Size(max = 500) String title,
    @Size(max = 5000) String abstractText,
    @Size(max = 500) String keywords,
    LocalDate startDate,
    LocalDate expectedEndDate,
    String supervisorUsername,
    String coSupervisorUsername,
    String programId,
    @Size(max = 200) String researchArea
) {}
