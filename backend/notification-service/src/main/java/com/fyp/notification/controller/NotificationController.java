package com.fyp.notification.controller;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.fyp.notification.model.Announcement;
import com.fyp.notification.model.Reminder;
import com.fyp.notification.model.ReminderStatus;
import com.fyp.notification.repo.AnnouncementRepository;
import com.fyp.notification.repo.ReminderRepository;

import jakarta.validation.Valid;

@RestController
public class NotificationController {
  private static final int CHAT_LIMIT = 150;

  private final AnnouncementRepository announcementRepository;
  private final ReminderRepository reminderRepository;
  private final SimpMessagingTemplate messagingTemplate;
  private final CopyOnWriteArrayList<ChatMessageDto> chatMessages = new CopyOnWriteArrayList<>();

  public NotificationController(
      AnnouncementRepository announcementRepository,
      ReminderRepository reminderRepository,
      SimpMessagingTemplate messagingTemplate
  ) {
    this.announcementRepository = announcementRepository;
    this.reminderRepository = reminderRepository;
    this.messagingTemplate = messagingTemplate;
  }

  @GetMapping("/api/announcements")
  public List<AnnouncementDto> listAnnouncements() {
    return announcementRepository.findAllByOrderByPinnedDescCreatedAtDesc()
        .stream()
        .map(this::toAnnouncementDto)
        .toList();
  }

