@echo off
echo Testing Login...
curl -s -X POST -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" http://localhost:8081/api/auth/login > C:\login_response.txt
type C:\login_response.txt
echo.
echo.
echo Testing Announcements...
for /f "tokens=*" %%a in ('type C:\login_response.txt ^| findstr /r "token"') do set RESPONSE=%%a
echo Response: %RESPONSE%
