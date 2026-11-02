# MSDS Engine 变更与演进日志 (CHANGELOG)

## [2026-11-02 任务推进] - PU-608 标准 8 格式全矩阵受控生产、审核断言解耦与双极双层全景终审 100% 满分通过

### 一、 业务场景与用户法定指示背景
用户提供待处理源文件并明确指示：
> “"F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\1-1 单组份水性聚氨酯树脂 PU\PU-608\PU-608 msds_CN 冠志.docx" ，产出存储位置：F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-608 ，务必真实调用MSDS-Engine 的功能，懂？”
并在需求立案与规格制定阶段指令明确：“你怎么用spec-kit，我不是有Ps-openspec吗”，“执行”。

---

### 二、 遇到的核心问题、根因与解法 (Core Pathology & Solution)
1. **问题 1：立案话术外延概念偏离 Ps-openspec 单一事实源**
   - **现象**：在需求立案阶段，Agent 机械搬用“Spec-Kit”概念措辞，导致方案游离于项目法定唯一的 `Ps-openspec` 体系之外；
   - **根因**：认知敏锐度不足，未能在第一时间建立 `openspec/changes/pu608-canonical-deliverables/` 规格工件；
   - **解法**：立即执行 5-Whys 停机归因，彻底摒弃外来散装措辞，严格按照 Ps-openspec 标准在 `openspec/changes/` 下建立完整规格工件，并通过 `npx openspec validate --strict` 门禁。
2. **问题 2：`audit_bipolar_bilayer.mjs` 中历史遗留的 `else` 特判分支导致生殖毒性危品误报成盐违章**
   - **现象**：首次执行流水线导出 `PU-608` 时，Gate 12 双极双层终审拦截报错：“存在 8 项严重格式与语法违章（成盐豁免附注未命中、5 级缩进断言未命中）”；
   - **根因**：`audit_bipolar_bilayer.mjs` 在 Section 2 的断言中，仅显式列出了 `PU-202A/B/C/218A/303A` 等特定型号，在 `else` 分支直接假定为 `PA-3223` 专属的 DMEA 成盐豁免格式。当传入新的生殖毒性危险品 `PU-608` 时，因未被旧型号命中而错误落入 PA-3223 的成盐豁免检查，属于典型的“历史特判遗留导致的泛化断层”；
   - **解法**：依据“反局部硬编码特判公理”，将审计脚本中对 Section 2 的型号分支重构为基于化学事实的特征驱动判定：凡包含 `生殖毒性` 或 `Reproductive toxicity` 的危险品，统一执行生殖毒性、H360 及 NMP 透皮吸收的通栏规范校验；成盐豁免断言严格收敛至明确包含成盐事实的文件，彻底解耦。
3. **问题 3：Section 11 毒理学插槽历史遗留 PU-202A 硬编码常量导致真实数据被伪造篡改，假审计弱断言放行**
   - **现象**：用户质检发现产出文档 Section 11 毒理学数据与源文件完全对不上（源文件为 NMP 4,150mg/kg、造成皮肤刺激、严重的眼睛刺激；产出物被替换为 PU-202A 的 DMAC 3,000-6,000mg/kg、轻度皮肤刺激、轻度眼睛刺激等）；
   - **根因**：历史 Commit `0a99629d` 在 `pipeline-engine.js` lines 1327~1426 中，对单组分插槽表格排版时直接传入硬编码字符串（PU-202A 毒理值），无条件覆盖了 `smart-matching.js` 提取的真实源事实；且 `msds_compare_source_with_output` 与 `audit_bipolar_bilayer.mjs` 仅校验了字符长度与弱正则（“急性毒性|刺激性”），导致伪造数据逃脱了机器门禁；
   - **解法**：
     1. 彻底剔除 `pipeline-engine.js` 中所有硬编码常量，改为基于当前单元格既有值 `vCell.text` 动态驱动排版；
     2. 增强英文翻译函数 `translateToxicologyValueToEnglish`，感知 `dermal` 上下文，纠正经皮急性毒性标签（`LD50 / Dermal / Rat`）；
     3. 升级 `audit_bipolar_bilayer.mjs`，增加针对源事实基准值（4,150、造成皮肤刺激、严重的眼睛刺激、经皮吸收危险）的绝对值存在性硬断言；
     4. 升级 MCP 工具 `msds_compare_source_with_output`，加入毒理学关键数值与定性结论的穿透式对账，一旦缺失或篡改即报 `FACTUAL_INCONSISTENCY` 阻断。