  @PostMapping("/api/announcements")
  @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
  public ResponseEntity<AnnouncementDto> createAnnouncement(
      @RequestBody @Valid CreateAnnouncementRequest request,
      Authentication authentication
  ) {
    if (!isAdmin(authentication)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    Announcement announcement = new Announcement();
    announcement.setTitle(request.title().trim());
    announcement.setContent(request.content().trim());
    announcement.setImageUrl(trimToNull(request.imageUrl()));
    announcement.setLinkUrl(trimToNull(request.linkUrl()));
    announcement.setPinned(request.pinned());
    announcement.setCreatedAt(Instant.now());
    announcement.setCreatedByUsername(authentication.getName());

    announcement = announcementRepository.save(announcement);
    return ResponseEntity.status(HttpStatus.CREATED).body(toAnnouncementDto(announcement));
  }

  @DeleteMapping("/api/announcements/{announcementId}")
  @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
  public ResponseEntity<Void> deleteAnnouncement(
      @PathVariable("announcementId") String announcementId,
      Authentication authentication
  ) {
    if (!isAdmin(authentication)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    if (!announcementRepository.existsById(announcementId)) {
      return ResponseEntity.notFound().build();
    }
    announcementRepository.deleteById(announcementId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/notifications/me")
  public List<ReminderDto> myNotifications(Principal principal) {
    return reminderRepository.findByRecipientUsernameOrderByDueAtDesc(principal.getName())
        .stream()
        .map(this::toDto)
        .toList();
  }

  @PostMapping("/internal/reminders/feedback-due")
  public void createFeedbackDueReminder(@RequestBody @Valid CreateFeedbackReminderRequest request) {
    Reminder reminder = new Reminder();
    reminder.setRecipientUsername(request.recipientUsername());
    reminder.setRelatedSessionId(request.sessionId());
    reminder.setDueAt(toInstant(request.dueAt()));
    reminder.setMessage(request.message());
    reminder.setStatus(ReminderStatus.PENDING);
    reminder.setCreatedAt(Instant.now());
    reminderRepository.save(reminder);
  }

  @PostMapping("/internal/events/status")
  public void publishStatus(@RequestBody @Valid StatusEventRequest request) {
    messagingTemplate.convertAndSend("/topic/status", new StatusEventDto(
        request.type(),
        request.message(),
        request.sessionId(),
        request.timestamp()
    ));
  }

  @GetMapping("/api/chat/messages")
  public List<ChatMessageDto> listChatMessages() {
    List<ChatMessageDto> ordered = new ArrayList<>(chatMessages);
    ordered.sort((a, b) -> b.sentAt().compareTo(a.sentAt()));
    return ordered;
  }

  @GetMapping("/internal/reporting/summary")
  public ReminderSummaryDto reminderSummary() {
    Instant now = Instant.now();
    List<Reminder> reminders = reminderRepository.findAll();
    long pending = reminders.stream().filter(reminder -> reminder.getStatus() == ReminderStatus.PENDING).count();
    long sent = reminders.stream().filter(reminder -> reminder.getStatus() == ReminderStatus.SENT).count();
    long dismissed = reminders.stream().filter(reminder -> reminder.getStatus() == ReminderStatus.DISMISSED).count();
    long overdue = reminders.stream()
        .filter(reminder -> reminder.getDueAt() != null && reminder.getDueAt().isBefore(now))
        .filter(reminder -> reminder.getStatus() != ReminderStatus.DISMISSED)
        .count();

    return new ReminderSummaryDto(reminders.size(), pending, sent, dismissed, overdue);
  }

  @PostMapping("/api/chat/messages")
  public ChatMessageDto sendChatMessage(@RequestBody @Valid SendChatMessageRequest request, Principal principal) {
    ChatMessageDto message = new ChatMessageDto(
        UUID.randomUUID().toString(),
        principal.getName(),
        request.text().trim(),
        Instant.now()
    );

    chatMessages.add(message);
    if (chatMessages.size() > CHAT_LIMIT) {
      chatMessages.remove(0);
    }

    messagingTemplate.convertAndSend("/topic/chat", message);
    return message;
  }

  private Instant toInstant(LocalDateTime localDateTime) {
    return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
  }

  private ReminderDto toDto(Reminder reminder) {
    return new ReminderDto(
        reminder.getId(),
        reminder.getRecipientUsername(),
        reminder.getRelatedSessionId(),
        reminder.getDueAt(),
        reminder.getMessage(),
        reminder.getStatus()
    );
  }

  private AnnouncementDto toAnnouncementDto(Announcement announcement) {
    return new AnnouncementDto(
        announcement.getId(),
        announcement.getTitle(),
        announcement.getContent(),
        announcement.getImageUrl(),
        announcement.getLinkUrl(),
        announcement.isPinned(),
        announcement.getCreatedAt(),
        announcement.getCreatedByUsername()
    );
  }

  private boolean isAdmin(Authentication authentication) {
    return authentication != null && authentication.getAuthorities().stream()
        .anyMatch(authority -> "ROLE_UNIVERSITY_ADMIN".equals(authority.getAuthority()));
  }

  private String trimToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  public record ReminderDto(
      String id,
      String recipientUsername,
      String relatedSessionId,
      Instant dueAt,
      String message,
      ReminderStatus status
  ) {}

      public record AnnouncementDto(
        String id,
        String title,
        String content,
        String imageUrl,
        String linkUrl,
        boolean pinned,
        Instant createdAt,
        String createdByUsername
      ) {}

      public record CreateAnnouncementRequest(
        @jakarta.validation.constraints.NotBlank(message = "Title is required")
        @jakarta.validation.constraints.Size(max = 180, message = "Title is too long")
        String title,
        @jakarta.validation.constraints.NotBlank(message = "Content is required")
        @jakarta.validation.constraints.Size(max = 4000, message = "Content is too long")
        String content,
        @jakarta.validation.constraints.Size(max = 1000, message = "Image URL is too long")
        String imageUrl,
        @jakarta.validation.constraints.Size(max = 1000, message = "Link URL is too long")
        String linkUrl,
        boolean pinned
      ) {}

  public record CreateFeedbackReminderRequest(
      String sessionId,
      String recipientUsername,
      LocalDateTime dueAt,
      String message
  ) {}

  public record StatusEventRequest(
      String type,
      String message,
      String sessionId,
      Instant timestamp
  ) {}

  public record StatusEventDto(
      String type,
      String message,
      String sessionId,
      Instant timestamp
  ) {}

    public record SendChatMessageRequest(
      @jakarta.validation.constraints.NotBlank(message = "Message text is required")
      @jakarta.validation.constraints.Size(max = 2000, message = "Message is too long")
      String text
    ) {}

    public record ChatMessageDto(
      String id,
      String fromUsername,
      String text,
      Instant sentAt
    ) {}

    public record ReminderSummaryDto(
      long remindersTotal,
      long remindersPending,
      long remindersSent,
      long remindersDismissed,
      long remindersOverdue
    ) {}
}

