@echo off
echo Pulling latest changes from git...
git pull
if errorlevel 1 (
    echo Git pull failed!
    exit /b 1
)
echo Successfully pulled latest changes!
