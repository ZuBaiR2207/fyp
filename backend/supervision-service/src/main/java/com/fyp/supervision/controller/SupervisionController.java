package com.fyp.supervision.controller;

import java.time.Instant;
import java.time.LocalDateTime;
import java.security.Principal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import com.fyp.supervision.client.NotificationClient;
import com.fyp.supervision.controller.dto.CreateFeedbackReminderRequest;
import com.fyp.supervision.controller.dto.StatusEventRequest;
import com.fyp.supervision.model.FeedbackEntry;
import com.fyp.supervision.model.FeedbackStatus;
import com.fyp.supervision.model.Program;
import com.fyp.supervision.model.SessionStatus;
import com.fyp.supervision.model.SupervisionSession;
import com.fyp.supervision.model.User;
import com.fyp.supervision.repo.ProgramRepository;
import com.fyp.supervision.repo.SupervisionSessionRepository;
import com.fyp.supervision.repo.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class SupervisionController {
   private final UserRepository userRepository;
  private final ProgramRepository programRepository;
  private final SupervisionSessionRepository sessionRepository;
  private final NotificationClient notificationClient;

   public SupervisionController(
      ProgramRepository programRepository,
      SupervisionSessionRepository sessionRepository,
      NotificationClient notificationClient,
      UserRepository userRepository
  ) {
    this.programRepository = programRepository;
    this.sessionRepository = sessionRepository;
    this.notificationClient = notificationClient;
    this.userRepository = userRepository;
  }

  @GetMapping("/programs")
  @PreAuthorize("hasAnyRole('STUDENT','UNIVERSITY_ADMIN','SUPERVISOR','ACCREDITATION_BODY')")
  @Transactional(readOnly = true)
  public List<ProgramResponse> listPrograms() {
    return programRepository.findAll().stream()
        .sorted(Comparator.comparing(Program::getName, String.CASE_INSENSITIVE_ORDER))
        .map(program -> new ProgramResponse(program.getId(), program.getName()))
        .toList();
  }

  @PostMapping("/programs")
  @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
  @Transactional
  public ProgramResponse createProgram(@RequestBody @Valid CreateProgramRequest request) {
    Program program = new Program();
    program.setName(request.name());
    Program saved = programRepository.save(program);
    return new ProgramResponse(saved.getId(), saved.getName());
  }
  
 
  @GetMapping("/student/info")
  @PreAuthorize("hasRole('STUDENT')")
  public User getStudentInfo(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found: " + username));
  }
  @GetMapping("/university/info")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'SUPERVISOR', 'ACCREDITATION_BODY')")
  public User getUniversityAdminInfo(Authentication authentication) {
    String username = authentication.getName();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found: " + username));
  }

  @PostMapping("/sessions")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  @Transactional
  public SessionResponse createSession(@RequestBody @Valid CreateSessionRequest request, Principal principal) {
    Program program = programRepository.findById(request.programId())
        .orElseThrow(() -> new IllegalArgumentException("Program not found"));

    SupervisionSession session = new SupervisionSession();
    session.setProgram(program);
    session.setStudentUsername(request.studentUsername());
    session.setSupervisorUsername(request.supervisorUsername());
    session.setScheduledAt(request.scheduledAt());
    session.setFeedbackDeadlineAt(request.feedbackDeadlineAt());
    session.setStatus(SessionStatus.ACTIVE);
    session.setNotes(request.notes());

    SupervisionSession saved = sessionRepository.save(session);

    if (saved.getFeedbackDeadlineAt() != null) {
      notificationClient.createFeedbackReminder(new CreateFeedbackReminderRequest(
          saved.getId(),
          saved.getStudentUsername(),
          saved.getFeedbackDeadlineAt(),
          "Feedback due for your supervision session on " + saved.getFeedbackDeadlineAt()
      ));
    }

    notificationClient.publishStatusEvent(new StatusEventRequest(
        "SESSION_CREATED",
        "New supervision session created",
        saved.getId(),
        Instant.now()
    ));

    return toSessionResponse(saved);
  }

  @GetMapping("/sessions")
  @PreAuthorize("hasAnyRole('STUDENT','UNIVERSITY_ADMIN','SUPERVISOR','ACCREDITATION_BODY')")
  @Transactional(readOnly = true)
  public List<SessionResponse> listSessions(
      @RequestParam(value = "studentUsername", required = false) String studentUsername,
      Authentication authentication
  ) {
    String me = authentication.getName();
    Set<String> roles = authentication.getAuthorities().stream()
        .map(a -> a.getAuthority())
        .collect(java.util.stream.Collectors.toSet());

    boolean isStudent = roles.contains("ROLE_STUDENT");
    boolean isSupervisor = roles.contains("ROLE_SUPERVISOR");
    boolean isAdmin = roles.contains("ROLE_UNIVERSITY_ADMIN");

    List<SupervisionSession> sessions;
    if (isStudent) {
      sessions = sessionRepository.findByStudentUsernameOrderByScheduledAtDesc(me);
    } else if (studentUsername != null && !studentUsername.isBlank()) {
      sessions = sessionRepository.findByStudentUsernameOrderByScheduledAtDesc(studentUsername);
    } else if (isSupervisor) {
      sessions = sessionRepository.findBySupervisorUsernameOrderByScheduledAtDesc(me);
    } else if (isAdmin) {
      sessions = sessionRepository.findAll().stream()
          .sorted((a, b) -> b.getScheduledAt().compareTo(a.getScheduledAt()))
          .toList();
    } else {
      sessions = List.of();
    }

    return sessions.stream().map(this::toSessionResponse).toList();
  }

  @PostMapping("/sessions/{sessionId}/feedback")
  @PreAuthorize("hasRole('SUPERVISOR')")
  @Transactional
  public FeedbackResponse submitFeedback(
      @PathVariable(value = "sessionId") String sessionId,
      @RequestBody @Valid CreateFeedbackRequest request,
      Principal principal
  ) {
    SupervisionSession session = sessionRepository.findById(sessionId)
        .orElseThrow(() -> new IllegalArgumentException("Session not found"));

    FeedbackEntry entry = new FeedbackEntry();
    entry.setFeedbackText(request.feedbackText());
    entry.setSubmittedByUsername(principal.getName());
    entry.setStatus(FeedbackStatus.SUBMITTED);
    entry.setSubmittedAt(Instant.now());

    session.addFeedbackEntry(entry);
    session.setStatus(SessionStatus.COMPLETED); // in MVP: feedback submission completes the session

    SupervisionSession saved = sessionRepository.save(session);
    notificationClient.publishStatusEvent(new StatusEventRequest(
        "FEEDBACK_SUBMITTED",
        "Feedback submitted for session",
        saved.getId(),
        Instant.now()
    ));

    return new FeedbackResponse(entry.getId(), entry.getSubmittedByUsername(), entry.getStatus(), entry.getSubmittedAt(), entry.getFeedbackText());
  }

  @GetMapping("/sessions/{sessionId}/feedback")
  @PreAuthorize("hasAnyRole('STUDENT','UNIVERSITY_ADMIN','SUPERVISOR','ACCREDITATION_BODY')")
  @Transactional(readOnly = true)
  public List<FeedbackResponse> getFeedbackHistory(
      @PathVariable(value = "sessionId") String sessionId,
      Authentication authentication
  ) {
    SupervisionSession session = sessionRepository.findById(sessionId)
        .orElseThrow(() -> new IllegalArgumentException("Session not found"));

    // MVP access control:
    // - STUDENT can only see their own sessions
    Set<String> roles = authentication.getAuthorities().stream()
        .map(a -> a.getAuthority())
        .collect(java.util.stream.Collectors.toSet());
    boolean isStudent = roles.contains("ROLE_STUDENT");
    if (isStudent && !session.getStudentUsername().equals(authentication.getName())) {
      return List.of();
    }

    return session.getFeedbackEntries().stream()
        .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
        .map(entry -> new FeedbackResponse(
            entry.getId(),
            entry.getSubmittedByUsername(),
            entry.getStatus(),
            entry.getSubmittedAt(),
            entry.getFeedbackText()
        ))
        .toList();
  }

  @PatchMapping("/sessions/{sessionId}/status")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  @Transactional
  public SessionResponse updateStatus(
      @PathVariable(value = "sessionId") String sessionId,
      @RequestBody @Valid UpdateSessionStatusRequest request,
      Principal principal
  ) {
    SupervisionSession session = sessionRepository.findById(sessionId)
        .orElseThrow(() -> new IllegalArgumentException("Session not found"));

    session.setStatus(request.status());
    SupervisionSession saved = sessionRepository.save(session);

    notificationClient.publishStatusEvent(new StatusEventRequest(
        "SESSION_STATUS_UPDATED",
        "Session status updated",
        saved.getId(),
        Instant.now()
    ));

    return toSessionResponse(saved);
  }

  @GetMapping("/internal/reporting/summary")
  @Transactional(readOnly = true)
  public ReportingSummaryResponse reportingSummary(
    @RequestParam(value = "programId", required = false) String programId
  ) {
  List<SupervisionSession> sessions = sessionRepository.findAll().stream()
    .filter(session -> programId == null || programId.isBlank() ||
      (session.getProgram() != null && programId.equals(session.getProgram().getId())))
    .toList();

  int total = sessions.size();
  int planned = (int) sessions.stream().filter(session -> session.getStatus() == SessionStatus.PLANNED).count();
  int active = (int) sessions.stream().filter(session -> session.getStatus() == SessionStatus.ACTIVE).count();
  int completed = (int) sessions.stream().filter(session -> session.getStatus() == SessionStatus.COMPLETED).count();
  int sessionsWithFeedback = (int) sessions.stream()
    .filter(session -> session.getFeedbackEntries() != null && !session.getFeedbackEntries().isEmpty())
    .count();
  int overdueFeedback = (int) sessions.stream()
    .filter(session -> session.getFeedbackDeadlineAt() != null)
    .filter(session -> session.getFeedbackDeadlineAt().isBefore(LocalDateTime.now()))
    .filter(session -> session.getFeedbackEntries() == null || session.getFeedbackEntries().isEmpty())
    .count();

  Map<String, List<SupervisionSession>> grouped = sessions.stream()
    .filter(session -> session.getProgram() != null)
    .collect(java.util.stream.Collectors.groupingBy(session -> session.getProgram().getId()));

  List<ProgramBreakdown> programBreakdown = grouped.entrySet().stream()
    .map(entry -> {
      Program program = entry.getValue().get(0).getProgram();
      List<SupervisionSession> programSessions = entry.getValue();
      int programCompleted = (int) programSessions.stream().filter(session -> session.getStatus() == SessionStatus.COMPLETED).count();
      int programActive = (int) programSessions.stream().filter(session -> session.getStatus() == SessionStatus.ACTIVE).count();
      int feedbackCount = programSessions.stream()
        .mapToInt(session -> session.getFeedbackEntries() == null ? 0 : session.getFeedbackEntries().size())
        .sum();
      return new ProgramBreakdown(
        program.getId(),
        program.getName(),
        programSessions.size(),
        programActive,
        programCompleted,
        feedbackCount
      );
    })
    .sorted(Comparator.comparing(ProgramBreakdown::programName, String.CASE_INSENSITIVE_ORDER))
    .toList();

  // Student status additions
  long studentsEnrolled = userRepository.countByRole(com.fyp.supervision.model.UserRole.STUDENT);
  List<Object[]> studentsByDepartmentRaw = userRepository.countStudentsByCourseName(com.fyp.supervision.model.UserRole.STUDENT);
  java.util.Map<String, Long> studentsByDepartment = new java.util.HashMap<>();
  for (Object[] row : studentsByDepartmentRaw) {
    String courseName = (String) row[0];
    Long count = (Long) row[1];
    studentsByDepartment.put(courseName == null ? "Unknown" : courseName, count);
  }

  return new ReportingSummaryResponse(
    total,
    planned,
    active,
    completed,
    sessionsWithFeedback,
    overdueFeedback,
    programBreakdown.size(),
    programBreakdown,
    studentsEnrolled,
    studentsByDepartment
  );
  }

  private SessionResponse toSessionResponse(SupervisionSession session) {
    return new SessionResponse(
        session.getId(),
        session.getProgram() != null ? session.getProgram().getId() : null,
        session.getProgram() != null ? session.getProgram().getName() : null,
        session.getStudentUsername(),
        session.getSupervisorUsername(),
        session.getScheduledAt(),
        session.getFeedbackDeadlineAt(),
        session.getStatus(),
        session.getNotes(),
        session.getFeedbackEntries() != null ? session.getFeedbackEntries().size() : 0
    );
  }

  public record CreateProgramRequest(String name) {}

  public record ProgramResponse(String id, String name) {}

  public record CreateSessionRequest(
      String programId,
      String studentUsername,
      String supervisorUsername,
      LocalDateTime scheduledAt,
      LocalDateTime feedbackDeadlineAt,
      String notes
  ) {}

  public record CreateFeedbackRequest(String feedbackText) {}

  public record UpdateSessionStatusRequest(SessionStatus status) {}

  public record SessionResponse(
      String id,
      String programId,
      String programName,
      String studentUsername,
      String supervisorUsername,
      LocalDateTime scheduledAt,
      LocalDateTime feedbackDeadlineAt,
      SessionStatus status,
      String notes,
      int feedbackCount
  ) {}

  public record FeedbackResponse(
      String id,
      String submittedByUsername,
      FeedbackStatus status,
      Instant submittedAt,
      String feedbackText
  ) {}

    public record ReportingSummaryResponse(
      int sessionsTotal,
      int sessionsPlanned,
      int sessionsActive,
      int sessionsCompleted,
      int sessionsWithFeedback,
      int overdueFeedback,
      int programsTracked,
      List<ProgramBreakdown> programBreakdown,
      long studentsEnrolled,
      java.util.Map<String, Long> studentsByDepartment
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