---

### 三、 实测凭据与成果 (Measured Exit Code 0)
1. **受控生产驱动**：
   - 创建受控驱动脚本 `web/scripts/generate_pu608_canonical_deliverables.mjs`，通过底层流水线 `executeEightDeliverablesPipeline` 与无头 PDF 转换守护进程全自动化生产；
2. **标准 8 格式全矩阵物理落地**：
   - 目标目录 `算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-608` 严格包含且仅包含 8 个法定交付物（实测杂件为 0，G-01 纯净度 100%）：
     - `PU-608 msds_CN 冠志.docx` (56,719 bytes) / `PU-608 msds_CN 冠志.pdf` (289,234 bytes)
     - `PU-608 msds_CN 国彩.docx` (56,714 bytes) / `PU-608 msds_CN 国彩.pdf` (288,549 bytes)
     - `PU-608 msds_EN Guanzhi.docx` (43,938 bytes) / `PU-608 msds_EN Guanzhi.pdf` (217,426 bytes)
     - `PU-608 msds_EN Guocai.docx` (43,907 bytes) / `PU-608 msds_EN Guocai.pdf` (216,048 bytes)
3. **机械化终审双全绿**：
   - **双极双层全景机械深度终审 (`audit_bipolar_bilayer.mjs`)**：0 违规，满分全绿 (**Failures: 0, Exit Code 0 `[Measured]`**)；
   - **1:1 事实物理对账 (`msds_compare_source_with_output`)**：16 章节字符保全比 106.4%，`actionableGaps` 数量为 **0**；
   - **OpenSpec 规格核销**：`npx openspec validate pu608-canonical-deliverables --strict` 验证合流通过 (**Exit Code 0 `[Measured]`**)。

---

## [2026-11-02 深夜] - 通用性 MCP 工作流五大关键拼图闭环落地：四大法定支柱立宪、事务自动回滚自愈、Recipe A/B/C 手术库与正向行动诊断器

### 一、 业务场景与用户法定指示背景
用户对全系统执行强制性提出里程碑级指导：
> “调整下MSDS-Engine 项目执行强制性：以后核心维护与开发项：1.编辑器本身能力；2.MCP与API 3.全局规范与局部规范，用于审计；4.Skill 核心维护服务于Agent 真正正确真实使用MSDS Engine 本身的能力 并实现稳定产出，过程采用Sop操作标准化，赋予Agent编辑器的各大编辑能力；非我允许禁止直接为了单一目的而改造工具； 你看一下，为了形成SOP 通用性MCP 工作流，还需要什么。回到刚才的5拼图，重写确认方案。执行。”

---

### 二、 核心架构重构与技术突破 (Key Breakthroughs)
1. **四大法定维护支柱立宪与防私改禁令 (`PROJECT_CONSTITUTION.md` & `AGENTS.md`)**：
   - 彻底锁定四大法定支柱（编辑器本身能力、MCP与API、全局与局部规范、Skill）；
   - 明文立法**《最高防私改与防特判禁令》**：非用户明确允许，严禁直接为了单一目的（如应对某一临时特例或特定字段）而擅自改造底层通用工具！严禁在代码中出现 `if (model === 'xxx')` 特判伪答案；
   - 在 `AGENTS.md` 中将四大支柱与防私改禁令提升为不可触碰的一票否决级准入红线。
