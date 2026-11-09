@echo off
TITLE Push to GitHub - BCT Attendance
cd /d "%~dp0"

echo =======================================================
echo   PUSHING BCT QR ATTENDANCE TO GITHUB
echo   Target: https://github.com/Ayushyadav2525/bct-qr-attendance.git
echo =======================================================
echo.
echo Running: git push -u origin main
echo.
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo =======================================================
    echo [SUCCESS] All files and commits are now live on GitHub!
    echo Refresh your GitHub page or proceed with Vercel/Render.
    echo =======================================================
) else (
    echo =======================================================
    echo [FAILED] Push did not succeed. Check your login.
    echo =======================================================
)
echo.
pause

