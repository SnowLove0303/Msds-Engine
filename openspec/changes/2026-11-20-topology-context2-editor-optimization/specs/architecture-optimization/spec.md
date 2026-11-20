# Specification: 拓扑结构 + Context 2 + 编辑器输入规范与剪枝全链路优化

## 1. Preset 全拓扑占位与锁定契约 (RTM-01)
- **REQ-PRE-01**: Preset 配置 SHALL 支持声明全 16 章节拓扑结构下的任意占位槽位（`sectionSlots`: `{ sectionNumber, matchAnchor/slotKey, value }`），不限于 Section 1.3。
- **REQ-PRE-02**: WHEN `compileTopologyOps` 编译某章节槽位时，IF 该槽位已被目标 Preset 声明占位（或属于企业主体法定槽位如 1.3 供应商信息），匹配引擎 SHALL 跳过源文档对该槽位的写入并锁定由 `applyPreset` 独占填充，严禁甲公司源文串流至乙公司输出。

## 2. Context 2 输入规范治理契约 (RTM-02)
- **REQ-C2-01**: Context 2 输出英文文本 SHALL 将所有英文字符后的全角冒号 `：` 归一化为西文半角 `:`（消除 `#108`）。
- **REQ-C2-02**: Context 2 输出中英文参数 SHALL 将非标全角比较符 `≧`、`≦` 归一化为标准 `≥`、`≤`（消除 `#116`），在数值与计量单位（`mm`, `min`, `cm`, `kg`, `hPa`, `mPa·s` 等）间保留单西文空格（消除 `#117`），并清除中文参数末尾多余的西文句点 `.`（消除 `#118`）。

## 3. 编辑器智能安全剪枝契约 (RTM-03)
- **REQ-EDT-PRUNE-01**: 编辑器 SHALL 提供拓扑安全剪枝原语 `pruneRowsSafely(session, sectionNumber, candidateRowIndices)`。
- **REQ-EDT-PRUNE-02**: WHEN 候选删除行属于父级分类题头（如 `Hand protection:`、`手部防护：`、`1.3 供应商信息：`、`8.1 控制参数：`）且其后存在至少一个非空有效子行时，编辑器 SHALL 拒绝删除该父级题头行（消除 `#112`）。

## 4. 拓扑驱动的编辑器排版几何硬锁契约 (RTM-04)
- **REQ-TOPO-LOCK-01**: `inspectTemplateSchema` SHALL 自动从目标模板提取 `typographyProfile`（含 `fontFamily`, `labelFontSize`, `seqFontSize`, `valueFontSize`, `isEnglish`, `tabStopTierA: 420`, `tabStopTierB: 560`）。
- **REQ-TOPO-LOCK-02**: 编辑器在保存或执行 `applyTopologyTypographyLock(session, typographyProfile)` 时 SHALL：
  1. 依据 `typographyProfile` 统一全篇 16 章节第 0 列标签与值格字阶（CN 标签/值 `sz="24"`、EN 全篇 `sz="19"`，消除 `#114, #115, #124~#126`）；
  2. 强制保留并重塑结构性题头与子题头加粗（`8.1 控制参数`/`Exposure controls`、`手部防护`/`Hand protection`、S15 `其它的规定：`与`符合下列法规要求：`，消除 `#111, #113, #120, #123`）；
  3. 依据 `typographyProfile` 将全 16 章节编号标签（`X.Y ...`）统一转换为**单 `<w:tab/>` 间隔 + Tier A(420)/Tier B(560) 悬挂缩进**，并为英文 `Recommendation:` 应用 `420 dxa` 左缩进（消除 `#119, #120, #121, #128` 及 `104` 条 `SEQ_NO_TAB`）。

## 5. 审计模块去硬编码校准契约 (RTM-05)
- **REQ-AUD-CAL-01**: `run_master_msds_audit.mjs` 与 `lint_source_grounding.mjs` SHALL 移除与“纯源继承”冲突的过时硬编码断言（S1 固定 9 行 `#110`、S13 固定 4 行 `#122`、S14 禁止源文 ADG 与固定 8/9 行 `#127`），并将非危英文判定兼容 `Not classified as dangerous goods` / `Not dangerous goods`（消除 `#129`）。
