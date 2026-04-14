# FYP Microservice Portal (Spring Boot + React)

This repository contains a Spring Boot microservice backend and a React frontend for a supervision workflow portal.

## Tech

- Backend: Spring Boot (3 microservices implemented fully + reporting/integration MVP endpoints)
- Frontend: React (Vite + TypeScript) with WebSocket (STOMP/SockJS)
- Data: H2 in-memory (easy demo); configured to switch to Postgres later

## Services & Ports

- `auth-service`: `http://localhost:8081`
- `supervision-service`: `http://localhost:8082`
- `notification-service` (reminders + WebSocket): `http://localhost:8083`
- `reporting-service` (MVP stub): `http://localhost:8084`
- `integration-service` (MVP stub): `http://localhost:8085`
- Frontend: `http://localhost:5173`

## Demo Accounts

Use the seeded auth users:

- Student: `student1` / `student123`
- Supervisor: `supervisor1` / `supervisor123`
- University admin: `admin1` / `admin123`

## Run

### Backend

Build:

```bash
cd backend
mvn -DskipTests package
```

Run each service in a separate terminal:

```bash
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
```

## What’s Included in the MVP

- Student/University portals with role-based navigation
- Supervision session logging + feedback submission + feedback history
- Workflow reminders (scheduled) and real-time updates via WebSocket topics
- Reporting + external integrations as MVP stubs with working API endpoints (UI wired)

