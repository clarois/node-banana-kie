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
echo Running npm run build...
call npm run build
set BUILD_STATUS=%errorlevel%
echo.
echo =========================================
echo Build completed with exit code: %BUILD_STATUS%
echo =========================================
echo.

if %BUILD_STATUS% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo =========================================
echo Build successful! Starting dev server...
echo =========================================
echo.

start npm run dev

exit
