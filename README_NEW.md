
# FYP Microservice Portal

An end-to-end postgraduate supervision workflow portal for universities, built with Spring Boot microservices and a modern React frontend. The system supports secure authentication, real-time notifications, and role-based access for students, supervisors, and university admins.

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                           │
│                      http://localhost:5173                                │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │ • LoginPage: Authenticates user, gets JWT token             │         │
│  │ • AuthContext: Stores token in localStorage                 │         │
│  │ • apiFetch: Adds "Authorization: Bearer <token>" to all     │         │
│  │   protected API calls                                       │         │
│  │ • Student/University/Supervisor portals (role-restricted)   │         │
│  └──────────────────────────────────────────────────────────────┘         │
└──────────────────────────┬───────────────────────────────────────────────┘
						   │ HTTP + Bearer JWT Token
						   │
┌──────────────────────────┴───────────────────────────────────────────────┐
│                        BACKEND MICROSERVICES (Spring Boot)              │
│                                                                          │
│  [auth-service] (8081)      [supervision-service] (8082)                 │
│  [notification-service] (8083) [reporting-service] (8084)                │
│  [integration-service] (8085)                                            │
│                                                                          │
│  All services connect to:                                                │
│    └── MySQL 8 (dockerized, db: fypdb)                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Backend Services:**
- `auth-service` (8081): Authentication, JWT, user management
- `supervision-service` (8082): Supervision sessions, programs, thesis, role-based access
- `notification-service` (8083): Reminders, announcements, WebSocket (STOMP/SockJS)
- `reporting-service` (8084): Reporting endpoints (MVP)
- `integration-service` (8085): External integrations (MVP)

**Frontend:**
- Modern SPA with role-based portals (Student, Supervisor, University Admin)
- Real-time updates via WebSocket
- Responsive UI, custom branding, and educational logo

**Database:**
- MySQL 8 (dockerized, see `docker-compose.yml`)

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <this-repo-url>
cd Project
```

### 2. Start MySQL & All Services (Recommended: Docker Compose)

```bash
docker-compose up --build
```

Or, run each backend service manually (see QUICK_REFERENCE.md for details).

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

---


## 👥 User Roles & Permissions

| Role             | Permissions                                                                 |
|------------------|----------------------------------------------------------------------------|
| STUDENT          | View/update own profile, access supervisions, receive notifications         |
| SUPERVISOR       | View assigned students, provide feedback, create reminders, view reports    |
| UNIVERSITY_ADMIN | Full access: manage users/roles, all reports, system configuration          |

See `MIGRATION_SUMMARY.md` and `DATABASE_SETUP.md` for more details.

---

## 🧑‍💻 Demo Accounts

| Username     | Password     | Role             |
|--------------|--------------|------------------|
| student1     | student123   | STUDENT          |
| supervisor1  | supervisor123| SUPERVISOR       |
| admin1       | admin123     | UNIVERSITY_ADMIN |

---

---


## 🛠️ Features

- Secure JWT authentication (stateless, 24h expiry, BCrypt password hashing)
- Role-based portals (Student, Supervisor, Admin)
- Supervision session logging, feedback, and feedback history
- Scheduled reminders and real-time notifications (WebSocket, STOMP/SockJS)
- Announcements, program management, and thesis workflow
- Reporting dashboard (MVP, extensible)
- External integrations (MVP, stub endpoints)
- Custom branding: logo, favicon, and portal header
- Docker Compose for full-stack orchestration

---

## 🔑 API & Authentication Flow

**Login & Token Usage:**
1. User logs in via `/api/auth/login` (POST, JSON: `{ username, password }`)
2. Receives JWT token: `{ username, role, token }`
3. Frontend stores token in localStorage
4. All protected API calls include header: `Authorization: Bearer <token>`
5. Backend validates token, checks role, grants/denies access

**Example:**
```bash
curl -X POST http://localhost:8081/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"username":"student1","password":"student123"}'

# Use token for protected endpoint
curl -X GET http://localhost:8082/api/supervisions \
	-H "Authorization: Bearer <token>"
