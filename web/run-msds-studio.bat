@echo off
cd /d "%~dp0"
call npm run dev -- --host 127.0.0.1 <nul > msds-studio.out.log 2> msds-studio.err.log
