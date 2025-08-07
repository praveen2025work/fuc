@echo off
setlocal

REM File Upload Center Build Script for Windows
REM Usage: build.bat [environment] [mode]
REM Environment: local, dev, uat, prod (default: local)
REM Mode: dev, build, static (default: build)

set ENVIRONMENT=%1
set MODE=%2

if "%ENVIRONMENT%"=="" set ENVIRONMENT=local
if "%MODE%"=="" set MODE=build

echo ========================================
echo File Upload Center Build Script
echo ========================================
echo Environment: %ENVIRONMENT%
echo Mode: %MODE%
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 20.x or higher
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    exit /b 1
)

REM Copy environment file
if exist ".env.%ENVIRONMENT%" (
    echo Copying .env.%ENVIRONMENT% to .env
    copy ".env.%ENVIRONMENT%" ".env" >nul
) else (
    echo WARNING: .env.%ENVIRONMENT% not found, using existing .env or defaults
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        exit /b 1
    )
)

REM Run the appropriate command based on mode
if "%MODE%"=="dev" (
    echo Starting development server...
    npm run dev
) else if "%MODE%"=="build" (
    echo Building application...
    npm run build
    if errorlevel 1 (
        echo ERROR: Build failed
        exit /b 1
    )
    echo Build completed successfully!
) else if "%MODE%"=="static" (
    echo Building static export for IIS...
    set BUILD_MODE=static
    npm run build
    if errorlevel 1 (
        echo ERROR: Static build failed
        exit /b 1
    )
    echo Static build completed successfully!
    echo Files are ready for IIS deployment in the 'out' folder
) else (
    echo ERROR: Invalid mode '%MODE%'
    echo Valid modes: dev, build, static
    exit /b 1
)

echo ========================================
echo Build script completed
echo ========================================