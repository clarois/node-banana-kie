@echo off
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo npm install failed!
    pause
    exit /b 1
)
echo.
echo =========================================
echo Dependencies installed successfully!
echo =========================================
echo.
echo.
echo Starting server...
call npm run dev


