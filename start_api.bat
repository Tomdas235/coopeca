@echo off
cd /d "C:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\backend"
echo Starting NestJS API...
npm run start:dev > app.log 2>&1
echo API started. Check app.log for details.
timeout /t 3 /nobreak >nul