# Design: MSDS 引擎底层通用性根治系统架构设计

## 1. 架构目标与通用性准则

本设计的核心是**从根本机制上修复，而非打补丁**。严格遵循两大公理：
1. **反局部假特判原则（Anti-Overfitting Axiom）**：代码中严禁出现针对特定型号（如 `PA-4914`、`EP-1501`）的特判 `if` 分支，所有逻辑必须适用于任意化学品 MSDS 文档；
2. **事实指纹绝对守恒（Fidelity Preservation）**：源文件明文记载的化学、合规与运输事实在经过底层引擎全流程处理后，法定信息损失率必须为 0%。

---

## 2. 关键模块设计与状态转移拓扑

### 2.1 底座解析引擎：嵌套表格递归提取机制 (`docx-engine.js`)
- **现状缺陷**：原解析逻辑仅对 `w:body` 进行浅层子元素遍历，单元格 `w:tc` 仅提取直接段落 `w:p`，导致嵌套在单元格内的子表格（如 PA-4914 Section 8 限值表）直接被跳过，丢失其全部数据。
- **重构拓扑**：
  ```text
  w:tc (单元格)
    ├─ directChildren(tc, 'p')  ──> parseParagraph ──> 直接段落文本
    └─ directChildren(tc, 'tbl') ──> buildTableRecord ──> 递归生成嵌套表格模型
                                                           │
                                                           ▼
                                         挂载于 cell.nestedTables: TableRecord[]
                                         文本合并入 cell.text (换行拼接)
  ```
- **兼容性保障**：上层模块若只读取 `cell.text`，则能自动获取嵌套表格的所有文本；上层若需要表格行列结构，可直接读取 `cell.nestedTables`。

### 2.2 识别引擎：多维容差跨行状态机 (`recognition-engine.js`)
- **GHS 分类状态机**：
  ```mermaid
  stateDiagram-v2
      [*] --> IDLE
      IDLE --> SCANNING_CATEGORIES: 匹配到 2.1 / GHS危险性类别 / GHS分类 / 物质分类
      SCANNING_CATEGORIES --> SCANNING_CATEGORIES: 逐行捕获分类短语 (排除标题与纯序号)
      SCANNING_CATEGORIES --> IDLE: 匹配到 2.2 / 标签要素 / 信号词 / 象形图 / 2.3
  ```
- **手部防护多行聚合状态机**：
  ```mermaid
  stateDiagram-v2
      [*] --> IDLE
      IDLE --> GLOVE_SPEC_ACCUMULATING: 遇到 "手部防护："
      GLOVE_SPEC_ACCUMULATING --> GLOVE_SPEC_ACCUMULATING: 连续向下读取材质、厚度、穿透时间、处置建议
      GLOVE_SPEC_ACCUMULATING --> IDLE: 遇到眼睛防护 / 身体防护 / 下一主序号
  ```
- **运输信息语义分类器**：
  - 在进入 `14.1`~`14.4` 正则前，先以白名单语义判断：若包含 `公路|陆运|铁路|海上|海运|空运`，直接分流至非危运输方式聚合槽，坚决阻断其被当成 UN 编号或包装组。

### 2.3 流水线引擎：双向透传与反覆盖门禁 (`pipeline-engine.js`)
- **化学品分类绑定**：从 `context1.facts.chemicalClassification` 读取中文分类，在 `fillSection1` 时回填至第 1 节表格第 3 行右侧单元格；
- **动态限值表格渲染**：当 `facts.exposureControls.limits` 存在时，通过 `cloneRow` 复制模板第一行数据行，逐行填入物质、依据、类型与数值，并在组装完毕后检查行数 $\ge 2$；
- **法规反覆盖保护**：在渲染 Section 15 时，若源事实中已包含明确法规（如 344 号令），直接沿用源法规文本渲染，不触发默认模板覆写。
