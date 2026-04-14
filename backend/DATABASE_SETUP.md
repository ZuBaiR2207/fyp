# Database Setup Guide

## Prerequisites
- MySQL 8.0 or higher installed and running
- MySQL client or workbench to execute SQL scripts

## Setup Instructions

### 1. Create Database and Import Schema

Run the following command in your terminal (replace `root` with your MySQL user if different):

```bash
mysql -u root -pzubair22 < db-setup.sql
```

Or if you prefer using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your MySQL server with username: `root` and password: `zubair22`
3. Go to File → Open SQL Script
4. Select `db-setup.sql`
5. Execute the script (Ctrl+Enter or click the Execute button)

### 2. Verify Database Creation

Connect to MySQL and run:
```sql
USE fypdb;
SELECT id, username, role, full_name, email FROM users ORDER BY role, username;
```

You should see all users with their roles created.

## Default Users

### Student Accounts
- **Username**: student1, student2, student3
- **Password**: student123
- **Role**: STUDENT

### Supervisor Accounts
- **Username**: supervisor1, supervisor2
- **Password**: supervisor123
- **Role**: SUPERVISOR

### Admin Accounts
- **Username**: admin1, admin2
- **Password**: admin123
- **Role**: UNIVERSITY_ADMIN

## Database Connection

All backend services are configured to connect to:
- **Host**: localhost
- **Port**: 3306
- **Database**: fypdb
- **Username**: root
- **Password**: zubair22

The connection string is:
```
jdbc:mysql://localhost:3306/fypdb
```

## Role-Based Functionality

### STUDENT
- Can view their own profile and submitted work
- Can interact with supervisors
- Can receive notifications about deadlines and feedback

### SUPERVISOR
- Can view assigned students
- Can provide feedback and grades
- Can create reminders for students
- Can view student progress reports

### UNIVERSITY_ADMIN
- Full access to all users
- Can create, update, and delete users
- Can manage user roles
- Can access all system reports
- Can configure system settings

## Important Notes

1. **H2 Database Removed**: All services now exclusively use MySQL
2. **Password Hashing**: All passwords are stored as BCrypt hashes for security
3. **DDL Auto**: Spring JPA is set to `update` mode, which will automatically create/update tables on startup
4. **Shared Database**: All microservices (auth, supervision, notification, etc.) connect to the same `fypdb` database

## Troubleshooting

### Connection Refused
- Ensure MySQL is running: `mysql -u root -pzubair22`
- Check that MySQL is listening on port 3306

### Access Denied
- Verify your username and password are correct (root / zubair22)
- Check user permissions in MySQL

### Database Not Found
- Make sure you ran the db-setup.sql script
- Verify the script executed without errors

## Resetting Data

To reset all users back to the seeded state, run:
```sql
USE fypdb;
TRUNCATE TABLE users;
```

Then re-run the db-setup.sql script to reimport the seeded data.