2. **拼图一 & 二：几何形态判定决策树与 SOP 经典手术配方库 (`docs/MSDS_STUDIO_MCP_SKILL_WORKFLOW_SOP.md`)**：
   - 确立 4 大典型结构判定法则（标准双列、非标多列消除、单格通栏说明、激光垂线参数）；
   - 封装三大经典手术配方：
     - **Recipe A【三列消除配方】**：`Peek` 透视 $\rightarrow$ `deleteColumn(1)` 裁剪冗余标签 $\rightarrow$ 网格列宽平摊自愈；
     - **Recipe B【动态组分自适应配方】**：对比组分数与模板行数 $\rightarrow$ 动态克隆插入行 (`cloneAndInsertRow`) 或删除行 (`deleteRow`)；
     - **Recipe C【微观化学式与 Run 级排版配方】**：自动解析分子式 $\rightarrow$ 分割下标 Run 并以 `writeRichText` 渲染。
3. **拼图三：事务生命周期与失败自动回滚自愈 (`mcp-server.js`)**：
   - `msds_execute_editor_ops` 在动工前强制创建事务检查点；
   - 捕获任何异常（如列越界、格式破坏）时，立即自动触发 `rollbackSession` 恢复原始母版，并物理销毁磁盘上可能残留的半成品脏文件，向客户端透传带有 `[MCP Transaction Auto-Rollback]` 的明确错误，杜绝脏文件污染下沉。
4. **拼图四：正向行动诊断分析器 (`msds_compare_source_with_output`)**：
   - 升级事实物理对账工具，输出 `actionableGaps` 结构化数组；
   - 逐节侦测漏填关键规程（`MISSING_CONTENT`）与组分行数不匹配（`COMPONENT_COUNT_MISMATCH`），并附带正向 `suggestedAction`（如推荐执行 Recipe B 通栏合并补填），形成“对账 $\rightarrow$ 提取 Gap $\rightarrow$ 补填 $\rightarrow$ Gap 归零”的确定性闭环。
5. **底层几何算子高内聚解耦 (`universal-editor-primitives.js`)**：
   - 将 `deleteTableColumn`（带越界抛错）、`mergeRowCells`、`cloneAndInsertRow`、`writeRichTextToCell`、`parseChemicalFormulaRuns` 抽离为高内聚独立模块，严格保障底层 4000+ 行 `docx-engine.js` 的纯净稳定。

---

### 三、 实测凭据与验证结论 (Measured Exit Code 0)
- **端到端五大关键拼图综合实测 (`test_five_puzzles_workflow.mjs`)**：
  - `[STEP 1/6]` 拼图五最高宪法与 Agent 准入红线静态扫描机检 **PASS (100% 守恒)**；
  - `[STEP 2/6]` 原生 MCP 初始化成功 (msds-engine-mcp v2.1.0)；
  - `[STEP 3/6]` 拼图三故意越界测试成功触发 `[MCP Transaction Auto-Rollback]`，母版自动回滚，无残留半成品文件；
  - `[STEP 4/6]` 拼图二 Recipe A/B/C 复合手术在真实 Word 网格中无损执行成功，输出合规 DOCX（36,662 bytes）；
  - `[STEP 5/6]` 拼图四正向行动诊断器输出 `actionableGaps` 数组与建议动作，字符保全比 111.9%；
  - **实测退出码: 0 [Measured]**。
- **全套回归套件全绿**：
  - `test_universal_editor.mjs` 10 项严苛测试 **100% PASS (Exit Code 0)**；
  - `test_mcp_universal_editor.mjs` **PASS (Exit Code 0)**；
  - `npx openspec validate msds-universal-mcp-workflow-five-puzzles --strict` 验证合流通过 (**Exit Code 0**)。

---

## [2026-11-02 晚间] - 识别与编辑模块 10 大 MCP 通道全线通车与 Skill 优化工作流全景图谱 (Graph SOP)