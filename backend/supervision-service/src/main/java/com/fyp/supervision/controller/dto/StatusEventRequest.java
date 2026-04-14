package com.fyp.supervision.controller.dto;

import java.time.Instant;

public record StatusEventRequest(
    String type,
    String message,
    String sessionId,
    Instant timestamp
) {}

