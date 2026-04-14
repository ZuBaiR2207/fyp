# FYP Portal - Architecture & Implementation Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                      http://localhost:5173                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ • LoginPage: Authenticates user, gets JWT token             │   │
│  │ • AuthContext: Stores token in localStorage                 │   │
│  │ • apiFetch: Adds "Authorization: Bearer <token>" to all     │   │
│  │   protected API calls                                        │   │
│  │ • StudentPortalPage: Student dashboard (role-restricted)    │   │
│  │ • UniversityPortalPage: Admin dashboard (role-restricted)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP + Bearer JWT Token
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  AUTH SERVICE    │ │ SUPERVISION      │ │ NOTIFICATION     │
│  :8081           │ │ SERVICE :8082    │ │ SERVICE :8083    │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ • Login/Register │ │ • JWT Validation │ │ • JWT Validation │
│ • Issue JWT      │ │ • Supervision    │ │ • Notifications  │
│ • User Mgmt      │ │   endpoints      │ │ • WebSocket/SockJS
│ • Profile Mgmt   │ │ • Role-based AC  │ │ • Real-time msgs │
│ • JWT Validation │ │                  │ │ • Role-based AC  │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ JwtService       │ │ JwtService       │ │ JwtService       │
│ JwtAuthFilter    │ │ JwtAuthFilter    │ │ JwtAuthFilter    │
│ SecurityConfig   │ │ SecurityConfig   │ │ SecurityConfig   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           │ Shared Database
                           │ Connection
                           ▼
        ┌──────────────────────────────────┐
        │     MYSQL DATABASE (fypdb)       │
        │     Host: localhost:3306         │
        │     User: root / zubair22        │
        ├──────────────────────────────────┤
        │ TABLE: users                     │
        │ ┌────────────────────────────┐   │
        │ │ id (UUID)                  │   │
        │ │ username (UNIQUE)          │   │
        │ │ password_hash (BCrypt)     │   │
        │ │ role (STUDENT|SUPERVISOR   │   │
        │ │       |UNIVERSITY_ADMIN)   │   │
        │ │ full_name                  │   │
        │ │ email                      │   │
        │ │ student_id                 │   │
        │ │ course_name                │   │
        │ │ photo_data                 │   │
        │ │ created_at / updated_at    │   │
        │ └────────────────────────────┘   │
        └──────────────────────────────────┘
```

## Authentication Flow

### 1. Login Flow (Get JWT Token)

```
┌─────────────┐
│   Frontend  │
│  LoginPage  │
└──────┬──────┘
       │ POST /api/auth/login
       │ {username, password}
       │
       ▼
┌──────────────────────┐
│  Auth Service 8081   │
│  AuthController      │
└──────┬───────────────┘
       │
       ├─ Check username exists in MySQL
       ├─ Match password (BCrypt)
       │
       ▼
┌──────────────────────┐
│    JwtService        │
│  generateToken()     │
└──────┬───────────────┘
       │ Creates JWT with:
       │ - username (subject)
       │ - role (claim)
       │ - issued_at
       │ - expiration (24h default)
       │
       ▼
┌──────────────────────┐
│   Frontend           │
│  AuthContext.login() │
│                      │
├─ Store token in     │
│  localStorage        │
│                      │
├─ Set auth state     │
│  (token + role)     │
│                      │
└─ Redirect to        │
  dashboard based     │
  on role             │
└──────────────────────┘
```

### 2. Protected API Call Flow

```
┌──────────────────────┐
│   Frontend           │
│  apiFetch(url,auth)  │
└──────┬───────────────┘
       │
       ├─ Extract token from auth object
       │
       ├─ Add header: Authorization: Bearer <token>
       │
       ▼
┌──────────────────────┐
│   Service Endpoint   │
│   (Supervision,      │
│    Notification)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  JwtAuthenticationFilter         │
│  (doFilterInternal)              │
└──────┬───────────────────────────┘
       │
       ├─ Extract Bearer token from header
       │
       ├─ Parse JWT (JwtService)
       │   - Verify signature
       │   - Check expiration
       │   - Extract username & role
       │
       ▼
┌──────────────────────────────────┐
│  Load UserDetails from MySQL     │
│  UserDetailsService              │
└──────┬───────────────────────────┘
       │
       ├─ Query: SELECT * FROM users 
       │   WHERE username = ?
       │
       ▼
┌──────────────────────────────────┐
│  Create Authentication           │
│  UsernamePasswordAuthenticationToken
│  (with user + roles)             │
└──────┬───────────────────────────┘
       │
       ├─ Set in SecurityContext
       │
       ▼
