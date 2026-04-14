package com.fyp.supervision.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.supervision.model.FeedbackEntry;

public interface FeedbackEntryRepository extends JpaRepository<FeedbackEntry, String> {
}