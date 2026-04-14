package com.fyp.supervision.model;

/**
 * Possible outcomes of a thesis defense (viva voce)
 */
public enum DefenseOutcome {
    PENDING,            // Defense scheduled but not yet held
    PASSED,             // Passed without corrections
    MINOR_CORRECTIONS,  // Passed with minor corrections required
    MAJOR_CORRECTIONS,  // Passed but major revisions needed before final approval
    RESUBMIT,           // Must resubmit and defend again
    FAILED              // Failed the defense
}
