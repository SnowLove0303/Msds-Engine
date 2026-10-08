# Proposal: GLaDOS 签到积分收益与总积分显示增强

## Why

用户在执行 GLaDOS 自动签到或使用 `wll` 快捷启动器查看状态时，除了需要了解签到是否成功及账号剩余天数外，还需要直观查看**本次/今日获得的积分**以及**当前账号已有的总积分余额**，以便清晰掌握积分变动及后续兑换天数的时机。

## What Changes

- 解析 GLaDOS API 响应体中的积分账目结构（`list` 流水记录与 `points` 字段）。
- 精准提取并计算：
  - **获得积分**（本次签到获得或今日流水入账积分）
  - **当前总积分**（账号最新结余积分余额）
- 丰富终端及推送回显格式：
  ```text
  账号：xxx@qq.com
  签到结果：Today's observation logged. Return tomorrow for more points.
  获得积分：+4 积分
  已有总积分：211 积分
  剩余天数：36 天
  ```
- 异常容错：若未获取到积分流水，优雅回退至状态回显，防止因字段缺失中断执行。

## Capabilities

### New Capabilities
- `glados-points-reporting`: 提供 GLaDOS 积分明细解析能力，向终端与通知通道输出获得积分与总积分结余。

### Modified Capabilities
（无现有规约修改）

## Impact

- `F:\脚本应用\GLados\checkin.py`
