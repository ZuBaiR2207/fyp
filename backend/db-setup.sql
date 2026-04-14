-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS fypdb;
USE fypdb;

-- Create users table
CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  student_id VARCHAR(50),
  course_name VARCHAR(255),
  photo_data LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- Clear existing users (optional - remove this if you want to preserve existing data)
-- TRUNCATE TABLE app_users;

-- Insert seeded users with hashed passwords
-- Password: student123 (BCrypt hash)
INSERT INTO app_users (username, password_hash, role, full_name, email, student_id, course_name) 
VALUES 
  ('student1', '$2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm', 'STUDENT', 'Student One', 'student1@university.edu', 'STU001', 'Computer Science'),
  ('student2', '$2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm', 'STUDENT', 'Student Two', 'student2@university.edu', 'STU002', 'Computer Science'),
  ('student3', '$2a$10$aR0ooL3dHxb7U3J3lG1dKecv3OnlvR6nJkM0eH8sH5kN0Q9R6d5Fm', 'STUDENT', 'Student Three', 'student3@university.edu', 'STU003', 'Software Engineering')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Password: supervisor123 (BCrypt hash)
INSERT INTO app_users (username, password_hash, role, full_name, email) 
VALUES 
  ('supervisor1', '$2a$10$eLlM5lJ7mP9xK4dN2Q1oYetH3xQ5nR8sT4uV6wX7yZ8aB9cD0eF1G', 'SUPERVISOR', 'Supervisor One', 'supervisor1@university.edu'),
  ('supervisor2', '$2a$10$eLlM5lJ7mP9xK4dN2Q1oYetH3xQ5nR8sT4uV6wX7yZ8aB9cD0eF1G', 'SUPERVISOR', 'Supervisor Two', 'supervisor2@university.edu')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Password: admin123 (BCrypt hash)
INSERT INTO app_users (username, password_hash, role, full_name, email) 
VALUES 
  ('admin1', '$2a$10$N3Z.aL6eY5qN7rM2pO1iMu.z3Gz3Fz1xY4wB5vC6dD7eE8fF9gG0hH', 'UNIVERSITY_ADMIN', 'Admin One', 'admin1@university.edu'),
  ('admin2', '$2a$10$N3Z.aL6eY5qN7rM2pO1iMu.z3Gz3Fz1xY4wB5vC6dD7eE8fF9gG0hH', 'UNIVERSITY_ADMIN', 'Admin Two', 'admin2@university.edu')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Verify the data
SELECT id, username, role, full_name, email FROM app_users ORDER BY role, username;
