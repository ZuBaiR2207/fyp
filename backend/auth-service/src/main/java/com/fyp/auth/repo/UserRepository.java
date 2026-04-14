package com.fyp.auth.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.auth.model.User;
import com.fyp.auth.model.UserRole;

public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByUsername(String username);
  boolean existsByUsername(String username);
  List<User> findByRole(UserRole role);
}

