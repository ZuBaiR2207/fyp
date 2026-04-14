package com.fyp.supervision.controller.dto;

import com.fyp.supervision.model.SubmissionType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSubmissionRequest(
    @NotNull SubmissionType type,
    @Size(max = 300) String title,
    @Size(max = 1000) String description,
    @Size(max = 1000) String fileUrl,
    @Size(max = 255) String fileName,
    Long fileSize,
    String milestoneId
) {}
