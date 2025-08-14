@echo off
for /f %%i in ('node get-local-ip.js') do (
  echo Updating .env files with IP address: %%i
  
  REM Update client .env file - use proxy instead of direct HTTP URL
  powershell -Command "(Get-Content './client/.env') -replace 'VITE_BASE_SERVER_URL=.*', 'VITE_BASE_SERVER_URL=/api' | Set-Content './client/.env'"
  
  REM Update server .env file - set IP_ADDRESS to system IP
  powershell -Command "(Get-Content './server/.env') -replace 'IP_ADDRESS=.*', 'IP_ADDRESS=%%i' | Set-Content './server/.env'"
  
  echo .env files updated successfully with IP: %%i
  
  REM Check and generate certificates if needed
  echo Checking SSL certificates...
  call :check_and_generate_certs %%i
  
  REM Update vite.config.js with new IP address
  echo Updating vite.config.js with IP: %%i
  call :update_vite_config %%i
  
  REM Rebuild client with new environment variables
  echo Rebuilding client with updated environment variables...
  cd client
  npm run build
  cd ..
  
  echo Starting server and client...
  
  REM Start server in background - fixed command
  start "Server" /D "server" cmd /k "npm start"
  
  REM Wait a moment for server to start
  timeout /t 5 /nobreak >nul
  
  REM Start client with Vite dev server (HTTPS on port 3000)
  echo Client running at: https://%%i:3000
  cd client
  npm run dev -- --port 3000
)
goto :eof

:check_and_generate_certs
set current_ip=%1
set cert_file=.\client\certs\%current_ip%+3.pem
set key_file=.\client\certs\%current_ip%+3-key.pem
set need_new_cert=0

REM Check if certificate files exist
if not exist "%cert_file%" (
  echo Certificate files not found for IP %current_ip%
  set need_new_cert=1
) else (
  echo Certificate files found, checking expiry...
  
  REM Check certificate expiry (check if it expires within 30 days)
  powershell -Command "try { $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2('%cert_file%'); $daysLeft = ($cert.NotAfter - (Get-Date)).Days; if ($daysLeft -lt 30) { exit 1 } else { Write-Host 'Certificate valid for' $daysLeft 'more days'; exit 0 } } catch { exit 1 }"
  if errorlevel 1 (
    echo Certificate is expired or will expire soon
    set need_new_cert=1
  )
)

REM Generate new certificate if needed
if %need_new_cert%==1 (
  echo Generating new SSL certificate for IP %current_ip%...
  
  REM Check if mkcert is installed
  echo Checking if mkcert is installed...
  mkcert -version >nul 2>&1
  if errorlevel 1 (
    echo mkcert not found. Installing mkcert...
    
    REM Check if chocolatey is available
    choco --version >nul 2>&1
    if errorlevel 1 (
      echo Chocolatey not found. Installing chocolatey first...
      powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
      if errorlevel 1 (
        echo Failed to install chocolatey. Please install mkcert manually.
        echo Visit: https://github.com/FiloSottile/mkcert#installation
        pause
        goto :eof
      )
      echo Chocolatey installed successfully. Please restart the command prompt and run this script again.
      pause
      goto :eof
    )
    
    REM Install mkcert using chocolatey
    choco install mkcert -y
    if errorlevel 1 (
      echo Failed to install mkcert using chocolatey.
      echo Please install mkcert manually from: https://github.com/FiloSottile/mkcert#installation
      pause
      goto :eof
    )
    
    REM Install the local CA
    mkcert -install
    if errorlevel 1 (
      echo Failed to install mkcert CA. Please run 'mkcert -install' manually.
      pause
      goto :eof
    )
    
    echo mkcert installed and configured successfully.
  ) else (
    echo mkcert is already installed.
  )
  
  REM Create certs directory if it doesn't exist
  if not exist ".\client\certs" mkdir ".\client\certs"
  
  REM Remove old certificate files for this IP
  if exist ".\client\certs\%current_ip%+3.pem" del ".\client\certs\%current_ip%+3.pem"
  if exist ".\client\certs\%current_ip%+3-key.pem" del ".\client\certs\%current_ip%+3-key.pem"
  
  REM Generate new certificate
  cd .\client\certs
  mkcert %current_ip% localhost 127.0.0.1 ::1
  if errorlevel 1 (
    echo Failed to generate SSL certificate.
    cd ..\..
    goto :eof
  )
  cd ..\..
  
  echo SSL certificate generated successfully for %current_ip%
) else (
  echo Using existing valid certificate
)
goto :eof

:update_vite_config
set new_ip=%1
set vite_config=.\client\vite.config.js

echo Updating vite.config.js with IP address: %new_ip%

REM Update the certificate paths and proxy target in vite.config.js
powershell -Command "$content = Get-Content '%vite_config%' -Raw; $content = $content -replace 'key: fs\.readFileSync\(\"\.\/certs\/[^\"]+\-key\.pem\"\)', 'key: fs.readFileSync(\"./certs/%new_ip%+3-key.pem\")'; $content = $content -replace 'cert: fs\.readFileSync\(\"\.\/certs\/[^\"]+\.pem\"\)', 'cert: fs.readFileSync(\"./certs/%new_ip%+3.pem\")'; $content = $content -replace \"target: 'http://[^']+'\", \"target: 'http://%new_ip%:8080'\"; Set-Content '%vite_config%' -Value $content"

echo vite.config.js updated successfully
goto :eof