package com.fyp.supervision.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fyp.supervision.model.ThesisSubmission;
import com.fyp.supervision.model.SubmissionType;

@Repository
public interface ThesisSubmissionRepository extends JpaRepository<ThesisSubmission, String> {
    
    /**
     * Find all submissions for a thesis ordered by submission date
     */
    List<ThesisSubmission> findByThesisIdOrderBySubmittedAtDesc(String thesisId);
    
    /**
     * Find submissions by type for a thesis
     */
    List<ThesisSubmission> findByThesisIdAndTypeOrderBySubmittedAtDesc(String thesisId, SubmissionType type);
    
    /**
     * Find latest submission of a specific type
     */
    ThesisSubmission findFirstByThesisIdAndTypeOrderBySubmittedAtDesc(String thesisId, SubmissionType type);
    
    /**
     * Find submissions pending review (no reviewer comments yet)
     */
    List<ThesisSubmission> findByThesisIdAndReviewedAtIsNullOrderBySubmittedAtAsc(String thesisId);
    
    /**
     * Count submissions by type
     */
    long countByThesisIdAndType(String thesisId, SubmissionType type);
    
    /**
     * Find submissions by milestone
     */
    List<ThesisSubmission> findByRelatedMilestoneIdOrderBySubmittedAtDesc(String milestoneId);
}
