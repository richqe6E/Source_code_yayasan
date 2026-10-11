@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  node dev-server.js
) else if exist "E:\Antigravity IDE\Antigravity IDE.exe" (
  set ELECTRON_RUN_AS_NODE=1
  "E:\Antigravity IDE\Antigravity IDE.exe" "%~dp0dev-server.js"
) else (
  echo Node.js tidak ditemukan di PATH. Silakan instal Node.js terlebih dahulu.
  pause
)
