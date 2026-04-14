package com.fyp.notification.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fyp.notification.model.User;
import com.fyp.notification.model.UserRole;

public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByUsername(String username);
  boolean existsByUsername(String username);
  List<User> findByRole(UserRole role);
}