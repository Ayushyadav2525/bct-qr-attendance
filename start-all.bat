@echo off
TITLE Blockchain QR Attendance - Launcher
echo ================================================================
echo   BLOCKCHAIN QR CODE ATTENDANCE SYSTEM - LOCAL RUNNER
echo ================================================================
echo.

cd /d "%~dp0"

echo [1/4] Starting Hardhat Local Blockchain Node...
start "BCT-Hardhat-Node" cmd /k "cd blockchain && npx hardhat node"
timeout /t 6 /nobreak > nul

echo [2/4] Deploying AttendanceVerification Smart Contract...
cd blockchain
call npx hardhat run scripts/deploy.cjs --network localhost
cd ..

echo [3/4] Seeding Database and Starting Flask API...
start "BCT-Flask-API" cmd /k "venv\Scripts\python.exe backend\run.py"
timeout /t 3 /nobreak > nul

echo [4/4] Starting React Frontend Dev Server...
start "BCT-Frontend-Vite" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ================================================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Node RPC : http://localhost:8545
echo ================================================================
echo.
start http://localhost:5173
pause

