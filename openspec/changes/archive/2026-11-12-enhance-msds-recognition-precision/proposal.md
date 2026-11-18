# Proposal: 增强 MSDS 源文件识别精度与多层级穿透判定 (enhance-msds-recognition-precision)

## 一、背景与动机 (Background & Context)
在对 PA-3612 Context 1 识别结果的人工审阅与批注反馈中，发现了 4 项关键识别缺陷：
1. **标题前缀容差缺失**：源文档中残留的历史前缀字符（如 `v1.物料及供应商标识`）导致章节标题未能被正则识别，降级为普通说明行；
2. **复合单元格未分层穿透**：Section 2 等章节在源文件中将大标题、GHS 分类标签与值、象形图说明合并在单一大单元格中，此前粗暴作为单一行输出，缺乏多层级展开；
3. **续行值被误判为标签**：Section 5.3 之后的第二行警告说明句（“在着火或爆炸情况下，不要吸进烟尘。”）被误标为 `标签`，实为说明行/续行值；
4. **引导语误判为键值对标签**：Section 11 的“类似产品的风险评估数据：”与 Section 15 的“其它的规定：”等引导语由于末尾带冒号被误识别为 `标签`，实为结构引导性 `说明行`。

本变更对 `web/src/recognition-engine.js` 进行算法升级，引入标题容差清洗、单单元格多行多层级分解，以及引导语/续行值的语义上下文状态感知。

---

## 二、1:1 需求物理对账矩阵 (Spec-Kit RTM Ingestion)

本提案严格 1:1 注入 Step 0 门禁 1 中锁定的 4 项批注改进需求：

| 需求编号 | 需求名称与内容 | 关联 OpenSpec 契约 | 验收标准索引 |
| :---: | :--- | :--- | :--- |
| **REQ-ANN-1** | 章节大标题容差识别与前缀清洗 (针对批注 1) | `specs/recognition-precision/spec.md#req-ann-1` | `tasks.md#task-1` |
| **REQ-ANN-2** | 单元格内多行多层级段落穿透识别 (针对批注 2) | `specs/recognition-precision/spec.md#req-ann-2` | `tasks.md#task-2` |
| **REQ-ANN-3** | 跨行续行与单列叙述句反伪标签判定 (针对批注 3) | `specs/recognition-precision/spec.md#req-ann-3` | `tasks.md#task-3` |
| **REQ-ANN-4** | 章节引导说明语精准归类契约 (针对批注 4) | `specs/recognition-precision/spec.md#req-ann-4` | `tasks.md#task-4` |

---

## 三、影响面与爆炸半径控制 (Blast Radius)
- **直接受影响模块**：
  - `web/src/recognition-engine.js`：`detectSectionHeaderInRow` 增加容差匹配；`classifyRowSemanticType` 增加多行穿透与上下文引导语感知。
- **绝对不触碰范围 (保持现状)**：
  - `web/scripts/run_source_recognition.mjs` 外部调用签名保持稳定；
  - `web/src/mcp-server.js` MCP 工具协议接口保持不变；
  - 底层 `docx-engine.js` 与设计令牌封印保持 100% 只读不变。
