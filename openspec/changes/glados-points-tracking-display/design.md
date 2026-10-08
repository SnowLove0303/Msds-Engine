# Design: GLaDOS 积分流水解析与双重积分展示方案

## Context

经实测 GLaDOS API 响应体结构，签到接口 `https://glados.rocks/api/user/checkin` 返回的 JSON 数据中，除了 `message` 与 `code` 外，还包含完整的用户积分账本明细 `list`：
- `list[0]['change']`：最近一次/今日入账的变动积分（如 `"4.00000000"`）。
- `list[0]['balance']`：该次变动结算后的总积分余额（如 `"211.0000000000000000"`）。
- `res.json().get('points')`：首次签到时附带的即时新增分值（若为 0 则通过 `list[0]` 获取）。

通过对该结构的解析，能够完全满足用户“看到获得的积分和已有的总积分”的需求。

## Goals / Non-Goals

**Goals:**
- 从 `checkin` 响应中稳健解析 `change`（获得积分）与 `balance`（已有总积分）。
- 支持浮点数和长精度数字的安全取整转换（`int(float(...))`）。
- 在控制台打印和通知推送文本中结构化展示积分维度信息。

**Non-Goals:**
- 不涉及自动积分兑换购买套餐操作（仅做数据读取与清晰汇报）。

## Decisions

1. **多重取值机制**：
   - 获得积分优先提取 `res_json.get('points')`，若为 0 或未提供，则提取 `pt_list[0].get('change')`；
   - 总积分直接提取 `pt_list[0].get('balance')`；
   - 格式化为整数字符串，带单位与正负号符号（例如 `+4 积分` 与 `211 积分`）。
2. **容错机制**：
   - 若 `pt_list` 为空或解析异常，显示 `未获取到积分详情`，不中断主流程。

## Risks / Trade-offs

- **[Risk] 接口无 list 字段或网络波动** → **Mitigation**: 使用 `.get('list', [])` 并配合 try-except 保护，保证最基础的签到状态与剩余天数不受影响。
