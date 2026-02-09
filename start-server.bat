@echo off
echo Running npm run build...
call npm run build
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)
echo Build successful! Starting dev server...
call npm run dev
