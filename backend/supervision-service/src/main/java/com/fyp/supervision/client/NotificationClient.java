package com.fyp.supervision.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fyp.supervision.controller.dto.CreateFeedbackReminderRequest;
import com.fyp.supervision.controller.dto.StatusEventRequest;

@Component
public class NotificationClient {
  private final RestClient restClient;

  public NotificationClient(
      @Value("${notification.base-url:http://localhost:8083}") String baseUrl
  ) {
    this.restClient = RestClient.builder()
        .baseUrl(baseUrl)
        .build();
  }

  public void createFeedbackReminder(CreateFeedbackReminderRequest request) {
    restClient.post()
        .uri("/internal/reminders/feedback-due")
        .contentType(MediaType.APPLICATION_JSON)
        .body(request)
        .retrieve()
        .toBodilessEntity();
  }

  public void publishStatusEvent(StatusEventRequest request) {
    restClient.post()
        .uri("/internal/events/status")
        .contentType(MediaType.APPLICATION_JSON)
        .body(request)
        .retrieve()
        .toBodilessEntity();
  }
}

