@echo off

REM Get current epoch time and set log file name
for /f %%i in ('powershell -NoProfile -Command "[int][double]::Parse((Get-Date -UFormat %%s))"') do set LOGFILE=log_%%i.txt

REM Start logging all output to both console and log file using PowerShell Tee-Object
powershell -NoProfile -Command "cmd /c run_inner.bat | Tee-Object -FilePath '%LOGFILE%'"

REM Optionally, show where the log is saved
echo Log saved to %LOGFILE%
pause
exit /b