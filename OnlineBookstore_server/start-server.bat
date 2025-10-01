@echo off
echo Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Starting the server...
cd /d "%~dp0"
node index.js

pause