```

**Key Endpoints:**
- `POST /api/auth/login` — Authenticate, get JWT
- `GET /api/auth/me` — Get current user info (token required)
- `GET /api/supervisions` — List supervisions (role required)
- `POST /api/notifications` — Create notification (role required)
- `GET /api/users` — Admin only

See `QUICK_REFERENCE.md` for a full endpoint list.

---

## ⚙️ Configuration & Environment

**Config Files:**

| Service                | Config File Path                                                    |
|------------------------|---------------------------------------------------------------------|
| Auth Service           | backend/auth-service/src/main/resources/application.properties       |
| Supervision Service    | backend/supervision-service/src/main/resources/application.properties|
| Notification Service   | backend/notification-service/src/main/resources/application.properties|
| Frontend               | frontend/vite.config.ts                                             |

**Environment Variables:**
- `MYSQL_ROOT_PASSWORD` (default: zubair22)
- `MYSQL_DATABASE` (default: fypdb)
- `JWT_SECRET` (set in each backend service config)

---

## 🗄️ Database Setup & Migration

**Quick Setup:**
1. Ensure MySQL 8 is running (default port 3306)
2. Run the setup script:
	 ```bash
	 cd backend
	 mysql -u root -pzubair22 < db-setup.sql
	 ```
3. Verify tables and users:
	 ```bash
	 mysql -u root -pzubair22
	 USE fypdb;
	 SELECT id, username, role FROM users;
	 ```

**Notes:**
- All passwords are stored as BCrypt hashes
- Schema auto-created/updated by Spring JPA (DDL auto)
- All services connect to the same `fypdb` database

See `DATABASE_SETUP.md` for full details.

---

## 🚨 Troubleshooting & FAQ

**Common Issues:**
- "Access Denied" — Ensure token is in header, not expired, and user has correct role
- "Unknown database 'fypdb'" — Run the setup script and verify MySQL is running
- "Invalid JWT" — Check `JWT_SECRET` matches across services, clear localStorage, re-login
- "Connection refused" — Verify MySQL is running and port 3306 is open
- Frontend 401 errors — Check token, role, and backend service logs

**Tips:**
- Use `docker-compose logs` to view service output
- Check `QUICK_REFERENCE.md` for more troubleshooting steps

---

## 🎨 Branding & Customization

- **Logo:** Replace `frontend/public/fyp_header_updated.svg` for portal header
- **Favicon:** Edit `frontend/index.html` `<link rel="icon" ... href="/fyp.svg" />`
- **Portal Colors:** Edit CSS in `frontend/src/portal.css` and `App.css`

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📚 Documentation

- See `QUICK_REFERENCE.md` for fast setup and usage
- See `IMPLEMENTATION_GUIDE.md` for architecture and code details
- See `IMPLEMENTATION_CHECKLIST.md` for migration and verification steps

---

## 📝 License & Contact

This project is for academic use (FYP). For questions or collaboration, contact the author.

---

## 🗂️ Project Structure

- `backend/` - Spring Boot microservices (auth, supervision, notification, reporting, integration)
- `frontend/` - React app (Vite, role-based pages, WebSocket, custom branding)
- `docker-compose.yml` - Multi-service orchestration (MySQL + all backends)
- `QUICK_REFERENCE.md` - Fast commands for dev/test
- `IMPLEMENTATION_GUIDE.md` - Architecture & implementation details

---

## ⚡ Tech Stack

- Java 17, Spring Boot 3, Spring Security, JWT
- React 18, Vite, modern CSS
- MySQL 8 (dockerized)
- WebSocket (SockJS/STOMP)
- Docker Compose

---

## 📦 How to Build & Run (Manual)

### Backend

```bash
cd backend
mvn clean package -DskipTests
# Run each service:
java -jar auth-service/target/auth-service-0.0.1-SNAPSHOT.jar
java -jar supervision-service/target/supervision-service-0.0.1-SNAPSHOT.jar
java -jar notification-service/target/notification-service-0.0.1-SNAPSHOT.jar
java -jar reporting-service/target/reporting-service-0.0.1-SNAPSHOT.jar
java -jar integration-service/target/integration-service-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

---

## 📚 Documentation

- See `QUICK_REFERENCE.md` for fast setup and usage
- See `IMPLEMENTATION_GUIDE.md` for architecture and code details
- See `IMPLEMENTATION_CHECKLIST.md` for migration and verification steps

---

## 📝 License

This project is for academic use (FYP). For questions, contact the author.
