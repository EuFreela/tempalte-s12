@echo off
setlocal
title Template S-12 - Parar servidor

echo.
echo Procurando processos na porta 3000...
echo.

powershell -NoProfile -Command "$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force; Write-Host ('[OK] Processo {0} encerrado.' -f $_) }; Write-Host '[OK] Servidor parado.' } else { Write-Host '[INFO] Nenhum servidor rodando na porta 3000.' }"

echo.
pause
endlocal