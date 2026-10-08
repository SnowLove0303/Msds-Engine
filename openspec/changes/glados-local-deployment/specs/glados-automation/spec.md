# Spec Delta: glados-automation

## Purpose

提供 GLaDOS 自动签到本地环境部署、凭据安全管理、日常运行执行以及状态检测汇报能力。

## ADDED Requirements

### Requirement: Local Deployment Repository Setup
The deployment process SHALL clone or place the `RaineaAN/GlaDOS_Checkin_ql` repository files into `F:\脚本应用\GLados` and verify file tree completeness.

#### Scenario: Verify repository tree present
- **WHEN** the deployment script checks the directory `F:\脚本应用\GLados`
- **THEN** core files `checkin.py`, `requirements.txt`, and `config.py` MUST exist.

### Requirement: Python Runtime and Dependencies Configuration
The system SHALL ensure Python 3 is available and required dependencies (primarily `requests`) are installed.

#### Scenario: Installing Python dependencies
- **WHEN** dependency installation is triggered in the target directory
- **THEN** `pip install -r requirements.txt` succeeds without unresolved missing package errors.

### Requirement: Credential Configuration and Security Isolation
The runner SHALL support reading user credentials from environment variables or local configuration file without publishing secrets.

#### Scenario: Configure cookie credential
- **WHEN** the user provides `GLADOS_COOKIE` in `.env` or local configuration
- **THEN** the script loads the cookie safely without exposing sensitive tokens in console logs.

### Requirement: Execution and Verification
The system SHALL provide an automated entry point to run checkin and verify account quota/remaining days.

#### Scenario: Successful checkin execution
- **WHEN** the checkin runner is executed with a valid cookie
- **THEN** the system outputs check-in result message and queries current remaining days.
