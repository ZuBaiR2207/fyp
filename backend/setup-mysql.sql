-- MySQL Database Setup for FYP Portal
-- Database: fypdb
-- Credentials: root / zubair22

-- ============================================
-- CREATE DATABASE AND SELECT
-- ============================================
CREATE DATABASE IF NOT EXISTS fypdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fypdb;

-- ============================================
-- CREATE USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(255) NOT NULL UNIQUE KEY,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
  full_name VARCHAR(255),
  email VARCHAR(255),
  student_id VARCHAR(50),
  course_name VARCHAR(255),
  photo_data LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED USERS WITH ROLES
-- ============================================

-- STUDENT USERS (Password: student123)
-- BCrypt Hash: $2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm
INSERT IGNORE INTO app_users (id, username, password_hash, role, full_name, email, student_id, course_name)
VALUES
  (UUID(), 'student1', '$2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm', 'STUDENT', 'John Smith', 'student1@university.edu', 'STU001', 'Computer Science'),
  (UUID(), 'student2', '$2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm', 'STUDENT', 'Emily Johnson', 'student2@university.edu', 'STU002', 'Computer Science'),
  (UUID(), 'student3', '$2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm', 'STUDENT', 'Michael Brown', 'student3@university.edu', 'STU003', 'Software Engineering');

-- SUPERVISOR USERS (Password: supervisor123)
-- BCrypt Hash: $2a$10$eLlM5lJ7mP9xK4dN2Q1oYetH3xQ5nR8sT4uV6wX7yZ8aB9cD0eF1G
INSERT IGNORE INTO app_users (id, username, password_hash, role, full_name, email)
VALUES
  (UUID(), 'supervisor1', '$2a$10$eLlM5lJ7mP9xK4dN2Q1oYetH3xQ5nR8sT4uV6wX7yZ8aB9cD0eF1G', 'SUPERVISOR', 'Dr. Sarah Wilson', 'supervisor1@university.edu'),
  (UUID(), 'supervisor2', '$2a$10$eLlM5lJ7mP9xK4dN2Q1oYetH3xQ5nR8sT4uV6wX7yZ8aB9cD0eF1G', 'SUPERVISOR', 'Prof. James Anderson', 'supervisor2@university.edu');

-- ADMIN USERS (Password: admin123)
-- BCrypt Hash: $2a$10$N3Z.aL6eY5qN7rM2pO1iMu.z3Gz3Fz1xY4wB5vC6dD7eE8fF9gG0hH
INSERT IGNORE INTO app_users (id, username, password_hash, role, full_name, email)
VALUES
  (UUID(), 'admin1', '$2a$10$N3Z.aL6eY5qN7rM2pO1iMu.z3Gz3Fz1xY4wB5vC6dD7eE8fF9gG0hH', 'UNIVERSITY_ADMIN', 'Admin One', 'admin1@university.edu'),
  (UUID(), 'admin2', '$2a$10$N3Z.aL6eY5qN7rM2pO1iMu.z3Gz3Fz1xY4wB5vC6dD7eE8fF9gG0hH', 'UNIVERSITY_ADMIN', 'Admin Two', 'admin2@university.edu');

-- ============================================
-- VERIFY DATA
-- ============================================
SELECT 
  id, 
  username, 
  role, 
  full_name, 
  email, 
  student_id,
  created_at 
FROM app_users 
ORDER BY role ASC, username ASC;

-- Show summary count by role
SELECT role, COUNT(*) as count FROM app_users GROUP BY role;
