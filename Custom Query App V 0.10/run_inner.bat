@echo off

REM Install root dependencies if missing
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install root dependencies.
        rd /s /q node_modules
        echo Reinstalling root dependencies...
        call npm install
        if errorlevel 1 (
            echo Reinstall failed.
            exit /b 1
        )
        exit /b 1
    )
    echo.
)

REM Install server dependencies if missing
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    if errorlevel 1 (
        echo Failed to install server dependencies.
        rd /s /q node_modules
        echo Reinstalling server dependencies...
        call npm install
        if errorlevel 1 (
            echo Reinstall failed.
            cd ..
            exit /b 1
        )
        cd ..
        exit /b 1
    )
    cd ..
    echo.
)

REM Install client dependencies if missing
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    if errorlevel 1 (
        echo Failed to install client dependencies.
        rd /s /q node_modules
        echo Reinstalling client dependencies...
        call npm install
        if errorlevel 1 (
            echo Reinstall failed.
            cd ..
            exit /b 1
        )
        cd ..
        exit /b 1
    )
    cd ..
    echo.
)

REM Build client if dist does not exist
if not exist "client\dist" (
    echo Building client...
    cd client
    call npm run build
    if errorlevel 1 (
        echo Client build failed.
        rd /s /q dist
        echo Rebuilding client...
        call npm run build
        if errorlevel 1 (
            echo Rebuild failed.
            cd ..
            exit /b 1
        )
        cd ..
        exit /b 1
    )
    cd ..
    echo.
)

REM Start server and client concurrently
call npm run start:all
if errorlevel 1 (
    echo Failed to start server and client.
    exit /b 1
)

pause