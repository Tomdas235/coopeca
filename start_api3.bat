@echo off
cd /d "C:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\backend"
echo Starting NestJS API...
call npm run start:dev > C:\api_log.txt 2>&1
echo API started. Check C:\api_log.txt for details.
timeout /t 5 /nobreak >nul