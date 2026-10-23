@echo off
cd /d "C:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\backend"
echo Starting NestJS API directly with node...
node dist/main.js > C:\api_direct.log 2>&1
echo API process running. Check C:\api_direct.log for details.
timeout /t 5 /nobreak >nul