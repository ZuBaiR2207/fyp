package com.fyp.notification.repo;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.notification.model.Reminder;
import com.fyp.notification.model.ReminderStatus;

public interface ReminderRepository extends JpaRepository<Reminder, String> {
  List<Reminder> findByRecipientUsernameOrderByDueAtDesc(String recipientUsername);
  List<Reminder> findByStatusAndDueAtLessThanEqual(ReminderStatus status, Instant dueAt);
}

