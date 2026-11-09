@echo off
TITLE Blockchain QR Attendance - Stopper
echo Stopping all running BCT Attendance services...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8545" ^| findstr "LISTENING"') do (
    echo Terminating Hardhat node on port 8545 [PID: %%a]
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Terminating Flask backend on port 5000 [PID: %%a]
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Terminating Vite frontend on port 5173 [PID: %%a]
    taskkill /F /PID %%a >nul 2>&1
)

echo All services stopped cleanly.
pause

