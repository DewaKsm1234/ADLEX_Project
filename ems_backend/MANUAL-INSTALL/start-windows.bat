@echo off 
echo Starting EMS Backend Server... 
echo. 
echo Installing dependencies... 
npm install 
echo. 
echo Starting server... 
echo Access at: http://localhost:3000 
echo Press Ctrl+C to stop 
echo. 
node server.js 
pause 