┌──────────────────────────────────┐
│  Protected Endpoint               │
│  (e.g. @PreAuthorize(...))       │
│                                  │
│  Access granted if:              │
│  - Token valid                   │
│  - User role matches endpoint    │
└──────────────────────────────────┘
```

## User Roles & Permissions Matrix

| Feature | STUDENT | SUPERVISOR | UNIVERSITY_ADMIN |
|---------|---------|------------|------------------|
| View own profile | ✓ | ✓ | ✓ |
| Update own profile | ✓ | ✓ | ✓ |
| View all users | ✗ | ✗ | ✓ |
| Create user | ✗ | Limited (students only) | ✓ |
| Update user | ✗ | Own students | ✓ |
| Delete user | ✗ | ✗ | ✓ |
| View supervisions | ✓ (own) | ✓ (assigned) | ✓ |
| Create supervision feedback | ✗ | ✓ | ✓ |
| View notifications | ✓ | ✓ | ✓ |
| Send notifications | ✗ | ✓ | ✓ |
| Access reports | ✗ | Limited | ✓ |

## Default Test Credentials

### Students (Role: STUDENT)
```
student1 / student123
student2 / student123
student3 / student123
```

### Supervisors (Role: SUPERVISOR)
```
supervisor1 / supervisor123
supervisor2 / supervisor123
```

### Admins (Role: UNIVERSITY_ADMIN)
```
admin1 / admin123
admin2 / admin123
```

## JWT Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiJzdHVkZW50MSIsInJvbGUiOiJbIlJPTEVfU1RVREVOVESR0UiXSIsImlhdCI6MTcxMzA3NDc4OCwiZXhwIjoxNzEzMTYxMTg4fQ.
signature_here
│
├─ Header: Algorithm (HS256) + Type (JWT)
│
├─ Payload: 
│  ├─ sub (subject): username
│  ├─ role: user's role
│  ├─ iat: issued at timestamp
│  └─ exp: expiration timestamp (24 hours)
│
└─ Signature: HMAC-SHA256(header.payload, secret)
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,              -- UUID
  username VARCHAR(255) UNIQUE NOT NULL,   -- Login identifier
  password_hash VARCHAR(255) NOT NULL,     -- BCrypt hash
  role VARCHAR(50) NOT NULL,               -- STUDENT|SUPERVISOR|UNIVERSITY_ADMIN
  full_name VARCHAR(255),                  -- Display name
  email VARCHAR(255),                      -- Contact email
  student_id VARCHAR(50),                  -- Student ID (optional)
  course_name VARCHAR(255),                -- Enrolled course (optional)
  photo_data LONGTEXT,                     -- Base64 profile picture (optional)
  created_at TIMESTAMP DEFAULT NOW(),      -- Account creation
  updated_at TIMESTAMP DEFAULT NOW()       -- Last update
);
```

## Configuration Files

### Auth Service (Port 8081)
```properties
# database
spring.datasource.url=jdbc:mysql://localhost:3306/fypdb
spring.datasource.username=root
spring.datasource.password=zubair22

# JWT
security.jwt.secret=change-me-change-me-change-me-change-me-change-me
security.jwt.expiration=86400000  # 24 hours

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

### Supervision Service (Port 8082)
```properties
# database
spring.datasource.url=jdbc:mysql://localhost:3306/fypdb
spring.datasource.username=root
spring.datasource.password=zubair22

# JWT (must match auth-service)
security.jwt.secret=change-me-change-me-change-me-change-me-change-me

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

### Notification Service (Port 8083)
```properties
# database
spring.datasource.url=jdbc:mysql://localhost:3306/fypdb
spring.datasource.username=root
spring.datasource.password=zubair22

# JWT (must match auth-service)
security.jwt.secret=change-me-change-me-change-me-change-me-change-me

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

## Implementation Status

### ✅ Completed

- [x] H2 database removed from all services
- [x] MySQL configuration added (root/zubair22)
- [x] JWT security implemented in auth-service
- [x] JWT validation in supervision & notification services
- [x] User roles defined in database
- [x] Frontend auth context updated
- [x] Stateless authentication (no HTTP Basic)
- [x] Bearer token handling in all services
- [x] Role-based access control (@PreAuthorize)
- [x] Database schema and seed data

### Next Steps (Optional)

- [ ] Add refresh token support for longer sessions
- [ ] Implement token blacklist for logout
- [ ] Add rate limiting on login endpoint
- [ ] Add audit logging for all role-based actions
- [ ] Set up monitoring for failed authentication attempts

## Quick Start Commands

```bash
# 1. Setup MySQL database
cd backend
mysql -u root -pzubair22 < setup-mysql.sql

# 2. Start backend services (in separate terminals)
# Terminal 1
cd backend/auth-service && mvn spring-boot:run

# Terminal 2
cd backend/supervision-service && mvn spring-boot:run

# Terminal 3
cd backend/notification-service && mvn spring-boot:run

# 3. Start frontend
cd frontend && npm run dev

# 4. Visit http://localhost:5173
# Login with: student1 / student123 (or any test user)
```

## Troubleshooting

### "Access Denied" on Protected Endpoints
- Ensure token is in header as: `Authorization: Bearer <token>`
- Verify token hasn't expired
- Check user role matches endpoint requirements

### "Unknown database 'fypdb'"
- Run: `mysql -u root -pzubair22 < setup-mysql.sql`
- Verify MySQL is running

### "Invalid JWT" errors
- Ensure `security.jwt.secret` matches across services
- Clear browser localStorage and re-login
- Check server time is synchronized

### Connection Refused
- Verify MySQL is running: `mysql -u root -pzubair22`
- Check port 3306 is not blocked by firewall
- Verify password is correct (zubair22)
