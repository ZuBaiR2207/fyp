package com.fyp.supervision.controller;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.fyp.supervision.client.NotificationClient;
import com.fyp.supervision.controller.dto.*;
import com.fyp.supervision.model.*;
import com.fyp.supervision.repo.*;

import jakarta.validation.Valid;

/**
 * REST controller for thesis management.
 * Handles thesis lifecycle, milestones, submissions, and defense records.
 */
@RestController
@RequestMapping("/api/theses")
public class ThesisController {

    private final ThesisRepository thesisRepository;
    private final MilestoneRepository milestoneRepository;
    private final ThesisSubmissionRepository submissionRepository;
    private final DefenseRecordRepository defenseRepository;
    private final ProgramRepository programRepository;
    private final NotificationClient notificationClient;

    public ThesisController(
            ThesisRepository thesisRepository,
            MilestoneRepository milestoneRepository,
            ThesisSubmissionRepository submissionRepository,
            DefenseRecordRepository defenseRepository,
            ProgramRepository programRepository,
            NotificationClient notificationClient
    ) {
        this.thesisRepository = thesisRepository;
        this.milestoneRepository = milestoneRepository;
        this.submissionRepository = submissionRepository;
        this.defenseRepository = defenseRepository;
        this.programRepository = programRepository;
        this.notificationClient = notificationClient;
    }

    // ===================== THESIS ENDPOINTS =====================

