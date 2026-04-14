# Quick Reference Card

## 🚀 Start Here

### 1️⃣ Setup MySQL Database (First Time Only)
```bash
cd "d:\Final Year Project\Project\backend"
mysql -u root -pzubair22 < setup-mysql.sql
```

### 2️⃣ Start Backend Services
```bash
# Terminal 1: Auth Service (8081)
cd "d:\Final Year Project\Project\backend\auth-service"
mvn spring-boot:run

# Terminal 2: Supervision Service (8082)
cd "d:\Final Year Project\Project\backend\supervision-service"
mvn spring-boot:run

# Terminal 3: Notification Service (8083)
cd "d:\Final Year Project\Project\backend\notification-service"
mvn spring-boot:run
```

### 3️⃣ Start Frontend
```bash
cd "d:\Final Year Project\Project\frontend"
npm run dev
```

### 4️⃣ Access Application
- **URL**: http://localhost:5173
- **Default User**: student1 / student123

---

## 📊 System Overview

```
Frontend (React)      Auth Service (8081)    MySQL Database
    ↓                      ↓                   (fypdb)
    └──────→ JWT Token ─→ ├─ JwtService          ├─ users
                           ├─ SecurityConfig    ├─ supervisions
Supervision (8082)         ├─ UserDetailsService├─ notifications
Notification (8083)    ├─ Validates JWT     └─ feedback
    ↓                  └─ Authorizes Roles
    └──────→ Bearer Token ──────────────────→
```

---

## 🔐 Authentication Flow

```
1. User submits login form
   ↓
2. POST /api/auth/login (username, password)
   ↓
3. Auth Service validates credentials against MySQL
   ↓
4. JwtService generates JWT token (24-hour expiry)
   ↓
5. Response: { username, role, token }
   ↓
6. Frontend stores token in localStorage
   ↓
7. All future requests include: Authorization: Bearer <token>
   ↓
8. JwtAuthenticationFilter validates token
   ↓
9. Access granted if role matches @PreAuthorize
```

---

## 👥 Test Credentials

| User | Password | Role | Access |
|------|----------|------|--------|
| student1 | student123 | STUDENT | Student dashboard, own data |
| supervisor1 | supervisor123 | SUPERVISOR | Manage students, feedback |
| admin1 | admin123 | UNIVERSITY_ADMIN | Full system access |

---

## 🗄️ Database Connection

```
URL:      jdbc:mysql://localhost:3306/fypdb
User:     root
Password: zubair22
Driver:   com.mysql.cj.jdbc.Driver
```

**Users Table**:
- `id`: UUID primary key
- `username`: Unique login identifier
- `password_hash`: BCrypt encrypted
- `role`: STUDENT | SUPERVISOR | UNIVERSITY_ADMIN
- `full_name`, `email`, `student_id`, `course_name`, `photo_data`

---

## 🔑 API Endpoints

### Authentication
```
POST /api/auth/login
  Request: { username, password }
  Response: { username, role, token }

POST /api/auth/register
  Request: { username, password, role }
  Response: { username, role, token: null }

GET /api/auth/me (requires Bearer token)
  Response: { id, username, role, fullName, ... }
```

### Protected Endpoints (require Bearer token)
```
GET /api/supervisions (Supervision Service)
POST /api/notifications (Notification Service)
GET /api/users (Admin only)
PUT /api/users/{id} (Admin only)
```

**Header Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚙️ Configuration Files

| Service | Port | Config File |
|---------|------|-------------|
| Auth | 8081 | `backend/auth-service/src/main/resources/application.properties` |
| Supervision | 8082 | `backend/supervision-service/src/main/resources/application.properties` |
| Notification | 8083 | `backend/notification-service/src/main/resources/application.properties` |
| Frontend | 5173 | `frontend/vite.config.ts` |

---

## 🛠️ Common Commands

### Database
```bash
# Connect to database
mysql -u root -pzubair22

# View all users
USE fypdb;
SELECT id, username, role, full_name FROM users;

# Reset data (delete all users)
TRUNCATE TABLE users;

# Reimport seed data
mysql -u root -pzubair22 fypdb < setup-mysql.sql
```

### Maven
```bash
# Compile all services
cd backend
mvn clean compile

# Run specific service
mvn -pl auth-service spring-boot:run

# Build without tests
mvn clean package -DskipTests
```

### Frontend
```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

---

## 🚨 Troubleshooting

### "Access Denied" when logging in
- ✓ Verify MySQL is running: `mysql -u root -pzubair22`
- ✓ Check database exists: `mysql -u root -pzubair22 -e "USE fypdb; SELECT COUNT(*) FROM users;"`
- ✓ Should return: `8`

### "Connection refused" error
- ✓ Start MySQL: `net start MySQL` (Windows) or `brew services start mysql` (Mac)
- ✓ Verify on port 3306: `mysql -u root -pzubair22`

### "JWT signature verification failed"
- ✓ Ensure `security.jwt.secret` is same in all services
- ✓ Clear browser localStorage and re-login
- ✓ Check server logs for token issues

### Frontend shows 401 errors
- ✓ Verify token is in header: `Authorization: Bearer <token>`
- ✓ Check token hasn't expired (24 hours)
- ✓ Verify user role matches endpoint requirements

### Compilation errors
```bash
# Clean and recompile
cd backend
mvn clean compile
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DATABASE_SETUP.md` | Database setup instructions |
| `MIGRATION_SUMMARY.md` | Summary of H2→MySQL migration |
| `IMPLEMENTATION_GUIDE.md` | Complete architecture & flows |
| `IMPLEMENTATION_CHECKLIST.md` | Verification checklist |
| `setup-mysql.sql` | Database initialization script |

---

## 🎯 Role-Based Features

### STUDENT
- ✓ View own profile
- ✓ Update own profile
- ✓ View assigned supervisions
- ✓ Receive notifications
- ✗ Manage other users

### SUPERVISOR
- ✓ View own profile
- ✓ View assigned students
- ✓ Create feedback
- ✓ Send notifications
- ✗ Delete users

### UNIVERSITY_ADMIN
- ✓ View all users
- ✓ Create new users
- ✓ Update user roles
- ✓ Delete users
- ✓ Access all reports

---

## 📈 Performance Notes

- **JWT Token Size**: ~500 bytes
- **Token Expiration**: 24 hours (configurable)
- **Database Connection Pool**: 10 connections (default)
- **Session Timeout**: 30 minutes of inactivity (frontend)

---

## 🔒 Security Checklist

- [x] Passwords stored as BCrypt hashes
- [x] JWT tokens signed with HMAC-SHA256
- [x] Stateless authentication (no session storage)
- [x] Role-based access control enforced
- [x] CORS enabled for localhost
- [x] HTTP Basic disabled
- [x] Token expiration enforced

---

## 📞 Quick Links

- **Frontend URL**: http://localhost:5173
- **Auth Service**: http://localhost:8081
- **Supervision Service**: http://localhost:8082
- **Notification Service**: http://localhost:8083
- **MySQL Host**: localhost:3306

---

**Version**: 1.0  
**Date**: April 14, 2026  
**Status**: ✅ Ready for Production
