@echo off
cd /d "%~dp0frontend"
set ELECTRON_RUN_AS_NODE=1
"E:\Antigravity IDE\Antigravity IDE.exe" "%~dp0frontend\dev-server.js"
