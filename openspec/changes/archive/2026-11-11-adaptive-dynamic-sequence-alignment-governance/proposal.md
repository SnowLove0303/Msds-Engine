# Proposal: 自适应动态序号对齐几何拓扑治理规范 (Adaptive Dynamic Sequence Alignment Governance)

## 一、 背景与根因分析
在先前的排版治理中，为了解决 Section 11 中包含两位数子项（如 `11.10`、`11.11` 等四位纯数字序号）或特定层级序号在 `420 dxa` 标尺下挤压黏连的问题，系统曾引入了 `560 dxa` 的宽幅对齐标尺 (Tier B)。
然而，由于在底层原语 `universal-editor-primitives.js`、`docx-engine.js` 及 `pipeline-engine.js` 中存在 `|| (sectionNumber === 11)` 等硬编码特判，导致当处理仅有 8 个端点（即序号仅为 `11.1` ~ `11.8`，纯数字最大仅 3 位）的模型（如 OS-8970）时，系统仍然死板地强制套用 `560 dxa` 的四位数对齐标尺，造成序号与标签之间产生过宽的不自然留白。

本提案依法废除所有针对特定章节编号（如 Section 11）的死板硬编码，改为在**编辑器底层拓扑原语**中建立**纯基于实际输入内容特征的动态最大位数探测与自适应对齐标尺机制**：
- 最大序号数字位数 $\le 3$ 位（如 `11.1` ~ `11.9`、`9.1`、`8.2.1`） $\implies$ 严格应用三位数标尺（420 dxa 悬挂缩进 + 激光对齐）；
- 最大序号数字位数 $\ge 4$ 位（如 `11.10`、`11.11`、`11.1.1`、`8.2.2.1`） $\implies$ 自动无损升级为四位数标尺（560 dxa 悬挂缩进 + 宽幅呼吸对齐）。

---

## 二、 1:1 需求物理对账矩阵 (RTM)

| 需求编号 | 用户原始输入条目 | 需求拆解与系统契约 | 对应 Specs 条目 | 对应原子任务 |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | `如果某个section 有四位数序号，就以四位数的方式对齐` | 当前章节实际渲染序号最大数字位数 $\ge 4$ 时，全章节统一采用 560 dxa 四位数标尺 | `specs/sequence-alignment-invariants/spec.md#tier-b-4digit-alignment` | `tasks.md#task-1` |
| **REQ-02** | `但如果只有三位数，就应该以三位数的方式对齐` | 当前章节实际渲染序号最大数字位数 $\le 3$ 时，全章节统一采用 420 dxa 三位数标尺 | `specs/sequence-alignment-invariants/spec.md#tier-a-3digit-alignment` | `tasks.md#task-2` |
| **REQ-03** | `不要因为某次产出中某个section 有4位数，后续该section 即便是只有最大三位数序号的情况下仍然遵循四位数对齐逻辑，这是不对的，能不能灵活点啊` | 彻底废除章节编号特判（无条件 Section 11 绑定 560 dxa），完全基于章节实时内容动态判定 | `specs/sequence-alignment-invariants/spec.md#decouple-section-number-hardcoding` | `tasks.md#task-3` |
| **REQ-04** | `从编辑器拓扑底层和产出底层去改，通过实际的输入情况判断，比如我这次输入了最大11.9 的内容及其标签，那就按三位数的对齐方式判断，但假如我输入了11.10 或者大于11.10 的内容，那就按四位数判断` | 编辑器底层拓扑原语与流水线底层统一承接，OS-8970 全量 8 交付物重新实测核销 | `specs/sequence-alignment-invariants/spec.md#editor-primitives-and-end-to-end-verification` | `tasks.md#task-4` |
