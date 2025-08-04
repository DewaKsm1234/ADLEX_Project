@echo off
echo ========================================
echo EMS Backend - Manual Installation Package
echo ========================================
echo.

echo Creating manual installation package...
echo This package will work on any system with Node.js installed
echo.

echo Creating MANUAL-INSTALL folder...
if not exist MANUAL-INSTALL mkdir MANUAL-INSTALL

echo Copying files...
copy server.js MANUAL-INSTALL\
copy config.js MANUAL-INSTALL\
copy package.json MANUAL-INSTALL\
copy database_setup.sql MANUAL-INSTALL\
copy README-PENDRIVE.md MANUAL-INSTALL\

echo Creating start scripts...
echo @echo off > MANUAL-INSTALL\start-windows.bat
echo echo Starting EMS Backend Server... >> MANUAL-INSTALL\start-windows.bat
echo echo. >> MANUAL-INSTALL\start-windows.bat
echo echo Installing dependencies... >> MANUAL-INSTALL\start-windows.bat
echo npm install >> MANUAL-INSTALL\start-windows.bat
echo echo. >> MANUAL-INSTALL\start-windows.bat
echo echo Starting server... >> MANUAL-INSTALL\start-windows.bat
echo echo Access at: http://localhost:3000 >> MANUAL-INSTALL\start-windows.bat
echo echo Press Ctrl+C to stop >> MANUAL-INSTALL\start-windows.bat
echo echo. >> MANUAL-INSTALL\start-windows.bat
echo node server.js >> MANUAL-INSTALL\start-windows.bat
echo pause >> MANUAL-INSTALL\start-windows.bat

echo #!/bin/bash > MANUAL-INSTALL\start-linux.sh
echo echo "Starting EMS Backend Server..." >> MANUAL-INSTALL\start-linux.sh
echo echo "" >> MANUAL-INSTALL\start-linux.sh
echo echo "Installing dependencies..." >> MANUAL-INSTALL\start-linux.sh
echo npm install >> MANUAL-INSTALL\start-linux.sh
echo echo "" >> MANUAL-INSTALL\start-linux.sh
echo echo "Starting server..." >> MANUAL-INSTALL\start-linux.sh
echo echo "Access at: http://localhost:3000" >> MANUAL-INSTALL\start-linux.sh
echo echo "Press Ctrl+C to stop" >> MANUAL-INSTALL\start-linux.sh
echo echo "" >> MANUAL-INSTALL\start-linux.sh
echo node server.js >> MANUAL-INSTALL\start-linux.sh

echo Creating README...
echo # EMS Backend - Manual Installation > MANUAL-INSTALL\README-MANUAL.md
echo. >> MANUAL-INSTALL\README-MANUAL.md
echo This package requires Node.js to be installed on the target system. >> MANUAL-INSTALL\README-MANUAL.md
echo. >> MANUAL-INSTALL\README-MANUAL.md
echo ## Requirements: >> MANUAL-INSTALL\README-MANUAL.md
echo - Node.js 16+ installed >> MANUAL-INSTALL\README-MANUAL.md
echo - MySQL database accessible >> MANUAL-INSTALL\README-MANUAL.md
echo. >> MANUAL-INSTALL\README-MANUAL.md
echo ## Windows: >> MANUAL-INSTALL\README-MANUAL.md
echo 1. Install Node.js from https://nodejs.org/ >> MANUAL-INSTALL\README-MANUAL.md
echo 2. Double-click start-windows.bat >> MANUAL-INSTALL\README-MANUAL.md
echo. >> MANUAL-INSTALL\README-MANUAL.md
echo ## Linux: >> MANUAL-INSTALL\README-MANUAL.md
echo 1. Install Node.js: sudo apt install nodejs npm >> MANUAL-INSTALL\README-MANUAL.md
echo 2. Run: ./start-linux.sh >> MANUAL-INSTALL\README-MANUAL.md

echo.
echo ========================================
echo MANUAL PACKAGE CREATED!
echo ========================================
echo.
echo Manual installation package created in MANUAL-INSTALL folder
echo This package will work on any system with Node.js installed
echo.
echo Copy the MANUAL-INSTALL folder to your pendrive!
echo.
pause 