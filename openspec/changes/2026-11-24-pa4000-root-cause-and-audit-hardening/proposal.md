# Proposal: PA-4000 根因治理、翻译与审计体系硬化（仅处理 PA-4000）

## 1. 变更背景与根因穿透结论（Step 1 Measured）

结合 [PA-4000_审计报告.md](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/审计模块/产出审计报告/PA-4000_审计报告.md) 与用户对 `Section 2`、`Section 8` 的规则澄清，经 Step 1 代码溯源，确认全部问题的**底层根因**如下：

1. **Section 2 `GHS象形图：` 标签消失根因**：
   - `web/src/context-governor.js#L1014-L1021` 在 `!governed.cn.isHazardous` 时无条件匹配并删除 `GHS象形图：` 整行，但未检查其下一行是否带有源文显式值（`PA-4000` 源文为 `GHS象形图：\n根据GHS不属于危险物`）。结果标签行被删、值行残留，与上方 `GHS分类：\n根据GHS不属于危险物` 紧邻形成两行重复文本。
2. **Section 8 `8.1 / 8.2` 反复颠倒根因（改了十遍仍复发的三重源头）**：
   - **源头 A（受污染的静态记忆库）**：`web/src/translation-memory.json#L10-L13` 硬编码了 `"8.1控制参数": "8.1 Control parameters:"` 与 `"8.2暴露控制": "8.2 Exposure controls:"`，与规范直接反向。
   - **源头 B（仅局部生效的序号覆盖）**：`web/src/topology-matcher.js#L245-L270` 仅在 `hasOelAnchor`（存在多列 OEL 表格）时才将暴露控制设为 `8.1`、控制参数设为 `8.2`；当源文档无多列 OEL 表（如 `PA-4000` 仅含 `2006/121/EC`）且源文自身顺序为 `8.1控制参数 -> 8.2暴露控制` 时，系统直接透传了源文的反向序号与顺序。
   - **源头 C（无底层机械门禁）**：`web/src/staged-mechanical-audit.js` 未校验 S8 `8.1` 必须为暴露控制、`8.2` 必须为控制参数，导致反复回退且无法被审计拦截。
3. **翻译与单位/间距退化根因**：
   - `web/src/context-governor.js` 与 `web/src/docx-engine.js#L3311-L3314` 对 `MFFT`、`Tg` 等英文标签未保留中文源标签中的温度单位后缀 `/℃`（`/°C`）；
   - `healEnSpacing` 缺少通用的 `数字 + g/cm3` / SI 单位间距修复，且 `msds-db.js#L833,L871` 中的 `(e. g.,` 文本绕过了 `healEnSpacing`。
4. **审计体系失效根因**：
   - `web/src/staged-mechanical-audit.js` 仅检查少量固定正则（如 `mm|min|cm|mg|kg|hPa`），缺乏对 **源文-产出物单位守恒（`/℃`→`/°C`）**、**S8 规范子节顺序与语义绑定（`8.1=暴露控制`、`8.2=控制参数`）**、**S2 标签-值配对完整性与相邻重复行**、**`(e. g.,` / `g/cm3` 间距** 的通用机械检测，导致对旧版 `PA-4000` 给出虚假 PASS。

---

## 2. 1:1 需求物理对账矩阵（RTM，与门禁 1 严格守恒）

| 需求编号 | 需求摘要 | OpenSpec 规格与任务映射 |
| :--- | :--- | :--- |
| **REQ-01** | 解决 Section 2 `GHS象形图：` 标签消失问题 | `specs/msds-invariants/spec.md` §1；`tasks.md` T2 |
| **REQ-02** | 解决 Section 8 `8.1 暴露控制 / 8.2 控制参数` 顺序与防复发 | `specs/msds-invariants/spec.md` §2；`tasks.md` T3 |
| **REQ-03** | 结合审计报告与解释重建 Step 2，本次仅处理 `PA-4000` | `tasks.md` T6（仅重产并验收 `PA-4000`） |
| **REQ-04** | 核心要求 1：从系统底层防止问题复发，尽量避免硬编码（含提案 A：黄金不变量+变异测试） | `specs/msds-invariants/spec.md` §3；`tasks.md` T1, T5 |
| **REQ-05** | 核心要求 2：优化翻译体系（含提案 B：源/译单位与间距守恒校验） | `specs/msds-invariants/spec.md` §4；`tasks.md` T4 |
| **REQ-06** | 核心要求 3：优化审计体系（含提案 C：先用新审计盲测旧版 `PA-4000` 必须全数检出红灯） | `specs/msds-invariants/spec.md` §5；`tasks.md` T1, T5 |
| **REQ-07** | 核心要求 4：TDS 问题打回 `tds-specialist` Subagent | `tasks.md` T7 |
| **REQ-08** | 核心要求 5：TDS 模板 `Limited Company` 保持不变；主 Agent 不再审计 TDS，专职负责 MSDS | `proposal.md` 边界声明；`tasks.md` T6, T7 |
