package com.fyp.supervision.bootstrap;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fyp.supervision.model.FeedbackEntry;
import com.fyp.supervision.model.FeedbackStatus;
import com.fyp.supervision.model.Program;
import com.fyp.supervision.model.SessionStatus;
import com.fyp.supervision.model.SupervisionSession;
import com.fyp.supervision.repo.FeedbackEntryRepository;
import com.fyp.supervision.repo.ProgramRepository;
import com.fyp.supervision.repo.SupervisionSessionRepository;

@Component
public class DefaultSupervisionData implements CommandLineRunner {
  private final ProgramRepository programRepository;
  private final SupervisionSessionRepository sessionRepository;
  private final FeedbackEntryRepository feedbackRepository;

  public DefaultSupervisionData(ProgramRepository programRepository, SupervisionSessionRepository sessionRepository, FeedbackEntryRepository feedbackRepository) {
    this.programRepository = programRepository;
    this.sessionRepository = sessionRepository;
    this.feedbackRepository = feedbackRepository;
  }

  @Override
  @Transactional
  public void run(String... args) {
    // Seed programs if empty
    List<Program> programs = programRepository.findAll();
    if (programs.isEmpty()) {
      Program cs = new Program();
      cs.setName("Bachelor of Computer Science");
      programRepository.save(cs);

      Program it = new Program();
      it.setName("Bachelor of Information Technology");
      programRepository.save(it);

      Program se = new Program();
      se.setName("Bachelor of Software Engineering");
      programRepository.save(se);

      Program ds = new Program();
      ds.setName("Bachelor of Data Science");
      programRepository.save(ds);

      Program ai = new Program();
      ai.setName("Bachelor of Artificial Intelligence");
      programRepository.save(ai);

      programs = programRepository.findAll();
    }

    // Create supervision sessions for students
    createSupervisionSessionIfMissing("student1", "supervisor1", programs.get(0), LocalDateTime.now().minusHours(1), SessionStatus.ACTIVE);
    createSupervisionSessionIfMissing("student2", "supervisor2", programs.get(0), LocalDateTime.now().minusDays(1), SessionStatus.COMPLETED);
    createSupervisionSessionIfMissing("student3", "supervisor1", programs.get(0), LocalDateTime.now().plusDays(1), SessionStatus.PLANNED);
    createSupervisionSessionIfMissing("student4", "supervisor3", programs.get(0), LocalDateTime.now().minusHours(2), SessionStatus.ACTIVE);
    createSupervisionSessionIfMissing("student5", "supervisor2", programs.get(0), LocalDateTime.now().plusDays(2), SessionStatus.PLANNED);

    createSupervisionSessionIfMissing("student6", "supervisor3", programs.get(1), LocalDateTime.now().minusDays(2), SessionStatus.COMPLETED);
    createSupervisionSessionIfMissing("student7", "supervisor4", programs.get(1), LocalDateTime.now().plusHours(3), SessionStatus.PLANNED);
    createSupervisionSessionIfMissing("student8", "supervisor3", programs.get(1), LocalDateTime.now().minusHours(3), SessionStatus.ACTIVE);

    createSupervisionSessionIfMissing("student9", "supervisor4", programs.get(2), LocalDateTime.now().minusDays(3), SessionStatus.COMPLETED);
    createSupervisionSessionIfMissing("student10", "supervisor5", programs.get(2), LocalDateTime.now().plusDays(3), SessionStatus.PLANNED);

    createSupervisionSessionIfMissing("student11", "supervisor5", programs.get(3), LocalDateTime.now().minusHours(4), SessionStatus.ACTIVE);
    createSupervisionSessionIfMissing("student12", "supervisor1", programs.get(3), LocalDateTime.now().plusDays(4), SessionStatus.PLANNED);

    // Add feedback entries for completed sessions
    addFeedbackForCompletedSessions();
  }

  private void addFeedbackForCompletedSessions() {
    List<SupervisionSession> completedSessions = sessionRepository.findAll().stream()
        .filter(session -> session.getStatus() == SessionStatus.COMPLETED)
        .toList();

    for (SupervisionSession session : completedSessions) {
      if (feedbackRepository.findAll().stream().noneMatch(f -> f.getSession().getId().equals(session.getId()))) {
        FeedbackEntry feedback = new FeedbackEntry();
        feedback.setSession(session);
        feedback.setSubmittedByUsername(session.getSupervisorUsername());
        feedback.setStatus(FeedbackStatus.SUBMITTED);
        feedback.setSubmittedAt(Instant.now());
        feedback.setFeedbackText("Good progress made in this session. The student demonstrated solid understanding of the project requirements and showed improvement in their research methodology. Recommended to continue with the current approach and focus on data collection in the next phase.");
        feedbackRepository.save(feedback);
      }
    }
  }

  private void createSupervisionSessionIfMissing(String studentUsername, String supervisorUsername,
      Program program, LocalDateTime scheduledAt, SessionStatus status) {
    List<SupervisionSession> existing = sessionRepository.findByStudentUsernameAndScheduledAt(studentUsername, scheduledAt);
    if (!existing.isEmpty()) {
      return;
    }

    SupervisionSession session = new SupervisionSession();
    session.setProgram(program);
    session.setStudentUsername(studentUsername);
    session.setSupervisorUsername(supervisorUsername);
    session.setScheduledAt(scheduledAt);
    session.setFeedbackDeadlineAt(scheduledAt.plusDays(7));
    session.setStatus(status);
    session.setNotes("Demo supervision session for " + studentUsername + " in " + program.getName());

    sessionRepository.save(session);
  }
}

