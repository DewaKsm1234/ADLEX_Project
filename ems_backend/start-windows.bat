@echo off
echo ========================================
echo EMS Backend Server - Windows
echo ========================================
echo.

echo Configuration:
echo - Database Host: 192.168.1.40
echo - Database User: testuser
echo - Server Port: 3000
echo - Network Access: Enabled
echo.

echo Access URLs:
echo - Local: http://localhost:3000
echo - Network: http://192.168.1.40:3000
echo.

echo Starting server...
echo Press Ctrl+C to stop the server
echo.

ems-backend-windows.exe

echo.
echo Server stopped.
pause 