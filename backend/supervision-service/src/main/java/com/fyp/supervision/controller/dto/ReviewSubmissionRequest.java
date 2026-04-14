package com.fyp.supervision.controller.dto;

import jakarta.validation.constraints.Size;

public record ReviewSubmissionRequest(
    @Size(max = 4000) String reviewerComments,
    Boolean isApproved
) {}
