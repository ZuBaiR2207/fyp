package com.fyp.supervision.controller.dto;

import java.time.LocalDate;

import com.fyp.supervision.model.MilestoneStatus;

import jakarta.validation.constraints.Size;

public record UpdateMilestoneRequest(
    @Size(max = 200) String name,
    @Size(max = 1000) String description,
    Integer orderIndex,
    LocalDate dueDate,
    MilestoneStatus status,
    @Size(max = 4000) String feedback,
    Integer weightPercentage
) {}
