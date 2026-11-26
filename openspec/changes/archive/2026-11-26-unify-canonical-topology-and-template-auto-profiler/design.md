# Design: Single Canonical Topology & Template Auto-Profiler

## 1. 因果拓扑与三层正交模型

```text
  [Source Facts / IR] (CN 语义解析 + 段落数组切分)
           │
           ├──► Content Projection (CN 原文 / EN 翻译, 1:1 槽位与空行守恒)
           │
  [Template DOCX] ──► Template Auto-Profiler (众数表宽 / 众数两栏 / 角色字阶 / Tab 标尺)
           │                    │
           ▼                    ▼
  [topology-matcher.js] + [template-editor.js] ──► Rendered DOCX/PDF
                                │
                                ▼ (同一份 TemplateProfile)
                    [staged-mechanical-audit.js] ──► 机械审计 PASS/FAIL
```

## 2. 关键技术设计决策

### 2.1 Template Auto-Profiler（抗脏表众数探测）
在 `inspectTemplateSchema` (`web/src/template-editor.js`) 中新增 `detectTemplateGeometryProfile(engine)` 与增强 `typographyProfile` 探测：
1. **众数表宽 (`standardTableWidthDxa`)**：
   - 遍历 16 个 Section 表，读取 `tblW` 与 `tblGrid` 之和；
   - 过滤掉异常/非法值（`< 5000` 或 `> 15000 dxa`），统计出现频次最高的值（众数）；若并列则优先取最常见标准值或中位数。
   - 对当前冠志/国彩 CN/EN 模板，15/16 张表均为 `9781 dxa`（仅 Table 8 历史为 `9860`），众数算法自动精确收敛到 **`9781`**；若用户换用 `9000 dxa` 新模板，众数自动收敛到 **`9000`**。
2. **众数两栏列宽 (`standardTwoColGridDxa`)**：
   - 遍历所有 2 列 KV 表（排除 S11 脏 3 列表和 1 列通栏表），统计 `[col0, col1]` 组合频次最高者；
   - 若某模板总宽被统一修正（如 `standardTableWidthDxa` 变化），自动按总宽差值微调第 2 列宽度以保证 `col0 + col1 === standardTableWidthDxa`。
3. **角色字阶自动探测 (`typographyProfile`)**：
   - `seqFontFamily` / `seqFontSize`：从带 `\d+\.\d+\t` 序号前缀的单元格首个 run 众数提取（当前 CN 自动得出 `Times New Roman / 21`，EN 自动得出 `Arial / 19`）；
   - `labelFontFamily` / `labelFontSize`：从加粗标签文本 run 众数提取（当前 CN `宋体 / 24`，EN `Arial / 19`）；
   - `valueFontFamily` / `valueFontSize`：从右侧值格非加粗 run 众数提取（当前 CN `宋体 / 24`，EN `Arial / 19`）；
   - 任意项无法探测时，优雅回退至 `GLOBAL_ROLE_STYLE_TOKENS` 语言默认值。

### 2.2 `topology-matcher.js` 语言分叉收口
- 检查并清理 `topology-matcher.js` 中非业务锁定的语言分叉：
  - 将 `S3` 的 `3.2\t成分` / `3.2\tIngredients` 题头归一化统一为基于 `preGridHeaderItem` 与行语义的语言无关匹配（保留文本按 `lang` 投影为 `'3.2\t成分'` 或 `'3.2\tIngredients'`），不再依赖 `lang === 'zh' && tplRows[2]` 的脆弱行号假设。
  - 保留 `@ANTIGRAVITY_INVARIANT_LOCK` 明确的 `S1` 英文合并 `Product name` 业务规范（属内容投影规则）。

### 2.3 `staged-mechanical-audit.js` 同源消费
- `runStagedMechanicalAudit(docxPath, options)` 接收 `options.templateProfile`；
- 当 `options.templateProfile` 未显式传入（如独立命令行审计）时，从被检文档 16 张 Section 表动态计算众数表宽 `expectedTableWidth`（合理区间 `5000..15000`），要求全 16 张表严格统一等于该众数宽度，彻底告别写死 `9781`。
