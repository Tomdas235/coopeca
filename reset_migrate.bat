@echo off
cd /d "C:\Users\DATOM\OneDrive\Desktop\Tontine Project\coopeca\backend"
echo Resetting Prisma migrations...
npx prisma migrate reset --accept-data-loss
echo Migration reset complete.
pause