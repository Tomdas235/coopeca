@echo off
cd /d "C:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\backend"
echo Running npm build...
npm run build
echo Build complete.
timeout /t 3 /nobreak >nul