@echo off
setlocal ENABLEEXTENSIONS

REM =============================================
REM 0) Resolve local IP and define ports
REM =============================================
for /f %%i in ('node get-local-ip.js') do set IP_ADDR=%%i
if not defined IP_ADDR set IP_ADDR=127.0.0.1
set SERVER_PORT=8080
set CLIENT_PORT=3000

echo Using IP: %IP_ADDR% - Server: %SERVER_PORT% - Client: %CLIENT_PORT%

REM =============================================
REM 1) Update/create .env files with IP/PORT
REM =============================================
echo Updating environment files...

REM Client .env: VITE_BASE_SERVER_URL
powershell -NoProfile -Command ^
  "$envFile='client/.env';" ^
  "if (!(Test-Path $envFile)) { 'VITE_BASE_SERVER_URL=http://%IP_ADDR%:%SERVER_PORT%' | Out-File -FilePath $envFile -Encoding ascii } else {" ^
  "  $c = Get-Content $envFile -Raw;" ^
  "  if ($c -match 'VITE_BASE_SERVER_URL=') { $c = $c -replace 'VITE_BASE_SERVER_URL=.*','VITE_BASE_SERVER_URL=http://%IP_ADDR%:%SERVER_PORT%' } else { $c = $c + \"`r`nVITE_BASE_SERVER_URL=http://%IP_ADDR%:%SERVER_PORT%\" }" ^
  "  $c | Set-Content $envFile -Encoding ascii" ^
  "}"

REM Server .env: IP_ADDRESS and PORT
powershell -NoProfile -Command ^
  "$envFile='server/.env';" ^
  "if (!(Test-Path $envFile)) { \"IP_ADDRESS=%IP_ADDR%`r`nPORT=%SERVER_PORT%\" | Out-File -FilePath $envFile -Encoding ascii } else {" ^
  "  $c = Get-Content $envFile -Raw;" ^
  "  if ($c -match 'IP_ADDRESS=') { $c = $c -replace 'IP_ADDRESS=.*','IP_ADDRESS=%IP_ADDR%' } else { $c = $c + \"`r`nIP_ADDRESS=%IP_ADDR%\" }" ^
  "  if ($c -match 'PORT=') { $c = $c -replace 'PORT=.*','PORT=%SERVER_PORT%' } else { $c = $c + \"`r`nPORT=%SERVER_PORT%\" }" ^
  "  $c | Set-Content $envFile -Encoding ascii" ^
  "}"

echo .env files updated.
echo.

REM =============================================
REM 2) Install root, server and client dependencies (if missing)
REM =============================================
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install root dependencies. Retrying once...
        rd /s /q node_modules
        call npm install
        if errorlevel 1 (
            echo Root dependency install failed.
            exit /b 1
        )
    )
    echo.
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    pushd server
    call npm install
    if errorlevel 1 (
        echo Failed to install server dependencies. Retrying once...
        rd /s /q node_modules
        call npm install
        if errorlevel 1 (
            echo Server dependency install failed.
            popd
            exit /b 1
        )
    )
    popd
    echo.
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    pushd client
    call npm install
    if errorlevel 1 (
        echo Failed to install client dependencies. Retrying once...
        rd /s /q node_modules
        call npm install
        if errorlevel 1 (
            echo Client dependency install failed.
            popd
            exit /b 1
        )
    )
    popd
    echo.
)

REM =============================================
REM 3) Build client dist (always rebuild after env updates)
REM =============================================
echo Building client (vite build)...
pushd client
call npm run build
if errorlevel 1 (
    echo Client build failed. Cleaning dist and retrying...
    rd /s /q dist 2>nul
    call npm run build
    if errorlevel 1 (
        echo Client rebuild failed.
        popd
        exit /b 1
    )
)
popd
echo.

REM =============================================
REM 4) Start server and wait for port to be ready
REM =============================================
echo Starting server...
start "" /B cmd /c "cd server && npm start"

echo Waiting for server to listen on port %SERVER_PORT% ...
set /a MAX_RETRIES=60
set /a COUNT=0
:WAIT_LOOP
powershell -NoProfile -Command "exit !(Test-NetConnection -ComputerName 127.0.0.1 -Port %SERVER_PORT% -WarningAction SilentlyContinue).TcpTestSucceeded"
if %errorlevel%==0 goto SERVER_READY
timeout /t 1 >nul
set /a COUNT+=1
if %COUNT% GEQ %MAX_RETRIES% (
    echo Server did not become ready in time on port %SERVER_PORT%.
    exit /b 1
)
goto WAIT_LOOP

:SERVER_READY
echo Server is ready.

REM =============================================
REM 5) Start client preview on selected port
REM =============================================
echo Starting client preview...
pushd client
echo Client will be accessible at: http://%IP_ADDR%:%CLIENT_PORT%
call npm run preview -- --port %CLIENT_PORT% --host
popd

pause

