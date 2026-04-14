package com.fyp.supervision.controller.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Size;

public record CreateDefenseRequest(
    LocalDateTime scheduledAt,
    @Size(max = 200) String venue,
    Integer durationMinutes,
    List<String> examiners,
    String chairperson
) {}
