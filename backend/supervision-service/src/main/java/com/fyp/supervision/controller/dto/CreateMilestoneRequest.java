package com.fyp.supervision.controller.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMilestoneRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 1000) String description,
    Integer orderIndex,
    LocalDate dueDate,
    Integer weightPercentage
) {}
