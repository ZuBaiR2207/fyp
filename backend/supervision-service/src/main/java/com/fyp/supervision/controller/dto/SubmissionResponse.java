package com.fyp.supervision.controller.dto;

import java.time.Instant;

import com.fyp.supervision.model.SubmissionType;

public record SubmissionResponse(
    String id,
    String thesisId,
    SubmissionType type,
    String title,
    String description,
    String fileUrl,
    String fileName,
    Long fileSize,
    String submittedBy,
    Instant submittedAt,
    String reviewerUsername,
    String reviewerComments,
    Instant reviewedAt,
    Boolean isApproved,
    Integer versionNumber,
    String milestoneId
) {}
