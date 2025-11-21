@echo off
echo Checking port usage...

echo Checking port 3001 (Backend)...
netstat -ano | findstr :3001

echo Checking port 3000 (Frontend default)...
netstat -ano | findstr :3000

echo Checking port 3003 (Frontend alternative)...
netstat -ano | findstr :3003

echo.
echo If any ports show "LISTENING", you may need to stop those processes or use different ports.
echo To stop a process, use: taskkill /PID [process_id] /F
pause