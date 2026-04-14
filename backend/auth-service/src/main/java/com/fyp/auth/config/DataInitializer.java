package com.fyp.auth.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.fyp.auth.model.User;
import com.fyp.auth.model.UserRole;
import com.fyp.auth.repo.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Create admin user if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.UNIVERSITY_ADMIN);
            admin.setFullName("System Administrator");
            userRepository.save(admin);
            System.out.println("Created admin user: admin / admin123");
        }

        // Create supervisor user if not exists
        if (!userRepository.existsByUsername("supervisor1")) {
            User supervisor = new User();
            supervisor.setUsername("supervisor1");
            supervisor.setPasswordHash(passwordEncoder.encode("supervisor123"));
            supervisor.setRole(UserRole.SUPERVISOR);
            supervisor.setFullName("Dr. John Smith");
            userRepository.save(supervisor);
            System.out.println("Created supervisor user: supervisor1 / supervisor123");
        }

        // Create student user if not exists
        if (!userRepository.existsByUsername("student1")) {
            User student = new User();
            student.setUsername("student1");
            student.setPasswordHash(passwordEncoder.encode("student123"));
            student.setRole(UserRole.STUDENT);
            student.setFullName("Alice Johnson");
            student.setStudentId("STU001");
            userRepository.save(student);
            System.out.println("Created student user: student1 / student123");
        }

        // Create another student user if not exists
        if (!userRepository.existsByUsername("student2")) {
            User student2 = new User();
            student2.setUsername("student2");
            student2.setPasswordHash(passwordEncoder.encode("student123"));
            student2.setRole(UserRole.STUDENT);
            student2.setFullName("Bob Williams");
            student2.setStudentId("STU002");
            userRepository.save(student2);
            System.out.println("Created student user: student2 / student123");
        }

        System.out.println("Data initialization complete. Users available:");
        System.out.println("  - admin / admin123 (UNIVERSITY_ADMIN)");
        System.out.println("  - supervisor1 / supervisor123 (SUPERVISOR)");
        System.out.println("  - student1 / student123 (STUDENT)");
        System.out.println("  - student2 / student123 (STUDENT)");
    }
}
