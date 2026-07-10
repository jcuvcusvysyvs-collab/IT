@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo ========================================
echo   Upload site changes to GitHub
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 goto NO_GIT

set /p MSG=What changed? 
if "%MSG%"=="" goto NO_MSG

echo.
echo Step 1/3: Adding files...
git add .
if errorlevel 1 goto ADD_FAIL

echo Step 2/3: Creating commit...
git commit -m "%MSG%"
if errorlevel 1 goto NO_CHANGES

echo Step 3/3: Pushing to GitHub...
git push
if errorlevel 1 goto PUSH_FAIL

echo.
echo ========================================
echo   Done. Site updates in 1-2 minutes.
echo   https://jcuvcusvysyvs-collab.github.io/IT/
echo ========================================
echo.
pause
exit /b 0

:NO_GIT
echo.
echo ERROR: Git not found. Install from https://git-scm.com
pause
exit /b 1

:NO_MSG
echo.
echo ERROR: Enter a short description of changes.
pause
exit /b 1

:ADD_FAIL
echo.
echo ERROR: Could not add files.
pause
exit /b 1

:NO_CHANGES
echo.
echo INFO: No new changes to upload.
pause
exit /b 0

:PUSH_FAIL
echo.
echo ERROR: Push failed. Check internet and GitHub login.
pause
exit /b 1
