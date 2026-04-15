package com.fyp.auth.bootstrap;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.fyp.auth.model.User;
import com.fyp.auth.model.UserRole;
import com.fyp.auth.repo.UserRepository;

@Component
public class DefaultUsers implements CommandLineRunner {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public DefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(String... args) {
    // University administrators
    seedIfMissing("zubair.admin", "zubair22", UserRole.UNIVERSITY_ADMIN,
     "Zubair Sheikh", "zubair.admin@gmail.com", null, null);
    seedIfMissing("admin1", "admin123", UserRole.UNIVERSITY_ADMIN,
        "Dr. Sarah Chen", "sarah.chen@university.edu", null, null);
    seedIfMissing("admin2", "admin123", UserRole.UNIVERSITY_ADMIN,
        "Prof. Michael Tan", "michael.tan@university.edu", null, null);
    seedIfMissing("zubair.admin", "zubair22", UserRole.UNIVERSITY_ADMIN,
        "Zubair Sheikh", "zubair@gmail.com", null, null);
    // Supervisors/Advisors
    seedIfMissing("supervisor1", "supervisor123", UserRole.SUPERVISOR,
        "Dr. Ahmad Rahman", "ahmad.rahman@university.edu", null, null);
    seedIfMissing("supervisor2", "supervisor123", UserRole.SUPERVISOR,
        "Prof. Lisa Wong", "lisa.wong@university.edu", null, null);
    seedIfMissing("supervisor3", "supervisor123", UserRole.SUPERVISOR,
        "Dr. Raj Kumar", "raj.kumar@university.edu", null, null);
    seedIfMissing("supervisor4", "supervisor123", UserRole.SUPERVISOR,
        "Assoc. Prof. Mei Ling", "mei.ling@university.edu", null, null);
    seedIfMissing("supervisor5", "supervisor123", UserRole.SUPERVISOR,
        "Dr. David Lim", "david.lim@university.edu", null, null);

    // Students - Computer Science
    seedIfMissing("student1", "student123", UserRole.STUDENT,
        "Alice Johnson", "alice.johnson@university.edu", "STU-2024-001", "Computer Science");
    seedIfMissing("student2", "student123", UserRole.STUDENT,
        "Bob Smith", "bob.smith@university.edu", "STU-2024-002", "Computer Science");
    seedIfMissing("student3", "student123", UserRole.STUDENT,
        "Charlie Brown", "charlie.brown@university.edu", "STU-2024-003", "Computer Science");
    seedIfMissing("student4", "student123", UserRole.STUDENT,
        "Diana Prince", "diana.prince@university.edu", "STU-2024-004", "Computer Science");
    seedIfMissing("student5", "student123", UserRole.STUDENT,
        "Ethan Hunt", "ethan.hunt@university.edu", "STU-2024-005", "Computer Science");

    // Students - Information Technology
    seedIfMissing("student6", "student123", UserRole.STUDENT,
        "Fiona Green", "fiona.green@university.edu", "STU-2024-006", "Information Technology");
    seedIfMissing("student7", "student123", UserRole.STUDENT,
        "George Wilson", "george.wilson@university.edu", "STU-2024-007", "Information Technology");
    seedIfMissing("student8", "student123", UserRole.STUDENT,
        "Hannah Davis", "hannah.davis@university.edu", "STU-2024-008", "Information Technology");

    // Students - Software Engineering
    seedIfMissing("student9", "student123", UserRole.STUDENT,
        "Ian Taylor", "ian.taylor@university.edu", "STU-2024-009", "Software Engineering");
    seedIfMissing("student10", "student123", UserRole.STUDENT,
        "Julia Martinez", "julia.martinez@university.edu", "STU-2024-010", "Software Engineering");

    // Students - Data Science
    seedIfMissing("student11", "student123", UserRole.STUDENT,
        "Kevin Lee", "kevin.lee@university.edu", "STU-2024-011", "Data Science");
    seedIfMissing("student12", "student123", UserRole.STUDENT,
        "Luna Chen", "luna.chen@university.edu", "STU-2024-012", "Data Science");

    // Accreditation body
    seedIfMissing("accredit1", "accredit123", UserRole.ACCREDITATION_BODY,
        "Dr. Nora Abdullah", "nora.abdullah@mqf.gov.my", null, null);
  }

  private void seedIfMissing(String username, String rawPassword, UserRole role,
      String fullName, String email, String studentId, String courseName) {
    if (userRepository.existsByUsername(username)) {
      return;
    }

    User user = new User();
    user.setUsername(username);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setRole(role);
    if (fullName != null) user.setFullName(fullName);
    if (email != null) user.setEmail(email);
    if (studentId != null) user.setStudentId(studentId);
    if (courseName != null) user.setCourseName(courseName);
    userRepository.save(user);
  }
}

