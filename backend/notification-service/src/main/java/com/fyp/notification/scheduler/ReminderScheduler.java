package com.fyp.notification.scheduler;

import java.time.Instant;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fyp.notification.controller.NotificationController.ReminderDto;
import com.fyp.notification.model.ReminderStatus;
import com.fyp.notification.repo.ReminderRepository;

@Component
public class ReminderScheduler {
  private final ReminderRepository reminderRepository;
  private final SimpMessagingTemplate messagingTemplate;

  public ReminderScheduler(ReminderRepository reminderRepository, SimpMessagingTemplate messagingTemplate) {
    this.reminderRepository = reminderRepository;
    this.messagingTemplate = messagingTemplate;
  }

  @Scheduled(fixedDelayString = "${reminders.scheduler.interval-ms:5000}")
  public void sendDueReminders() {
    Instant now = Instant.now();
    var due = reminderRepository.findByStatusAndDueAtLessThanEqual(ReminderStatus.PENDING, now);
    if (due.isEmpty()) {
      return;
    }

    List<ReminderDto> payload = due.stream().map(r -> {
      r.setStatus(ReminderStatus.SENT);
      r.setSentAt(now);
      reminderRepository.save(r);
      return new ReminderDto(
          r.getId(),
          r.getRecipientUsername(),
          r.getRelatedSessionId(),
          r.getDueAt(),
          r.getMessage(),
          r.getStatus()
      );
    }).toList();

    messagingTemplate.convertAndSend("/topic/reminders", payload);
  }
}

