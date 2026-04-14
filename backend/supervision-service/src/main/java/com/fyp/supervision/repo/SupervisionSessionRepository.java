package com.fyp.supervision.repo;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.supervision.model.SupervisionSession;

public interface SupervisionSessionRepository extends JpaRepository<SupervisionSession, String> {
  List<SupervisionSession> findByStudentUsernameOrderByScheduledAtDesc(String studentUsername);
  List<SupervisionSession> findByStudentUsernameAndSupervisorUsernameOrderByScheduledAtDesc(
      String studentUsername,
      String supervisorUsername
  );
  List<SupervisionSession> findBySupervisorUsernameOrderByScheduledAtDesc(String supervisorUsername);
  List<SupervisionSession> findByStudentUsernameAndScheduledAt(String studentUsername, LocalDateTime scheduledAt);
}

