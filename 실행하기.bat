@echo off
setlocal
cd /d "%~dp0"

set "PYTHON=C:\Users\dldco\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "URL=http://127.0.0.1:4173"

start "" "%URL%"
"%PYTHON%" -m http.server 4173 --bind 127.0.0.1
