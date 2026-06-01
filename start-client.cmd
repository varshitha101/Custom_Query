@echo off
setlocal ENABLEEXTENSIONS

REM Resolve local IP once (avoid long-running commands inside FOR block)
for /f %%i in ('node get-local-ip.js') do set IP_ADDR=%%i
if not defined IP_ADDR set IP_ADDR=127.0.0.1
set SERVER_PORT=8080
set CLIENT_PORT=3000

echo Updating .env files with IP: %IP_ADDR%

REM Update or create client .env file
powershell -NoProfile -Command ^
  "$envFile='client/.env';" ^
  "if (!(Test-Path $envFile)) { 'VITE_BASE_SERVER_URL=http://%IP_ADDR%:%SERVER_PORT%' | Out-File -FilePath $envFile -Encoding ascii } else {" ^
  "  $c = Get-Content $envFile -Raw;" ^
  "  if ($c -match 'VITE_BASE_SERVER_URL=') { $c = $c -replace 'VITE_BASE_SERVER_URL=.*','VITE_BASE_SERVER_URL=http://%IP_ADDR%:%SERVER_PORT%' } else { $c = $c + \"`r`nVITE_BASE_SERVER_URL=http://%IP_ADDR%:%SERVER_PORT%\" }" ^
  "  $c | Set-Content $envFile -Encoding ascii" ^
  "}"

REM Update or create server .env file
powershell -NoProfile -Command ^
  "$envFile='server/.env';" ^
  "if (!(Test-Path $envFile)) { \"IP_ADDRESS=%IP_ADDR%`r`nPORT=%SERVER_PORT%\" | Out-File -FilePath $envFile -Encoding ascii } else {" ^
  "  $c = Get-Content $envFile -Raw;" ^
  "  if ($c -match 'IP_ADDRESS=') { $c = $c -replace 'IP_ADDRESS=.*','IP_ADDRESS=%IP_ADDR%' } else { $c = $c + \"`r`nIP_ADDRESS=%IP_ADDR%\" }" ^
  "  if ($c -match 'PORT=') { $c = $c -replace 'PORT=.*','PORT=%SERVER_PORT%' } else { $c = $c + \"`r`nPORT=%SERVER_PORT%\" }" ^
  "  $c | Set-Content $envFile -Encoding ascii" ^
  "}"

echo .env files updated successfully with IP: %IP_ADDR%

REM Rebuild client with new environment variables
echo Rebuilding client with updated environment variables...
pushd client
call npm run build
popd

echo Starting client...
echo Client running at: http://%IP_ADDR%:%CLIENT_PORT% (backend http://%IP_ADDR%:%SERVER_PORT%)
pushd client
call npm run dev -- --port %CLIENT_PORT% --host
popd
goto :eof
