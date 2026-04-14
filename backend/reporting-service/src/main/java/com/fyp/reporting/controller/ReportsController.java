package com.fyp.reporting.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {
  private final RestClient supervisionClient;
  private final RestClient notificationClient;

  public ReportsController(
      @Value("${supervision.base-url:http://localhost:8082}") String supervisionBaseUrl,
      @Value("${notification.base-url:http://localhost:8083}") String notificationBaseUrl
  ) {
    this.supervisionClient = RestClient.builder().baseUrl(supervisionBaseUrl).build();
    this.notificationClient = RestClient.builder().baseUrl(notificationBaseUrl).build();
  }

  @GetMapping("/summary")
  public ReportSummary summary(@RequestParam(required = false) String programId) {
    SupervisionSummary supervision = fetchSupervisionSummary(programId);
    ReminderSummary reminders = fetchReminderSummary();

    Map<String, Object> metrics = new LinkedHashMap<>();
    metrics.put("sessionsTotal", supervision.sessionsTotal());
    metrics.put("sessionsPlanned", supervision.sessionsPlanned());
    metrics.put("sessionsActive", supervision.sessionsActive());
    metrics.put("sessionsCompleted", supervision.sessionsCompleted());
    metrics.put("sessionsWithFeedback", supervision.sessionsWithFeedback());
    metrics.put("feedbackCoveragePercent", percent(supervision.sessionsWithFeedback(), supervision.sessionsTotal()));
    metrics.put("overdueFeedback", supervision.overdueFeedback());
    metrics.put("programsTracked", supervision.programsTracked());
    metrics.put("remindersTotal", reminders.remindersTotal());
    metrics.put("remindersSent", reminders.remindersSent());
    metrics.put("remindersPending", reminders.remindersPending());
    metrics.put("remindersOverdue", reminders.remindersOverdue());

    List<Map<String, Object>> breakdown = supervision.programBreakdown().stream()
        .map(program -> {
          Map<String, Object> entry = new LinkedHashMap<>();
          entry.put("programId", program.programId());
          entry.put("programName", program.programName());
          entry.put("sessionsTotal", program.sessionsTotal());
          entry.put("sessionsActive", program.sessionsActive());
          entry.put("sessionsCompleted", program.sessionsCompleted());
          entry.put("feedbackEntries", program.feedbackEntries());
          entry.put("completionPercent", percent(program.sessionsCompleted(), program.sessionsTotal()));
          return entry;
        })
        .toList();

    String description = programId == null || programId.isBlank()
        ? "Live analytics summary generated from supervision and notification services."
        : "Live analytics summary generated for the selected program.";

    return new ReportSummary(Instant.now(), programId, description, metrics, breakdown);
  }

  @GetMapping("/accreditation/summary")
  public AccreditationSummary accreditationSummary(@RequestParam(required = false) String programId) {
    SupervisionSummary supervision = fetchSupervisionSummary(programId);
    ReminderSummary reminders = fetchReminderSummary();

    double supervisionCompliance = percent(supervision.sessionsCompleted(), supervision.sessionsTotal());
    double feedbackCoverage = percent(supervision.sessionsWithFeedback(), supervision.sessionsTotal());
    double reminderDelivery = percent(reminders.remindersSent(), reminders.remindersTotal());

    Map<String, Object> metrics = new LinkedHashMap<>();
    metrics.put("supervisionCompliance", supervisionCompliance);
    metrics.put("feedbackCoveragePercent", feedbackCoverage);
    metrics.put("overdueFeedbackItems", supervision.overdueFeedback());
    metrics.put("reminderDeliveryPercent", reminderDelivery);
    metrics.put("programsTracked", supervision.programsTracked());
    metrics.put("sessionsReviewed", supervision.sessionsWithFeedback());
    metrics.put("evidenceGeneratedAt", Instant.now().toString());
    metrics.put("programBreakdown", supervision.programBreakdown());

    return new AccreditationSummary(
        Instant.now(),
        programId,
        "Accreditation-focused summary generated from current workflow data.",
        metrics
    );
  }

  private SupervisionSummary fetchSupervisionSummary(String programId) {
    try {
      return supervisionClient.get()
          .uri(uriBuilder -> uriBuilder.path("/internal/reporting/summary")
              .queryParamIfPresent("programId", Optional.ofNullable(programId).filter(value -> !value.isBlank()))
              .build())
          .retrieve()
          .body(SupervisionSummary.class);
    } catch (Exception ex) {
      return new SupervisionSummary(0, 0, 0, 0, 0, 0, 0, List.of());
    }
  }

  private ReminderSummary fetchReminderSummary() {
    try {
      return notificationClient.get()
          .uri("/internal/reporting/summary")
          .retrieve()
          .body(ReminderSummary.class);
    } catch (Exception ex) {
      return new ReminderSummary(0, 0, 0, 0, 0);
    }
  }

  private double percent(long value, long total) {
    if (total <= 0) {
      return 0.0;
    }
    return Math.round((value * 10000.0) / total) / 100.0;
  }

  public record ReportSummary(
      Instant generatedAt,
      String programId,
      String description,
      Map<String, Object> metrics,
      List<Map<String, Object>> breakdown
  ) {}

  public record AccreditationSummary(
      Instant generatedAt,
      String programId,
      String description,
      Map<String, Object> metrics
  ) {}

  public record ReminderSummary(
      long remindersTotal,
      long remindersPending,
      long remindersSent,
      long remindersDismissed,
      long remindersOverdue
  ) {}

  public record SupervisionSummary(
      int sessionsTotal,
      int sessionsPlanned,
      int sessionsActive,
      int sessionsCompleted,
      int sessionsWithFeedback,
      int overdueFeedback,
      int programsTracked,
      List<ProgramBreakdown> programBreakdown
  ) {}

  public record ProgramBreakdown(
      String programId,
      String programName,
      int sessionsTotal,
      int sessionsActive,
      int sessionsCompleted,
      int feedbackEntries
  ) {}
}

