@echo off
echo Starting MEV Detector servers...

echo Starting backend server on port 3001...
cd /d "c:\Users\Darshan\Desktop\web3 - Copy\server"
start "Backend Server" cmd /k "npm run dev"

timeout /t 5

echo Starting frontend server on port 3002...
cd /d "c:\Users\Darshan\Desktop\web3 - Copy\mev-detector"
set PORT=3003
start "Frontend Server" cmd /k "set PORT=3003 && npm start"

echo Servers started. Check the command windows for any errors.
echo Frontend will be available at http://localhost:3003
echo Backend API will be available at http://localhost:3001
pause