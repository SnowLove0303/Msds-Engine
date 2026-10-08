# Spec Delta: glados-points-reporting

## Purpose

支持在 GLaDOS 自动签到流程中提取并展示本次获得积分与账号已有总积分。

## ADDED Requirements

### Requirement: Points Extraction from Checkin Ledger
The checkin module SHALL inspect the checkin response `list` records and `points` property to determine points earned today and existing balance.

#### Scenario: Extract points change and balance
- **WHEN** GLaDOS API returns checkin response containing ledger `list`
- **THEN** system extracts `change` as points earned and `balance` as total points balance.

### Requirement: Formatted Output Display
The runner SHALL format output to display both points gained and current total points alongside account email and remaining days.

#### Scenario: Display formatted points in console
- **WHEN** an account checkin completes successfully
- **THEN** the console outputs `获得积分: +X 积分` and `已有总积分: Y 积分`.

### Requirement: Backward Compatibility and Fallback Handling
The checkin module SHALL gracefully fall back if ledger data is unavailable without throwing unhandled exceptions.

#### Scenario: Missing ledger list in response
- **WHEN** the response contains no `list` or is empty
- **THEN** the script displays available status without breaking the execution flow.
