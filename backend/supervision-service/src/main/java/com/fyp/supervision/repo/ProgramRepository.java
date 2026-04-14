package com.fyp.supervision.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.supervision.model.Program;

public interface ProgramRepository extends JpaRepository<Program, String> {}

