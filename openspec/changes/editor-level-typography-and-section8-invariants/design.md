# Design: 编辑器底层排版与 Section 8 不变量技术方案 (Editor-Level Typography & Section 8 Invariants)

## 1. 架构分析与根因诊断

### 1.1 标签对齐缺陷 (REQ-01) 根因与解法
- **根因拓扑**：
  ```mermaid
  flowchart TD
      A["formatEnglishLabelCell() / rebuildTabbedLabelWithTypography()"] --> B["applyHangingIndentToP(pPr, '420', '420')"]
      B --> C["执行 Array.from(pPr.getElementsByTagNameNS(W_NS, 'tabs')).forEach(t => pPr.removeChild(t))"]
      C --> D["w:pPr 内部定义的 <w:tabs> 被彻底删除！"]
      A --> E["Run 1 组装: seqStr + '  ' + <w:tab/>"]
      D & E --> F["Word 渲染器: 缺少 420 dxa 目标制表位，遇到 <w:tab/> 强制跳至默认 720 dxa 制表位！"]
      G["formatEnglishLabelCell() 对未编号标签 (如 Name of supplier:)"] --> H["applyLeftIndentToP(firstP, '420')"]
      H --> I["Word 渲染器: 未编号标签起始于 420 dxa！"]
      F & I --> J["致命错位: 720 dxa vs 420 dxa (相差 300 dxa / 15 pt)，且序号与正文间距离拉空！"]
  ```
- **解法方案**：
  1. 重写 `applyHangingIndentToP(p, left, hanging, W_NS)`：
     - 在注入 `<w:ind w:left="420" w:hanging="420"/>` 时，必须规范注入对应的 `<w:tabs><w:tab w:val="left" w:pos="${left}"/></w:tabs>`（依 ECMA-376 规范，放置在 `w:pPr` 合法位置）；
  2. 重写 `rebuildTabbedLabelWithTypography(p, seqStr, labelText, ...)`：
     - `Run 1` 的文本仅写入纯 `seqStr`（不附加多余两空格），紧接着追加 `<w:tab/>`；
     - 此时光标从 `seqStr`（约 240 dxa）通过 `<w:tab/>` 精准定位至制表位 `420 dxa`；
     - `Run 2` 写入 `labelText`，其正文文字首字母起始于精准的 `420 dxa`；
     - 未编号标签通过 `applyLeftIndentToP` 同样起始于 `420 dxa`，两者实现物理级 1:1 对齐！

### 1.2 Section 8 排版规范与题头保护 (REQ-02) 根因与解法
- **根因拓扑**：
  1. `8.1  Exposure controls:` 是单单元格行（`cells.length === 1`），进入通用 `formatSingleCellRow` 后被正则表达式 `/^(\d+\.\d+)/` 命中，被强行应用了 `applyHangingIndentToP`（420 dxa 悬挂缩进）和 9.5pt（`sz="19"`），从而被降级为普通正文；
  2. `Recommendation:` 在 `pipeline-engine.js:4707` 存在一条特殊逻辑：`if (/^Recommendation:?/i.test(cleanLabel)) { removeHangingIndentFromP(firstP); ... }`，被强行取消了缩进，导致相比于其上下所有 PPE 标签（均有 420 dxa 缩进）凸出到最左侧（0 dxa），产生严重的视觉锯齿；
  3. 历史模板在 GBK 编码下将破折号 `\xa8\x43` 识别成了字母 `C`，遗留为 `Fluororubber C FKM:` 乱码。
- **解法方案**：
  1. 在 `standardizeEnglishTypographyAndLabels` 遍历行时，显式拦截 Section 8 的题头：
     - 当 `sectionNumber === 8` 且文本匹配 `/^(?:8\.1\s*Exposure controls|8\.2\s*(?:Engineering|Personal))/i` 时，专门格式化为二级题头（左对齐、无悬挂缩进、Arial 10.5pt Bold 或 12pt Bold，保持底模原本的大号加粗层级，序号与题头间用标准西文空格分隔，不加 `<w:tab/>`）；
  2. 删除 `formatEnglishLabelCell` 中对 `Recommendation:` 取消缩进的特殊逻辑，让其统一走 `applyLeftIndentToP(firstP, indent, W_NS)`，与所有防护子标签在 420 dxa 上完全平齐；
  3. 在全局西文文本清洗阶段（`allTNodes` 清洗环），增加西文连字符与破折号正则归一化：将 `Fluororubber\s*[–—C]\s*FKM` 彻底规范化为 `Fluororubber - FKM:`，同步处理 `Butyl rubber - IIR:` 和 `Nitrile rubber - NBR:`。

### 1.3 核心底层防篡改封印与主审计硬门禁 (REQ-03)
- 在 `web/src/pipeline-engine.js` 关键排版代码块打上 `@ANTIGRAVITY_INVARIANT_LOCK` 源码级不可篡改标记。
- 在 `web/scripts/run_master_msds_audit.mjs` 中植入 5 项全自动断言，任何偏差直接 `process.exit(1)`。

---

## 2. 因果拓扑图 (Causal Topology)

