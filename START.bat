@echo off
setlocal
title Template S-12 - Iniciar servidor
cd /d "%~dp0"

echo.
echo ============================================
echo   Template S-12 - Cartao de Territorio
echo ============================================
echo.

rem Se ja estiver rodando, apenas abre o navegador
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if not errorlevel 1 (
    echo [INFO] O servidor ja esta rodando em http://127.0.0.1:3000
    echo.
    start "" http://127.0.0.1:3000
    goto :fim
)

echo [OK] Iniciando o servidor em segundo plano...
echo.

rem Abre o servidor em uma janela minimizada e com o diretorio correto
start "Template S-12 Server" /D "%~dp0" /min cmd /c "node server.js"

rem Pequena pausa para o servidor subir antes de abrir o navegador
ping -n 3 127.0.0.1 >nul

rem Abre o navegador
start "" http://127.0.0.1:3000

echo [OK] Servidor disponivel em: http://127.0.0.1:3000
echo [OK] Para encerrar, execute o arquivo STOP.bat.
echo.

:fim
endlocal