    /**
     * Create a new thesis (Student or Admin)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<ThesisResponse> createThesis(
            @RequestBody @Valid CreateThesisRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        boolean isStudent = hasRole(authentication, "STUDENT");
        
        // Students can only create their own thesis
        String studentUsername = isStudent ? username : request.supervisorUsername() != null ? 
            // Admin/supervisor creating for a student - need student username somehow
            // For now, require it to be set if admin/supervisor creates
            username : username;
        
        // Check if student already has a thesis
        if (thesisRepository.existsByStudentUsername(studentUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        Thesis thesis = new Thesis();
        thesis.setTitle(request.title());
        thesis.setAbstractText(request.abstractText());
        thesis.setKeywords(request.keywords());
        thesis.setStudentUsername(studentUsername);
        thesis.setSupervisorUsername(request.supervisorUsername());
        thesis.setCoSupervisorUsername(request.coSupervisorUsername());
        thesis.setStartDate(request.startDate());
        thesis.setExpectedEndDate(request.expectedEndDate());
        thesis.setResearchArea(request.researchArea());
        thesis.setStatus(ThesisStatus.TOPIC_PROPOSED);
        thesis.setProgress(0);

        if (request.programId() != null) {
            programRepository.findById(request.programId())
                .ifPresent(thesis::setProgram);
        }

        Thesis saved = thesisRepository.save(thesis);
        
        // Create default milestones
        createDefaultMilestones(saved);
        
        // Publish notification
        notificationClient.publishStatusEvent(new StatusEventRequest(
            "THESIS_CREATED",
            "New thesis proposal: " + saved.getTitle(),
            saved.getId(),
            Instant.now()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(toThesisResponse(saved));
    }

    /**
     * Get thesis by ID
     */
    @GetMapping("/{thesisId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR', 'ACCREDITATION_BODY')")
    @Transactional(readOnly = true)
    public ResponseEntity<ThesisResponse> getThesis(
            @PathVariable("thesisId") String thesisId,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .filter(thesis -> canAccessThesis(thesis, authentication))
            .map(thesis -> ResponseEntity.ok(toThesisResponse(thesis)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get current user's thesis (for students)
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<ThesisResponse> getMyThesis(Authentication authentication) {
        return thesisRepository.findByStudentUsername(authentication.getName())
            .map(thesis -> ResponseEntity.ok(toThesisResponse(thesis)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List theses (filtered by role)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR', 'ACCREDITATION_BODY')")
    @Transactional(readOnly = true)
    public List<ThesisResponse> listTheses(
            @RequestParam(value = "supervisorUsername", required = false) String supervisorUsername,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "programId", required = false) String programId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        boolean isStudent = hasRole(authentication, "STUDENT");
        boolean isSupervisor = hasRole(authentication, "SUPERVISOR");
        boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");

        List<Thesis> theses;

        if (isStudent) {
            // Students see only their own thesis
            theses = thesisRepository.findByStudentUsername(username)
                .map(List::of)
                .orElse(List.of());
        } else if (isSupervisor && supervisorUsername == null) {
            // Supervisors see theses they supervise by default
            theses = thesisRepository.findBySupervisorUsernameOrderByCreatedAtDesc(username);
        } else if (supervisorUsername != null && (isAdmin || isSupervisor)) {
            theses = thesisRepository.findBySupervisorUsernameOrderByCreatedAtDesc(supervisorUsername);
        } else if (status != null) {
            try {
                ThesisStatus statusEnum = ThesisStatus.valueOf(status.toUpperCase());
                theses = thesisRepository.findByStatusOrderByUpdatedAtDesc(statusEnum);
            } catch (IllegalArgumentException e) {
                theses = thesisRepository.findAllByOrderByCreatedAtDesc();
            }
        } else if (programId != null) {
            theses = thesisRepository.findByProgramIdOrderByCreatedAtDesc(programId);
        } else if (isAdmin) {
            theses = thesisRepository.findAllByOrderByCreatedAtDesc();
        } else {
            theses = List.of();
        }

        return theses.stream().map(this::toThesisResponseBrief).toList();
    }

    /**
     * Update thesis (Student can update their own, Supervisor/Admin can update any they have access to)
     */
    @PatchMapping("/{thesisId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<ThesisResponse> updateThesis(
            @PathVariable("thesisId") String thesisId,
            @RequestBody @Valid UpdateThesisRequest request,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .filter(thesis -> canModifyThesis(thesis, authentication))
            .map(thesis -> {
                boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");
                boolean isSupervisor = hasRole(authentication, "SUPERVISOR");

                if (request.title() != null) thesis.setTitle(request.title());
                if (request.abstractText() != null) thesis.setAbstractText(request.abstractText());
                if (request.keywords() != null) thesis.setKeywords(request.keywords());
                if (request.researchArea() != null) thesis.setResearchArea(request.researchArea());
                if (request.startDate() != null) thesis.setStartDate(request.startDate());
                if (request.expectedEndDate() != null) thesis.setExpectedEndDate(request.expectedEndDate());

                // Only supervisor/admin can change status, supervisor assignment, progress
                if (isAdmin || isSupervisor) {
                    if (request.status() != null) thesis.setStatus(request.status());
                    if (request.supervisorUsername() != null) thesis.setSupervisorUsername(request.supervisorUsername());
                    if (request.coSupervisorUsername() != null) thesis.setCoSupervisorUsername(request.coSupervisorUsername());
                    if (request.progress() != null) thesis.setProgress(request.progress());
                    if (request.actualEndDate() != null) thesis.setActualEndDate(request.actualEndDate());
                }

                Thesis saved = thesisRepository.save(thesis);
                return ResponseEntity.ok(toThesisResponse(saved));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Assign supervisor to thesis (Admin only)
     */
    @PostMapping("/{thesisId}/assign-supervisor")
    @PreAuthorize("hasRole('UNIVERSITY_ADMIN')")
    @Transactional
    public ResponseEntity<ThesisResponse> assignSupervisor(
            @PathVariable("thesisId") String thesisId,
            @RequestParam("supervisorUsername") String supervisorUsername,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .map(thesis -> {
                thesis.setSupervisorUsername(supervisorUsername);
                if (thesis.getStatus() == ThesisStatus.TOPIC_PROPOSED) {
                    thesis.setStatus(ThesisStatus.TOPIC_APPROVED);
                }
                Thesis saved = thesisRepository.save(thesis);
                
                notificationClient.publishStatusEvent(new StatusEventRequest(
                    "SUPERVISOR_ASSIGNED",
                    "Supervisor " + supervisorUsername + " assigned to thesis: " + thesis.getTitle(),
                    saved.getId(),
                    Instant.now()
                ));
                
                return ResponseEntity.ok(toThesisResponse(saved));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ===================== MILESTONE ENDPOINTS =====================

    /**
     * Add milestone to thesis
     */
    @PostMapping("/{thesisId}/milestones")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<MilestoneResponse> addMilestone(
            @PathVariable("thesisId") String thesisId,
            @RequestBody @Valid CreateMilestoneRequest request,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .filter(thesis -> canModifyThesis(thesis, authentication))
            .map(thesis -> {
                Milestone milestone = new Milestone();
                milestone.setName(request.name());
                milestone.setDescription(request.description());
                milestone.setOrderIndex(request.orderIndex() != null ? request.orderIndex() : thesis.getMilestones().size());
                milestone.setDueDate(request.dueDate());
                milestone.setWeightPercentage(request.weightPercentage());
                milestone.setStatus(MilestoneStatus.NOT_STARTED);

                thesis.addMilestone(milestone);
                thesisRepository.save(thesis);

                return ResponseEntity.status(HttpStatus.CREATED).body(toMilestoneResponse(milestone));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get milestones for a thesis
     */
    @GetMapping("/{thesisId}/milestones")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR', 'ACCREDITATION_BODY')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<MilestoneResponse>> getMilestones(
            @PathVariable("thesisId") String thesisId,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .filter(thesis -> canAccessThesis(thesis, authentication))
            .map(thesis -> {
                List<MilestoneResponse> milestones = milestoneRepository.findByThesisIdOrderByOrderIndexAsc(thesisId)
                    .stream()
                    .map(this::toMilestoneResponse)
                    .toList();
                return ResponseEntity.ok(milestones);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update milestone (change status, add feedback, etc.)
     */
    @PatchMapping("/{thesisId}/milestones/{milestoneId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<MilestoneResponse> updateMilestone(
            @PathVariable("thesisId") String thesisId,
            @PathVariable("milestoneId") String milestoneId,
            @RequestBody @Valid UpdateMilestoneRequest request,
            Authentication authentication
    ) {
        return milestoneRepository.findById(milestoneId)
            .filter(m -> m.getThesis().getId().equals(thesisId))
            .filter(m -> canModifyThesis(m.getThesis(), authentication))
            .map(milestone -> {
                boolean isStudent = hasRole(authentication, "STUDENT");
                boolean isSupervisor = hasRole(authentication, "SUPERVISOR");
                boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");

                if (request.name() != null) milestone.setName(request.name());
                if (request.description() != null) milestone.setDescription(request.description());
                if (request.orderIndex() != null) milestone.setOrderIndex(request.orderIndex());
                if (request.dueDate() != null) milestone.setDueDate(request.dueDate());
                if (request.weightPercentage() != null) milestone.setWeightPercentage(request.weightPercentage());

                // Students can submit milestones
                if (isStudent && request.status() == MilestoneStatus.SUBMITTED) {
                    milestone.setStatus(MilestoneStatus.SUBMITTED);
                }

                // Supervisors/admins can change any status and add feedback
                if (isSupervisor || isAdmin) {
                    if (request.status() != null) {
                        milestone.setStatus(request.status());
                    }
                    if (request.feedback() != null) {
                        milestone.setFeedback(request.feedback());
                        milestone.setFeedbackBy(authentication.getName());
                    }
                }

                Milestone saved = milestoneRepository.save(milestone);

                // Recalculate thesis progress
                saved.getThesis().recalculateProgress();
                thesisRepository.save(saved.getThesis());

                return ResponseEntity.ok(toMilestoneResponse(saved));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ===================== SUBMISSION ENDPOINTS =====================

    /**
     * Create a submission
     */
    @PostMapping("/{thesisId}/submissions")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<SubmissionResponse> createSubmission(
            @PathVariable("thesisId") String thesisId,
            @RequestBody @Valid CreateSubmissionRequest request,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .filter(thesis -> canAccessThesis(thesis, authentication))
            .map(thesis -> {
                ThesisSubmission submission = new ThesisSubmission();
                submission.setType(request.type());
                submission.setTitle(request.title());
                submission.setDescription(request.description());
                submission.setFileUrl(request.fileUrl());
                submission.setFileName(request.fileName());
                submission.setFileSize(request.fileSize());
                submission.setSubmittedBy(authentication.getName());

                // Calculate version number
                long existingCount = submissionRepository.countByThesisIdAndType(thesisId, request.type());
                submission.setVersionNumber((int) existingCount + 1);

                // Link to milestone if specified
                if (request.milestoneId() != null) {
                    milestoneRepository.findById(request.milestoneId())
                        .ifPresent(submission::setRelatedMilestone);
                }

                thesis.addSubmission(submission);
                thesisRepository.save(thesis);

                // Update thesis status based on submission type
                updateThesisStatusOnSubmission(thesis, request.type());

                notificationClient.publishStatusEvent(new StatusEventRequest(
                    "SUBMISSION_CREATED",
                    request.type() + " submitted for: " + thesis.getTitle(),
                    submission.getId(),
                    Instant.now()
                ));

                return ResponseEntity.status(HttpStatus.CREATED).body(toSubmissionResponse(submission));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get submissions for a thesis
     */
    @GetMapping("/{thesisId}/submissions")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR', 'ACCREDITATION_BODY')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SubmissionResponse>> getSubmissions(
            @PathVariable("thesisId") String thesisId,
            @RequestParam(value = "type", required = false) String type,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .filter(thesis -> canAccessThesis(thesis, authentication))
            .map(thesis -> {
                List<ThesisSubmission> submissions;
                if (type != null) {
                    try {
                        SubmissionType typeEnum = SubmissionType.valueOf(type.toUpperCase());
                        submissions = submissionRepository.findByThesisIdAndTypeOrderBySubmittedAtDesc(thesisId, typeEnum);
                    } catch (IllegalArgumentException e) {
                        submissions = submissionRepository.findByThesisIdOrderBySubmittedAtDesc(thesisId);
                    }
                } else {
                    submissions = submissionRepository.findByThesisIdOrderBySubmittedAtDesc(thesisId);
                }
                return ResponseEntity.ok(submissions.stream().map(this::toSubmissionResponse).toList());
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Review a submission (supervisor/admin)
     */
    @PostMapping("/{thesisId}/submissions/{submissionId}/review")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<SubmissionResponse> reviewSubmission(
            @PathVariable("thesisId") String thesisId,
            @PathVariable("submissionId") String submissionId,
            @RequestBody @Valid ReviewSubmissionRequest request,
            Authentication authentication
    ) {
        return submissionRepository.findById(submissionId)
            .filter(s -> s.getThesis().getId().equals(thesisId))
            .map(submission -> {
                submission.setReviewerUsername(authentication.getName());
                submission.setReviewerComments(request.reviewerComments());
                submission.setIsApproved(request.isApproved());

                ThesisSubmission saved = submissionRepository.save(submission);

                // Update thesis status based on review
                if (Boolean.TRUE.equals(request.isApproved())) {
                    updateThesisStatusOnApproval(saved.getThesis(), saved.getType());
                }

                return ResponseEntity.ok(toSubmissionResponse(saved));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ===================== DEFENSE ENDPOINTS =====================

    /**
     * Schedule defense
     */
    @PostMapping("/{thesisId}/defense")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<DefenseResponse> scheduleDefense(
            @PathVariable("thesisId") String thesisId,
            @RequestBody @Valid CreateDefenseRequest request,
            Authentication authentication
    ) {
        return thesisRepository.findById(thesisId)
            .map(thesis -> {
                // Check if defense already exists
                if (thesis.getDefenseRecord() != null) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).<DefenseResponse>build();
                }

                DefenseRecord defense = new DefenseRecord();
                defense.setScheduledAt(request.scheduledAt());
                defense.setVenue(request.venue());
                defense.setDurationMinutes(request.durationMinutes() != null ? request.durationMinutes() : 60);
                defense.setExaminersList(request.examiners());
                defense.setChairperson(request.chairperson());
                defense.setOutcome(DefenseOutcome.PENDING);

                thesis.setDefenseRecord(defense);
                thesis.setStatus(ThesisStatus.DEFENSE_SCHEDULED);
                thesisRepository.save(thesis);

                notificationClient.publishStatusEvent(new StatusEventRequest(
                    "DEFENSE_SCHEDULED",
                    "Defense scheduled for: " + thesis.getTitle(),
                    defense.getId(),
                    Instant.now()
                ));

                return ResponseEntity.status(HttpStatus.CREATED).body(toDefenseResponse(defense));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get defense record
     */
    @GetMapping("/{thesisId}/defense")
    @PreAuthorize("hasAnyRole('STUDENT', 'UNIVERSITY_ADMIN', 'SUPERVISOR', 'ACCREDITATION_BODY')")
    @Transactional(readOnly = true)
    public ResponseEntity<DefenseResponse> getDefense(
            @PathVariable("thesisId") String thesisId,
            Authentication authentication
    ) {
        var optionalThesis = thesisRepository.findById(thesisId)
            .filter(thesis -> canAccessThesis(thesis, authentication));
        
        if (optionalThesis.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        DefenseRecord defense = optionalThesis.get().getDefenseRecord();
        if (defense == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toDefenseResponse(defense));
    }

    /**
     * Update defense (record outcome)
     */
    @PatchMapping("/{thesisId}/defense")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional
    public ResponseEntity<DefenseResponse> updateDefense(
            @PathVariable("thesisId") String thesisId,
            @RequestBody @Valid UpdateDefenseRequest request,
            Authentication authentication
    ) {
        return defenseRepository.findByThesisId(thesisId)
            .map(defense -> {
                if (request.scheduledAt() != null) defense.setScheduledAt(request.scheduledAt());
                if (request.venue() != null) defense.setVenue(request.venue());
                if (request.durationMinutes() != null) defense.setDurationMinutes(request.durationMinutes());
                if (request.examiners() != null) defense.setExaminersList(request.examiners());
                if (request.chairperson() != null) defense.setChairperson(request.chairperson());
                if (request.comments() != null) defense.setComments(request.comments());
                if (request.correctionsDueDate() != null) defense.setCorrectionsDueDate(request.correctionsDueDate());
                if (request.finalGrade() != null) defense.setFinalGrade(request.finalGrade());

                if (request.outcome() != null) {
                    defense.setOutcome(request.outcome());
                    // Update thesis status based on defense outcome
                    Thesis thesis = defense.getThesis();
                    switch (request.outcome()) {
                        case PASSED -> {
                            thesis.setStatus(ThesisStatus.COMPLETED);
                            thesis.setActualEndDate(LocalDate.now());
                            thesis.setProgress(100);
                        }
                        case MINOR_CORRECTIONS -> thesis.setStatus(ThesisStatus.MINOR_CORRECTIONS);
                        case MAJOR_CORRECTIONS -> thesis.setStatus(ThesisStatus.MAJOR_CORRECTIONS);
                        case FAILED -> thesis.setStatus(ThesisStatus.FAILED);
                        default -> {}
                    }
                    thesisRepository.save(thesis);
                }

                DefenseRecord saved = defenseRepository.save(defense);
                return ResponseEntity.ok(toDefenseResponse(saved));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ===================== ANALYTICS ENDPOINTS =====================

    /**
     * Get thesis statistics (for admin dashboard)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'ACCREDITATION_BODY')")
    @Transactional(readOnly = true)
    public ThesisStatsResponse getStats() {
        long total = thesisRepository.count();
        long inProgress = thesisRepository.countByStatus(ThesisStatus.IN_PROGRESS);
        long completed = thesisRepository.countByStatus(ThesisStatus.COMPLETED);
        long defenseScheduled = thesisRepository.countByStatus(ThesisStatus.DEFENSE_SCHEDULED);
        long atRisk = thesisRepository.findAtRiskTheses(30).size(); // Less than 30% progress

        return new ThesisStatsResponse(total, inProgress, completed, defenseScheduled, atRisk);
    }

    /**
     * Get overdue milestones
     */
    @GetMapping("/overdue-milestones")
    @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN', 'SUPERVISOR')")
    @Transactional(readOnly = true)
    public List<MilestoneResponse> getOverdueMilestones(Authentication authentication) {
        return milestoneRepository.findAllOverdueMilestones(LocalDate.now())
            .stream()
            .map(this::toMilestoneResponse)
            .toList();
    }

    // ===================== HELPER METHODS =====================

    private void createDefaultMilestones(Thesis thesis) {
        String[] defaultMilestones = {
            "Chapter 1: Introduction",
            "Chapter 2: Literature Review",
            "Chapter 3: Methodology",
            "Chapter 4: Implementation/Development",
            "Chapter 5: Results & Analysis",
            "Chapter 6: Conclusion"
        };

        LocalDate startDate = thesis.getStartDate() != null ? thesis.getStartDate() : LocalDate.now();
        LocalDate endDate = thesis.getExpectedEndDate() != null ? thesis.getExpectedEndDate() : startDate.plusMonths(12);
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
        long daysPerMilestone = totalDays / defaultMilestones.length;

        for (int i = 0; i < defaultMilestones.length; i++) {
            Milestone milestone = new Milestone();
            milestone.setName(defaultMilestones[i]);
            milestone.setOrderIndex(i);
            milestone.setDueDate(startDate.plusDays(daysPerMilestone * (i + 1)));
            milestone.setWeightPercentage(100 / defaultMilestones.length);
            milestone.setStatus(MilestoneStatus.NOT_STARTED);
            thesis.addMilestone(milestone);
        }
    }

    private void updateThesisStatusOnSubmission(Thesis thesis, SubmissionType type) {
        switch (type) {
            case PROPOSAL -> thesis.setStatus(ThesisStatus.PROPOSAL_SUBMITTED);
            case FULL_DRAFT -> thesis.setStatus(ThesisStatus.DRAFT_SUBMITTED);
            case FINAL -> thesis.setStatus(ThesisStatus.FINAL_SUBMITTED);
            default -> {}
        }
        thesisRepository.save(thesis);
    }

    private void updateThesisStatusOnApproval(Thesis thesis, SubmissionType type) {
        switch (type) {
            case PROPOSAL -> thesis.setStatus(ThesisStatus.IN_PROGRESS);
            case FULL_DRAFT -> thesis.setStatus(ThesisStatus.READY_FOR_DEFENSE);
            default -> {}
        }
        thesisRepository.save(thesis);
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private boolean canAccessThesis(Thesis thesis, Authentication auth) {
        String username = auth.getName();
        if (hasRole(auth, "UNIVERSITY_ADMIN") || hasRole(auth, "ACCREDITATION_BODY")) {
            return true;
        }
        if (hasRole(auth, "STUDENT")) {
            return thesis.getStudentUsername().equals(username);
        }
        if (hasRole(auth, "SUPERVISOR")) {
            return username.equals(thesis.getSupervisorUsername()) ||
                   username.equals(thesis.getCoSupervisorUsername());
        }
        return false;
    }

    private boolean canModifyThesis(Thesis thesis, Authentication auth) {
        String username = auth.getName();
        if (hasRole(auth, "UNIVERSITY_ADMIN")) {
            return true;
        }
        if (hasRole(auth, "STUDENT")) {
            return thesis.getStudentUsername().equals(username);
        }
        if (hasRole(auth, "SUPERVISOR")) {
            return username.equals(thesis.getSupervisorUsername()) ||
                   username.equals(thesis.getCoSupervisorUsername());
        }
        return false;
    }

    private ThesisResponse toThesisResponse(Thesis thesis) {
        List<MilestoneResponse> milestones = thesis.getMilestones().stream()
            .map(this::toMilestoneResponse)
            .toList();

        DefenseResponse defense = thesis.getDefenseRecord() != null ?
            toDefenseResponse(thesis.getDefenseRecord()) : null;

        return new ThesisResponse(
            thesis.getId(),
            thesis.getTitle(),
            thesis.getAbstractText(),
            thesis.getKeywords(),
            thesis.getStatus(),
            thesis.getStartDate(),
            thesis.getExpectedEndDate(),
            thesis.getActualEndDate(),
            thesis.getStudentUsername(),
            thesis.getSupervisorUsername(),
            thesis.getCoSupervisorUsername(),
            thesis.getProgress(),
            thesis.getProgram() != null ? thesis.getProgram().getId() : null,
            thesis.getProgram() != null ? thesis.getProgram().getName() : null,
            thesis.getResearchArea(),
            thesis.getCreatedAt(),
            thesis.getUpdatedAt(),
            milestones,
            defense
        );
    }

    private ThesisResponse toThesisResponseBrief(Thesis thesis) {
        return new ThesisResponse(
            thesis.getId(),
            thesis.getTitle(),
            null, // No abstract in list view
            thesis.getKeywords(),
            thesis.getStatus(),
            thesis.getStartDate(),
            thesis.getExpectedEndDate(),
            thesis.getActualEndDate(),
            thesis.getStudentUsername(),
            thesis.getSupervisorUsername(),
            thesis.getCoSupervisorUsername(),
            thesis.getProgress(),
            thesis.getProgram() != null ? thesis.getProgram().getId() : null,
            thesis.getProgram() != null ? thesis.getProgram().getName() : null,
            thesis.getResearchArea(),
            thesis.getCreatedAt(),
            thesis.getUpdatedAt(),
            null, // No milestones in list view
            null  // No defense in list view
        );
    }

    private MilestoneResponse toMilestoneResponse(Milestone milestone) {
        return new MilestoneResponse(
            milestone.getId(),
            milestone.getThesis().getId(),
            milestone.getName(),
            milestone.getDescription(),
            milestone.getOrderIndex(),
            milestone.getDueDate(),
            milestone.getStatus(),
            milestone.getSubmittedAt(),
            milestone.getApprovedAt(),
            milestone.getFeedback(),
            milestone.getFeedbackBy(),
            milestone.getFeedbackAt(),
            milestone.getWeightPercentage(),
            milestone.isOverdue(),
            milestone.getCreatedAt()
        );
    }

    private SubmissionResponse toSubmissionResponse(ThesisSubmission submission) {
        return new SubmissionResponse(
            submission.getId(),
            submission.getThesis().getId(),
            submission.getType(),
            submission.getTitle(),
            submission.getDescription(),
            submission.getFileUrl(),
            submission.getFileName(),
            submission.getFileSize(),
            submission.getSubmittedBy(),
            submission.getSubmittedAt(),
            submission.getReviewerUsername(),
            submission.getReviewerComments(),
            submission.getReviewedAt(),
            submission.getIsApproved(),
            submission.getVersionNumber(),
            submission.getRelatedMilestone() != null ? submission.getRelatedMilestone().getId() : null
        );
    }

    private DefenseResponse toDefenseResponse(DefenseRecord defense) {
        return new DefenseResponse(
            defense.getId(),
            defense.getThesis().getId(),
            defense.getScheduledAt(),
            defense.getVenue(),
            defense.getDurationMinutes(),
            defense.getExaminersList(),
            defense.getChairperson(),
            defense.getOutcome(),
            defense.getComments(),
            defense.getCorrectionsDueDate(),
            defense.getCorrectionsSubmittedAt(),
            defense.getFinalGrade(),
            defense.getCreatedAt(),
            defense.getUpdatedAt()
        );
    }

    // DTO for stats
    public record ThesisStatsResponse(
        long total,
        long inProgress,
        long completed,
        long defenseScheduled,
        long atRisk
    ) {}
}
