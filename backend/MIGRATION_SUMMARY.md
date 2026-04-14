# MySQL Database Migration & JWT Security Implementation

## Summary of Changes

### 1. Database Migration (H2 → MySQL)

**Files Modified:**
- `backend/auth-service/src/main/resources/application.properties`
- `backend/supervision-service/src/main/resources/application.properties`
- `backend/notification-service/src/main/resources/application.properties`
- `backend/auth-service/pom.xml`
- `backend/supervision-service/pom.xml`
- `backend/notification-service/pom.xml`

**Changes:**
- ✅ Removed H2 database dependency
- ✅ Updated to MySQL 8.0 with MySQL Connector/J
- ✅ All services now point to: `jdbc:mysql://localhost:3306/fypdb`
- ✅ Database credentials: `root / zubair22`
- ✅ Hibernate DDL auto set to `update` for schema management

**Database Configuration:**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fypdb
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=zubair22
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

### 2. JWT Security Implementation

**Services Updated:**
- `auth-service` - Issues JWT tokens on login
- `supervision-service` - Validates JWT bearer tokens
- `notification-service` - Validates JWT bearer tokens

**Backend Components Added:**
- `JwtService.java` - Token generation and validation
- `JwtAuthenticationFilter.java` - Bearer token extraction and authentication
- Updated `SecurityConfig.java` - Stateless JWT authentication (no HTTP Basic)

**Key Features:**
- ✅ Stateless JWT authentication
- ✅ Bearer token validation on protected endpoints
- ✅ Role-based access control
- ✅ Token expiration handling
- ✅ Secure password hashing (BCrypt)

### 3. User Role-Based Functionality

Three user roles with specific privileges:

**STUDENT**
- Can view/update their own profile
- Can access supervision and notification endpoints
- Limited to their own data

**SUPERVISOR**
- Can view assigned students
- Can provide feedback and grades
- Can create and manage reminders
- Can access student progress reports

**UNIVERSITY_ADMIN**
- Full access to all users
- Can create, update, delete users
- Can manage user roles
- Can access all system reports

## Database Setup

### Prerequisites
- MySQL 8.0+ running locally
- MySQL client or workbench

### Quick Setup

1. **Run the database setup script:**
```bash
cd backend
mysql -u root -pzubair22 < db-setup.sql
```

2. **Verify tables and users:**
```bash
mysql -u root -pzubair22
USE fypdb;
SELECT id, username, role, full_name FROM users ORDER BY role, username;
```

### Default Test Users

| Username | Password | Role |
|----------|----------|------|
| student1 | student123 | STUDENT |
| student2 | student123 | STUDENT |
| student3 | student123 | STUDENT |
| supervisor1 | supervisor123 | SUPERVISOR |
| supervisor2 | supervisor123 | SUPERVISOR |
| admin1 | admin123 | UNIVERSITY_ADMIN |
| admin2 | admin123 | UNIVERSITY_ADMIN |

## Starting Services

### With JWT Authentication Active

1. **Ensure MySQL is running:**
```bash
mysql -u root -pzubair22
```

2. **Start all backend services:**
```bash
# Terminal 1 - Auth Service (port 8081)
cd backend/auth-service
mvn spring-boot:run

# Terminal 2 - Supervision Service (port 8082)
cd backend/supervision-service
mvn spring-boot:run

# Terminal 3 - Notification Service (port 8083)
cd backend/notification-service
mvn spring-boot:run

# Terminal 4 - Frontend (port 5173)
cd frontend
npm run dev
```

## API Testing Flow

### 1. Login (Get JWT Token)
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"student123"}'
```

Response:
```json
{
  "username": "student1",
  "role": "STUDENT",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Use Token for Protected Endpoints
```bash
curl -X GET http://localhost:8082/api/supervisions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Frontend Automatically Handles JWT
- Login → Stores token in localStorage
- Sends `Authorization: Bearer <token>` on all protected API calls
- Handles token expiration and logout

## Build Verification

All services compiled successfully with MySQL configuration:
```
[INFO] auth-service ....................................... SUCCESS
[INFO] supervision-service ................................ SUCCESS
[INFO] notification-service ............................... SUCCESS
[INFO] BUILD SUCCESS
```

## Migration Notes

- ✅ All existing data structures preserved
- ✅ No code changes needed in service business logic
- ✅ Automatic schema creation via Hibernate DDL auto
- ✅ Frontend auth context unchanged (token storage already implemented)
- ✅ CORS configuration preserved across all services

## Security Improvements

1. **JWT Instead of HTTP Basic**
   - Stateless authentication
   - No credentials in every request
   - Token-based with expiration

2. **Role-Based Access Control**
   - Users limited by their assigned role
   - Admin endpoints protected
   - Student data isolation

3. **Password Security**
   - BCrypt hashing for all passwords
   - Secure token generation
   - Token validation on each request

## Configuration File Locations

- Auth Service: `backend/auth-service/src/main/resources/application.properties`
- Supervision Service: `backend/supervision-service/src/main/resources/application.properties`
- Notification Service: `backend/notification-service/src/main/resources/application.properties`
- Database Setup: `backend/db-setup.sql`
- Documentation: `backend/DATABASE_SETUP.md`

## Troubleshooting

### MySQL Connection Issues
- Verify MySQL is running: `mysql -u root -pzubair22`
- Check port 3306 is accessible
- Ensure database `fypdb` exists after running setup script

### JWT Token Errors
- Ensure `security.jwt.secret` is set in application.properties
- Check token expiration with login page refresh
- Verify `Authorization` header format: `Bearer <token>`

### Role Access Issues
- Check user role is correctly set in database
- Verify @PreAuthorize annotations match user roles
- Review SecurityConfig authority mappings

See `DATABASE_SETUP.md` for detailed database setup and troubleshooting guides.
