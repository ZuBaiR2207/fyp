package com.fyp.supervision.model;

/**
 * Status of individual thesis milestones (chapters, phases)
 */
public enum MilestoneStatus {
    NOT_STARTED,    // Milestone work has not begun
    IN_PROGRESS,    // Currently working on this milestone
    SUBMITTED,      // Submitted for review
    UNDER_REVIEW,   // Being reviewed by supervisor
    REVISION_REQUIRED, // Needs changes
    APPROVED        // Milestone completed and approved
}