```mermaid
graph TD
    A["pipeline-engine.js: applyHangingIndentToP / rebuildTabbedLabelWithTypography"] -->|注入 420 dxa tabs & 纯净 seqStr| B["编号标签文字准确定位至 420 dxa"]
    C["pipeline-engine.js: formatEnglishLabelCell"] -->|未编号标签 applyLeftIndentToP(420)| D["未编号标签正文起始于 420 dxa"]
    B & D --> E["REQ-01: 编号标签与未编号标签在 420 dxa 垂直基准线绝对对齐，间距紧凑均匀"]

    F["pipeline-engine.js: Section 8 专属题头分支"] -->|豁免 formatSingleCellRow, 保留 10.5/12pt Bold| G["8.1/8.2 保持正式二级题头"]
    H["pipeline-engine.js: formatEnglishLabelCell 移除 Recommendation 特判"] -->|applyLeftIndentToP(420)| I["Recommendation 与 PPE 标签 420 dxa 平齐"]
    J["pipeline-engine.js: 西文标点归一化"] -->|Fluororubber - FKM: 字符纯化| K["破折号乱码彻底清零"]
    G & I & K --> L["REQ-02: Section 8 排版规范严格对齐历史法定工程规范"]

    M["@ANTIGRAVITY_INVARIANT_LOCK 封印"] --> N["代码级防篡改保护"]
    O["run_master_msds_audit.mjs 5 项新增排版硬断言"] --> P["Exit Code 0 机器级一票否决门禁"]
    N & P --> Q["REQ-03: 编辑器底层与自动化门禁双重固化防篡改"]
```

---

## 3. 法定双清单自证 (Dual Lists Self-Certification)

### 3.1 拟变范围清单 (Proposed Changes List)

| 变更文件路径 | 拟变函数 / 代码块 | 因果角色 | 变更动机与核心逻辑 |
| :--- | :--- | :--- | :--- |
| `web/src/pipeline-engine.js` | `applyHangingIndentToP` | `[Root Source]` | 修复制表位剥离缺陷：在注入 `ind` 的同时正确注入 `<w:tabs><w:tab w:val="left" w:pos="${left}"/></w:tabs>`，使 `<w:tab/>` 能精准吸附于 420 dxa。 |
| `web/src/pipeline-engine.js` | `rebuildTabbedLabelWithTypography` | `[State Transition]` | 消除多余空格与制表位溢出：Run 1 仅写纯净 `seqStr`，不带尾部多余空格，紧接 `<w:tab/>`，使正文文字从 420 dxa 开始。 |
| `web/src/pipeline-engine.js` | `formatEnglishLabelCell` | `[State Transition]` | 消除 `Recommendation:` 缩进锯齿：删除取消缩进的特判，统一应用 `applyLeftIndentToP(firstP, indent, W_NS)`。 |
| `web/src/pipeline-engine.js` | `standardizeEnglishTypographyAndLabels` | `[Root Source]` | 保护 Section 8.1 / 8.2 题头：在遍历行时显式拦截 8.1 与 8.2，禁止委托给 `formatSingleCellRow` 降级，保持 10.5pt/12pt Bold 顶格排版。 |
| `web/src/pipeline-engine.js` | 全局标点清洗区 | `[State Transition]` | 字符集乱码清洗：将 `Fluororubber C FKM` 等历史 GBK 破折号残屑归一化为标准连字符 `-`。 |
| `web/src/pipeline-engine.js` | 相关排版函数头部与尾部 | `[Invariant Lock]` | 植入 `@ANTIGRAVITY_INVARIANT_LOCK` 源码级防篡改标记。 |
| `web/scripts/run_master_msds_audit.mjs` | `runAudit` 检查管线 | `[Verification Gate]` | 扩展 5 项排版自动化断言（制表位对齐、未编号标签对齐、8.1 题头规格、Recommendation 缩进一致性、乱码检测），违规直接退出码 1。 |

### 3.2 保持现状承诺清单 (Commitment to Preserve As-Is List)

| 既有功能模块 / 文件 | 承诺保持现状的范围与原因 |
| :--- | :--- |
| `web/src/pipeline-engine.js` 中的 Section 2 排版管线 | 保持现有 `buildFullWidthSection2`、`renderFullWidthRow`、危险说明与防范说明排版体系完全不变，绝不触碰已经验证合格的通栏与缩进。 |
| `web/src/pipeline-engine.js` 中的 Section 3 成分表格 | 保持现有通栏合并、CAS 号与浓度表格居中加粗逻辑完全不变。 |
| `web/src/pipeline-engine.js` 中的 Section 11/13/15 专属管线 | 保持 Section 11 毒理学双列排版、Section 13 废弃处置垂直居中、Section 15 法规结构子题头逻辑完全不变。 |
| `web/src/docx-engine.js` | 保持原有底模加载、样式缓存与 XML 打包结构不变，不引入任何多余依赖或全局变量。 |
| `web/templates/` 官方底模文件 | 绝对只读（SHA-256 不变），严禁对底模文件做任何物理写入或篡改。 |
| 现有主审计 150+ 项断言 | 全部既有断言必须无条件保持 100% 绿灯，绝不允许为了新增排版断言而弱化或删除任何既有校验。 |
