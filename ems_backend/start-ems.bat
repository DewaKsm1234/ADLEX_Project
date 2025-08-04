@echo off
echo Starting EMS Backend Server...
echo.
echo Configuration:
echo - Database Host: 192.168.1.40
echo - Database User: testuser
echo - Server Port: 3000
echo - Network Access: Enabled (0.0.0.0)
echo.
echo Access URLs:
echo - Local: http://localhost:3000
echo - Network: http://192.168.1.40:3000
echo.
echo Press Ctrl+C to stop the server
echo.
ems-backend.exe
pause 