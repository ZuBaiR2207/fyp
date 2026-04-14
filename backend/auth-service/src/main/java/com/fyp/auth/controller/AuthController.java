package com.fyp.auth.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fyp.auth.security.JwtService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fyp.auth.model.User;
import com.fyp.auth.model.UserRole;
import com.fyp.auth.repo.UserRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
    if (userRepository.existsByUsername(request.username())) {
      return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    User user = new User();
    user.setUsername(request.username());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(request.role() == null ? UserRole.STUDENT : request.role());

    user = userRepository.save(user);
    return ResponseEntity.ok(new AuthResponse(user.getUsername(), user.getRole().name(), null));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
    User user = userRepository.findByUsername(request.username()).orElse(null);
    if (user == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    var userDetails = org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
        .password(user.getPasswordHash())
        .roles(user.getRole().name())
        .build();
    String token = jwtService.generateToken(userDetails);

    return ResponseEntity.ok(new AuthResponse(user.getUsername(), user.getRole().name(), token));
  }

  // Self-service profile endpoints (any authenticated user)
  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<UserDto> getMyProfile(Authentication authentication) {
    return userRepository.findByUsername(authentication.getName())
        .map(u -> ResponseEntity.ok(toUserDto(u)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PatchMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<UserDto> updateMyProfile(
      @RequestBody UpdateProfileRequest request,
      Authentication authentication
  ) {
    return userRepository.findByUsername(authentication.getName())
        .map(user -> {
          if (request.photoData() != null)
            user.setPhotoData(request.photoData().isBlank() ? null : request.photoData());
          if (request.fullName() != null)
            user.setFullName(request.fullName().isBlank() ? null : request.fullName().trim());
          if (request.email() != null)
            user.setEmail(request.email().isBlank() ? null : request.email().trim());
          if (request.studentId() != null)
            user.setStudentId(request.studentId().isBlank() ? null : request.studentId().trim());
          if (request.courseName() != null)
            user.setCourseName(request.courseName().isBlank() ? null : request.courseName().trim());
          user = userRepository.save(user);
          return ResponseEntity.ok(toUserDto(user));
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  // Admin user management endpoints
  @GetMapping("/auth/users")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  public ResponseEntity<List<UserDto>> listUsers(
      @RequestParam(value = "role", required = false) String role,
      Authentication authentication
  ) {
    boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");
    boolean isSupervisor = hasRole(authentication, "SUPERVISOR");

    List<User> users;
    if (role != null && !role.isBlank()) {
      try {
        UserRole roleEnum = UserRole.valueOf(role.toUpperCase());
        if (!canManageRole(roleEnum, isAdmin, isSupervisor)) {
          return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        users = userRepository.findByRole(roleEnum);
      } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().build();
      }
    } else {
      if (!isAdmin) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
      users = userRepository.findAll();
    }
    return ResponseEntity.ok(users.stream().map(this::toUserDto).toList());
  }

  @PostMapping("/auth/users")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  public ResponseEntity<UserDto> createUser(
      @RequestBody @Valid CreateUserRequest request,
      Authentication authentication
  ) {
    boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");
    boolean isSupervisor = hasRole(authentication, "SUPERVISOR");
    UserRole requestedRole = request.role() != null ? request.role() : UserRole.STUDENT;

    if (!canManageRole(requestedRole, isAdmin, isSupervisor)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    if (userRepository.existsByUsername(request.username())) {
      return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    User user = new User();
    user.setUsername(request.username());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(requestedRole);
    if (request.fullName() != null && !request.fullName().isBlank()) user.setFullName(request.fullName().trim());
    if (request.email() != null && !request.email().isBlank()) user.setEmail(request.email().trim());
    if (request.studentId() != null && !request.studentId().isBlank()) user.setStudentId(request.studentId().trim());
    if (request.courseName() != null && !request.courseName().isBlank()) user.setCourseName(request.courseName().trim());
    if (request.photoData() != null && !request.photoData().isBlank()) user.setPhotoData(request.photoData());

    user = userRepository.save(user);
    return ResponseEntity.status(HttpStatus.CREATED).body(toUserDto(user));
  }

  @GetMapping("/auth/users/{userId}")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  public ResponseEntity<UserDto> getUser(
      @PathVariable("userId") String userId,
      Authentication authentication
  ) {
    boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");
    boolean isSupervisor = hasRole(authentication, "SUPERVISOR");

    return userRepository.findById(userId)
        .map(u -> {
          if (!canManageRole(u.getRole(), isAdmin, isSupervisor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).<UserDto>build();
          }
          return ResponseEntity.ok(toUserDto(u));
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PutMapping("/auth/users/{userId}")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  public ResponseEntity<UserDto> updateUser(
      @PathVariable("userId") String userId,
      @RequestBody @Valid UpdateUserRequest request,
      Authentication authentication
  ) {
    boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");
    boolean isSupervisor = hasRole(authentication, "SUPERVISOR");

    return userRepository.findById(userId)
        .map(user -> {
          if (!canManageRole(user.getRole(), isAdmin, isSupervisor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).<UserDto>build();
          }
          if (request.role() != null && !canManageRole(request.role(), isAdmin, isSupervisor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).<UserDto>build();
          }
          if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
          }
          if (request.role() != null) {
            user.setRole(request.role());
          }
          if (request.fullName() != null) user.setFullName(request.fullName().isBlank() ? null : request.fullName().trim());
          if (request.email() != null) user.setEmail(request.email().isBlank() ? null : request.email().trim());
          if (request.studentId() != null) user.setStudentId(request.studentId().isBlank() ? null : request.studentId().trim());
          if (request.courseName() != null) user.setCourseName(request.courseName().isBlank() ? null : request.courseName().trim());
          if (request.photoData() != null) user.setPhotoData(request.photoData().isBlank() ? null : request.photoData());
          user = userRepository.save(user);
          return ResponseEntity.ok(toUserDto(user));
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/auth/users/{userId}")
  @PreAuthorize("hasAnyRole('UNIVERSITY_ADMIN','SUPERVISOR')")
  public ResponseEntity<Void> deleteUser(
      @PathVariable("userId") String userId,
      Authentication authentication
  ) {
    boolean isAdmin = hasRole(authentication, "UNIVERSITY_ADMIN");
    boolean isSupervisor = hasRole(authentication, "SUPERVISOR");

    return userRepository.findById(userId)
        .map(user -> {
          if (!canManageRole(user.getRole(), isAdmin, isSupervisor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build();
          }
          userRepository.deleteById(userId);
          return ResponseEntity.noContent().<Void>build();
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  private boolean hasRole(Authentication authentication, String roleName) {
    return authentication.getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + roleName));
  }

  private boolean canManageRole(UserRole role, boolean isAdmin, boolean isSupervisor) {
    if (isAdmin) {
      return true;
    }

    return isSupervisor && role == UserRole.STUDENT;
  }

  private UserDto toUserDto(User user) {
    return new UserDto(
        user.getId(),
        user.getUsername(),
        user.getRole().name(),
        user.getFullName(),
        user.getEmail(),
        user.getStudentId(),
        user.getCourseName(),
        user.getPhotoData()
    );
  }

  public record LoginRequest(
      @NotBlank String username,
      @NotBlank String password
  ) {}

  public record RegisterRequest(
      @NotBlank String username,
      @NotBlank String password,
      UserRole role
  ) {}

  public record AuthResponse(String username, String role, String token) {}

  public record UserDto(
      String id,
      String username,
      String role,
      String fullName,
      String email,
      String studentId,
      String courseName,
      String photoData
  ) {}

  public record CreateUserRequest(
      @NotBlank String username,
      @NotBlank String password,
      UserRole role,
      String fullName,
      String email,
      String studentId,
      String courseName,
      String photoData
  ) {}

  public record UpdateUserRequest(
      String password,
      UserRole role,
      String fullName,
      String email,
      String studentId,
      String courseName,
      String photoData
  ) {}

  // Used by PATCH /api/auth/me — any authenticated user can update their own profile
  public record UpdateProfileRequest(
      String photoData,
      String fullName,
      String email,
      String studentId,
      String courseName
  ) {}
}

