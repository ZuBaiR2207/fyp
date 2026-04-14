package com.fyp.supervision.model;

/**
 * Represents the lifecycle stages of a Master's thesis
 */
public enum ThesisStatus {
    // Initial stages
    TOPIC_PROPOSED,         // Student has proposed a topic
    TOPIC_APPROVED,         // Supervisor approved the topic
    TOPIC_REVISION_REQUIRED,// Topic needs revision
    
    // Proposal stage
    PROPOSAL_SUBMITTED,     // Research proposal submitted
    PROPOSAL_UNDER_REVIEW,  // Proposal being reviewed
    PROPOSAL_APPROVED,      // Proposal approved, can start research
    PROPOSAL_REVISION_REQUIRED, // Proposal needs changes
    
    // Research & Writing stage
    IN_PROGRESS,            // Active research/writing phase
    
    // Submission stage
    DRAFT_SUBMITTED,        // Draft thesis submitted for review
    UNDER_REVIEW,           // Being reviewed by supervisor/committee
    REVISIONS_REQUIRED,     // Needs corrections before defense
    READY_FOR_DEFENSE,      // Approved for defense
    
    // Defense stage
    DEFENSE_SCHEDULED,      // Defense date set
    MINOR_CORRECTIONS,      // Passed with minor corrections needed
    MAJOR_CORRECTIONS,      // Passed but major revisions required
    
    // Final stages
    FINAL_SUBMITTED,        // Final corrected version submitted
    COMPLETED,              // Thesis completed and approved
    FAILED                  // Thesis failed
}
