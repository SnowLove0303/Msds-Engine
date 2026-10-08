@echo off
chcp 65001 >nul
set "SCRIPT_DIR=%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3.12 "%SCRIPT_DIR%msds_template_editor.py" %*
) else (
  python "%SCRIPT_DIR%msds_template_editor.py" %*
)
if errorlevel 1 pause
