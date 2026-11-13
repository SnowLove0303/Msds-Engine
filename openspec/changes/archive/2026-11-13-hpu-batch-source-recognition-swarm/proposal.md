# Proposal: HPU 系列水性羟基聚氨酯树脂 MSDS 源文件批量 Swarm 识别与机械审计

## 一、 背景与业务动机
在 MSDS Studio 工业级受控工作流中，Context 1（源文件识别层）承担着将多源不规则化学品文档精确抽取为结构化事实的关键职责。为了扩充“识别模块”算法训练样本库，需要对 `1-2 水性羟基聚氨酯树脂 HPU` 目录下的全量 6 个型号进行批量识别。

本变更通过构建 Swarm 多智能体并行分工网络，调度独立的 Subagent 对各型号进行隔离抽取，统一交付标准 Markdown 格式事实文件至 `识别模块\识别模块训练夹`，并挂载刚研发上线的 Context 1 独立反向机械审计器进行 100% 阻断式准入校验，确保数据零污染、零格式破损、零标签/说明行误判。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM)

| 需求编号 | 需求名称 | 原始诉求映射 | 优先级 | 审计依赖 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-HPU-01** | 目标目录全型号 MSDS 源文件范围锁定 | `...1-2 水性羟基聚氨酯树脂 HPU ... 执行这个文件夹的所有型号msds 源文件的检测任务` | P0 (阻断级) | 物理路径存在性与文件清单 100% 闭环 |
| **REQ-HPU-02** | 多 Swarm Subagent 并行协作执行 | `开多个swarm Subagent去执行...检测任务` | P0 (阻断级) | Swarm 多智能体并行分工与上下文隔离 |
| **REQ-HPU-03** | 统一交付归口与 Markdown 规范格式 | `所有识别结果统一以md的方式放在F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\识别模块\识别模块训练夹` | P0 (阻断级) | 目标目录物理交付物完整性与 Markdown 规范 |
| **REQ-HPU-04** | Context 1 机械审计全绿验收门禁 | 识别准确性与无假通质量保障（承袭前序会话核心要求） | P0 (阻断级) | 独立反向机械审计 `Exit Code 0`，0 警告 0 违规 |

---

## 三、 范围与影响评估
- **纳入范围**：
  - 锁定 6 个型号：`HPU-7651`, `HPU-7660`, `HPU-7700`, `HPU-7710`, `HPU-7711A`, `HPU-7790` 的 `*msds_CN 冠志.docx`。
  - 并发执行识别脚本 `web/scripts/run_source_recognition.mjs`。
  - 成果输出至 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\识别模块\识别模块训练夹`。
  - 逐一运行 `web/scripts/audit_context1_mechanical.mjs` 进行机械审查。
- **排除范围**：
  - 排除所有以 `tds_CN` 或 `tds` 命名的技术说明书文件。
  - 不篡改底层识别引擎核心代码 `web/src/recognition-engine.js`。
  - 不修改已锁定的审计规则库。
