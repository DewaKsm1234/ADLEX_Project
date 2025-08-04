@echo off
echo ========================================
echo EMS Backend - Fixed Build (No Axios Issues)
echo ========================================
echo.

echo Building executables with better compatibility...
echo.

echo Step 1: Building Windows executable (fixed)...
pkg server.js --targets node18-win-x64 --output ems-backend-windows-fixed.exe --public

echo.
echo Step 2: Building Linux executable (fixed)...
pkg server.js --targets node18-linux-x64 --output ems-backend-linux-fixed --public

echo.
echo ========================================
echo BUILD COMPLETED!
echo ========================================
echo.
echo Files created:
echo - ems-backend-windows-fixed.exe (Windows - fixed)
echo - ems-backend-linux-fixed (Linux - fixed)
echo.
echo Copy these files to your pendrive:
echo - ems-backend-windows-fixed.exe
echo - ems-backend-linux-fixed
echo - config.js
echo - start-windows.bat
echo - start-linux.sh
echo - database_setup.sql
echo - README-PENDRIVE.md
echo.
pause 