# MSDS-Engine 通用性 MCP 工作流五大关键拼图备忘录 (Universal Workflow Five Puzzles)

> **创建时间**：2026-11-02  
> **核心使命**：支撑 MSDS-Engine 四大核心维护支柱（编辑器能力、MCP与API、全局与局部规范、Skill），为形成完全通用的 SOP 通用性 MCP 工作流提供完备拼图记录，防止项目偏离与针对单一目的的私改工具行为。

---

## 一、 用户最高法定指示与四大维护支柱

以后核心维护与开发项严格锁定为四大支柱，服务于让 Agent 真正正确、真实地使用 MSDS-Engine 本身的能力并实现稳定产出：
1. **编辑器本身能力**：底层网格几何变换、删列、删行、合并、增行、Run级富文本/化学式排版、模板解耦与物理网格自愈，作为 Agent 的“万能手脚”；
2. **MCP 与 API**：标准 stdio 协议、无损 RPC 接口与纯净返回契约，作为 Agent 与底层引擎沟通的“神经系统”；
3. **全局规范与局部规范**：ADD（Audit-Driven by Design）前置断言契约、G-01~G-40 全局几何/排版规则与局部章节专属规则，作为终审机检门禁的“质量宪法”；
4. **Skill**：Agent 的大脑意识与标准化 SOP 规程，核心维护服务于指导 Agent 遵循 SOP 标准化操作，调用编辑器各大编辑能力；
5. **严禁私改工具禁令**：**非用户明确允许，严禁直接为了单一目的（如应对特定型号或单次特判）而篡改通用底层工具！**

---

## 二、 通用性 MCP 工作流五大关键拼图详解

### 拼图一：标准化“几何形态判定决策树”（Layout Decision Tree）
* **定位**：解决 Agent 面对不同模板时无法自主分类结构形态的问题。
* **规程内容**：
  1. **标准两列结构 (Standard 2-Column)**：左标签、右取值 $\rightarrow$ 直接执行 `writeCell` 或 `writeRichText`；
  2. **非标三列结构 (Non-standard 3-Column)**：如三列组分表中间夹杂了不匹配的标签列 $\rightarrow$ **强制触发 SOP 删列动作**：`deleteColumn(colIndex=1)`，随后重新分配列宽；
  3. **通栏说明结构 (Full-Width Banner)**：如“非危险品声明”或整行长说明 $\rightarrow$ **强制触发 SOP 合并行或通栏动作**：`mergeCells` + `writeFullWidth`；
  4. **首字对齐与激光垂线结构 (Vertical Alignment)**：如第 9 节理化参数 $\rightarrow$ **强制触发激光垂线规则**：标签统一居左，冒号与数值统一对齐到基准 X 坐标。

---

### 拼图二：SOP 经典手术配方库（Recipe / Playbook Library）
* **定位**：消除 Agent 随意拼接基础原子操作的随机性，提供经过充分实测的高频通用配方。
* **配方清单**：
  - **配方 A【三列消除配方】**：
    $$\text{探针透视 Peek} \xrightarrow{\text{列数=3}} \text{删除第二列 deleteColumn(1)} \xrightarrow{\text{自动网格自愈}} \text{回读验证 Peek 列数=2}$$
  - **配方 B【动态组分自适应配方】**：
    $$\text{提取源组分数 } N \xrightarrow{\text{对比模板行数 } M} \begin{cases} N > M: \text{克隆并插入 } (N-M) \text{ 行} \\ N < M: \text{物理删除 } (M-N) \text{ 多余空行} \end{cases} \xrightarrow{} \text{逐行注入富文本与化学式}$$
  - **配方 C【化学式与多角标排版配方】**：
    $$\text{识别文本分子式 (如 } \text{H}_2\text{SO}_4 \text{)} \xrightarrow{} \text{调用 parseChemicalFormulaRuns 切分} \xrightarrow{} \text{以 writeRichText 注入下标 Run}$$

---

### 拼图三：事务级会话与自动故障自愈（Transaction Guard & Auto-Rollback）
* **定位**：杜绝长链条编辑中断导致生成半成品畸形文档。
* **规程内容**：
  1. **显式事务生命周期**：在动工编辑前建立 `createCheckpoint`；
  2. **失败自动回滚重试**：任何一步操作发生异常时，强制触发 `rollbackSession` 恢复至干净基线，并根据报错诊断调整参数重试，严禁脏数据下沉。

---

### 拼图四：对账报告的“正向行动诊断输出”（Actionable Gap Analyzer）
* **定位**：将单纯的数字保全比升级为可直接指导 Agent 执行修复的结构化清单。
* **规程内容**：
  - 自动输出 Gap 差异项（如：第 2 节漏填象形图、第 3 节缺失特定 CAS 号浓度）；
  - Agent 依据诊断列表按图索骥执行针对性补填，实现“对账 $\rightarrow$ 诊断 Gap $\rightarrow$ 补填 $\rightarrow$ 对账全绿”的闭环。

---

### 拼图五：项目法定架构契约与禁令立法（Constitution Update）
* **定位**：在 `PROJECT_CONSTITUTION.md` 与 `AGENTS.md` 中将四大维护支柱与防私改禁令确立为最高法定条款，防止任何开发行为跑偏。

---
*备忘完毕，本文件随时待命，待用户处理完紧急事项后即可调取并作为后续落地的执行依据。*
