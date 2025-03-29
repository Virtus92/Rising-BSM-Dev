@echo off
echo Running Rising-BSM API Integration Tests
echo =======================================

cd %~dp0
echo Installing dependencies...
call npm install

echo.
echo Starting tests...
call npm test

echo.
if %errorlevel% equ 0 (
  echo Tests completed successfully!
) else (
  echo Tests failed with errors.
)

pause
