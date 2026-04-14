package com.fyp.supervision.repo;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fyp.supervision.model.DefenseRecord;
import com.fyp.supervision.model.DefenseOutcome;

@Repository
public interface DefenseRecordRepository extends JpaRepository<DefenseRecord, String> {
    
    /**
     * Find defense record by thesis ID
     */
    Optional<DefenseRecord> findByThesisId(String thesisId);
    
    /**
     * Find upcoming defenses (scheduled but not completed)
     */
    @Query("SELECT d FROM DefenseRecord d WHERE d.scheduledAt > :now AND d.outcome = 'PENDING' ORDER BY d.scheduledAt ASC")
    List<DefenseRecord> findUpcomingDefenses(@Param("now") LocalDateTime now);
    
    /**
     * Find defenses by outcome
     */
    List<DefenseRecord> findByOutcomeOrderByScheduledAtDesc(DefenseOutcome outcome);
    
    /**
     * Find defenses where an examiner is involved
     */
    @Query("SELECT d FROM DefenseRecord d WHERE d.examiners LIKE %:examiner%")
    List<DefenseRecord> findByExaminer(@Param("examiner") String examinerUsername);
    
    /**
     * Find defenses scheduled between dates
     */
    List<DefenseRecord> findByScheduledAtBetweenOrderByScheduledAtAsc(LocalDateTime start, LocalDateTime end);
    
    /**
     * Count defenses by outcome (for analytics)
     */
    long countByOutcome(DefenseOutcome outcome);
}
