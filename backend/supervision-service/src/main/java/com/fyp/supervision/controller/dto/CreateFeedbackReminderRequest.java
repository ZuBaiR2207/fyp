package com.fyp.supervision.controller.dto;

import java.time.LocalDateTime;

public record CreateFeedbackReminderRequest(
    String sessionId,
    String recipientUsername,
    LocalDateTime dueAt,
    String message
) {}

