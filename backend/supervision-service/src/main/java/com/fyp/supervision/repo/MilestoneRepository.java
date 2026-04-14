package com.fyp.supervision.repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fyp.supervision.model.Milestone;
import com.fyp.supervision.model.MilestoneStatus;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, String> {
    
    /**
     * Find all milestones for a thesis ordered by order index
     */
    List<Milestone> findByThesisIdOrderByOrderIndexAsc(String thesisId);
    
    /**
     * Find milestones by status for a thesis
     */
    List<Milestone> findByThesisIdAndStatusOrderByOrderIndexAsc(String thesisId, MilestoneStatus status);
    
    /**
     * Find overdue milestones (due date passed, not approved)
     */
    @Query("SELECT m FROM Milestone m WHERE m.dueDate < :today AND m.status NOT IN ('APPROVED') AND m.thesis.id = :thesisId")
    List<Milestone> findOverdueMilestones(@Param("thesisId") String thesisId, @Param("today") LocalDate today);
    
    /**
     * Find all overdue milestones across all theses (for admin alerts)
     */
    @Query("SELECT m FROM Milestone m WHERE m.dueDate < :today AND m.status NOT IN ('APPROVED')")
    List<Milestone> findAllOverdueMilestones(@Param("today") LocalDate today);
    
    /**
     * Count completed milestones for a thesis
     */
    long countByThesisIdAndStatus(String thesisId, MilestoneStatus status);
    
    /**
     * Find upcoming milestones (due within X days)
     */
    @Query("SELECT m FROM Milestone m WHERE m.dueDate BETWEEN :today AND :endDate AND m.status NOT IN ('APPROVED')")
    List<Milestone> findUpcomingMilestones(@Param("today") LocalDate today, @Param("endDate") LocalDate endDate);
}
