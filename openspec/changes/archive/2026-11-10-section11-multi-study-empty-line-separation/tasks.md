# 实施任务清单：全局通用多研究与多段落换行及空行保真体系

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: 底层通用单元格写入与结构化渲染引擎空行保真修复 (REQ-LB-01 & REQ-LB-02)**
  - **因果目标**：在 `web/src/docx-engine.js` 中修复通用 `writeCellValue` 压缩空行缺陷，并在 `writeStructuredToxicologyCellValue` 中保留空行，在试验边界渲染标准空白段落 `<w:p>`
  - **操作要点**：
    1. 在 `writeCellValue` 中将 `valStr.replace(/\r\n?/g, '\n').replace(/\n\s*\n+/g, '\n')` 升级为 `replace(/\n{3,}/g, '\n\n')`，使全系统通用支持段落间空行；
    2. 在 `writeStructuredToxicologyCellValue` 中规整换行符（统一 `\r\n` 为 `\n`）；
    3. 试验研究边界探测：当文本中出现 `对类似产品(?:的)?(?:毒理学)?研究` / `Studies on a similar product` 等试验结论且紧跟后续试验标题（`皮肤致敏性` / `测试种类` / `Local lymph node assay` / `Buehler` / `Species:`）时，确保其间存在空行标记；
    4. 遍历条目时，若当前为由换行分隔出的空行标记，渲染标准空白段落 `<w:p><w:pPr><w:spacing w:line="300" w:lineRule="auto"/><w:ind w:right="480"/><w:jc w:val="left"/><w:rPr><w:sz w:val="24"/></w:rPr></w:pPr></w:p>`，严禁连续输出多个空段落；
    5. 源码修改必须通过 `review_diff_in_vscode` 检阅。
  - **验收门禁**：中文 Section 11.6 致敏性单元格在 Buehler 试验与 LLNA 试验之间包含一个空白段落，通用 `writeCellValue` 保留 `\n\n`，单元测试退出码 0。

- [x] **Task 2: 通用多段解构与毒理动态英译引擎换行保真修复 (REQ-LB-03)**
  - **因果目标**：在 `web/src/smart-matching.js:decomposeCellPairToFacts` 中保留多段落空行，在 `web/src/pipeline-engine.js:translateToxicologyValueToEnglish` 中消除破坏性的 `\s+` 坍缩，确保多章节与英文版保留完整多段落与试验间空行
  - **操作要点**：
    1. 在 `decomposeCellPairToFacts` 中避免 `ps1.map(...).filter(Boolean)` 抹杀空段落；
    2. 在 `translateToxicologyValueToEnglish` 中替换 `t = t.replace(/\s+/g, ' ')` 为水平空格合并 `t = t.replace(/[^\S\r\n]+/g, ' ')`，保留换行符 `\n`；
    3. 针对英文试验标题与关键字段（`Local lymph node assay (LLNA):`, `Buehler Test (dermal):`, `Test type:`, `Species:`, `Result:`, `Method:`, `Classification:`, `Studies on a similar product`），确保其前后保持正确的换行结构；
    4. 源码修改必须通过 `review_diff_in_vscode` 检阅。
  - **验收门禁**：英文 Section 11.6 致敏性单元格具有清晰的多行段落结构，且在 Buehler 试验与 LLNA 试验之间包含一个空白段落，中英文 1:1 同构。

- [x] **Task 3: PU-2346A 8 份标准交付物重新编译与 170 项中央主审计及 Lint 零告警核销 (REQ-LB-04)**
  - **因果目标**：重新编译 PU-2346A 交付物，验证中英文 Section 11 多研究空行版式，并通过全部机检与审计门禁
  - **操作要点**：
    1. 重新生成 PU-2346A 8 份标准交付物并同步到 `E:\冠志\TDS MSDS (2)\待处理文件\PU-2346A\`；
    2. 验证生成的 DOCX 文件中 Section 11.6、11.11 的段落结构与空白行；
    3. 运行 `npm run lint`，确保 0 errors, 0 warnings（退出码 0）；
    4. 运行 `web/scripts/run_master_msds_audit.mjs`，确保 170/170 项全绿（退出码 0）；
    5. 记录根因、解法与防退化方案至 `CHANGELOG.md`。
  - **验收门禁**：170/170 主审计全绿，Lint 零错误零警告，真实退出码 0。
