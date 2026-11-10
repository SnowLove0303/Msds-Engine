# 实施任务清单：全局 16 章节黄金基准对齐 (9.1 外观标尺) 与层级树拓扑工程

> **单任务专注锁机制 (Single-Focus Lock)**：同一时刻严格只能有 1 个任务处于 `[-]` 进行中状态，前置任务验证完全通过（真实退出码 0）后方可解锁并推进下一项。严禁并行涂鸦！

## 实施阶段任务分解

- [x] **Task 1: Section 3 序号去重与 `<w:numPr>` 自动编号属性全局物理清除 (REQ-S3-DUP-PURGE)**
  - **因果目标**：彻底从 DOM 树与段落生成逻辑中清除所有 `<w:numPr>`，杜绝 Word 动态编号与静态文本叠加产生的 `3.1 3.1` 重复
  - **操作要点**：
    1. 在 `docx-engine.js` 的 `cleanTabsInNode` 与段落净化管道中，遍历并彻底移除所有 `<w:numPr>` 节点；
    2. 在 `pipeline-engine.js:normalizeSection3Typography` 中确保仅有单一物理文本序号 `3.1` 与 `3.2`，绝无重复拼接；
    3. 验证命令：检查生成的 DOCX XML，确认 Table 3 段落中 `<w:numPr>` 为 0，且文本中无重复 `3.1`。
  - **验收门禁**：DOCX 中 `<w:numPr>` 数量 = 0，Section 3 重复序号数量 = 0。

- [x] **Task 2: 9.1 外观黄金标尺抽取与全 16 章节父级/子级标签铅垂对齐引擎 (REQ-GOLDEN-ANCHOR, REQ-SUB-PARENT-ALIGN)**
  - **因果目标**：以 `9.1 外观` 的序号与正文落点为基准，统一全 16 章节父级带序号标签正文与子级标签首字铅垂对齐
  - **操作要点**：
    1. 升级 `universal-editor-primitives.js:applyGlobalTypographyProjection`：
       - 父级带序号标签统一挂载 `<w:tab/>` 与 `<w:ind w:left="420" w:hanging="420" w:leftChars="0"/>`，将正文首字严格锁定在 420 dxa（80.28 pt）；
       - 子级无序号标签统一挂载 `<w:ind w:left="420" w:leftChars="0"/>`（去除 hanging 与 firstLine），使首字绝对平齐 420 dxa 黄金基准线；
    2. 在 `pipeline-engine.js:rebuildUnifiedLabelRun` 中彻底废除静态两空格 `  `，接入 `<w:tab/>` 黄金锚点；
    3. 验证命令：PDF 文本首字坐标提取脚本，校验 `8.1 暴露控制` 的“暴”与 `9.1 外观` 的“外”及子标签首字 X 坐标是否 100% 重合。
  - **验收门禁**：父级与子级标签正文首字 X 坐标偏差 = 0 pt (实测通过，46/46 行均为 80.28 pt)。

- [x] **Task 3: 长标签折行第二行首字黄金基准锁定与子值向右阶梯缩进 (REQ-WRAP-VERTICAL-ALIGN, REQ-SUBVAL-RIGHT-INDENT)**
  - **因果目标**：解决 11.7 等长标签折行第二行错位回缩缺陷，并实现子标签对应值单元格向右阶梯缩进
  - **操作要点**：
    1. 确保带序号长标签折行时，第二行直接继承 420 dxa 悬挂缩进基准线，使第二行首字（如“性：”）与第一行正文首字（“亚”）绝对垂直对齐；
    2. 在 `applyGlobalTypographyProjection` 中识别子级标签对应值单元格，段落显式注入 `<w:ind w:left="240" w:leftChars="0"/>`（向右阶梯缩进）；
    3. 验证命令：检查 11.7 折行第二行首字坐标，并验证子级值单元格的左缩进。
  - **验收门禁**：折行次行首字错位偏差 = 0 pt (11.7 次行“性：”实测 80.28 pt，第一行正文实测 80.28 pt)，子级值单元格向右缩进显式生效 (left=240 dxa，实测 247.20 pt)。

- [x] **Task 4: 集中式中央主审计套件扩充至 170 项全绿通过与全流程回归 (REQ-S3-DUP-PURGE ~ REQ-SUBVAL-RIGHT-INDENT)**
  - **因果目标**：将黄金基准对齐、子标签值缩进与 `<w:numPr>` 零容忍注入中央主审计套件，全量重新编译并实现 100% 满分通过（退出码 0）
  - **操作要点**：
    1. 在 `run_master_msds_audit.mjs` 中新增 4 项强门禁物理断言（扩充至 170 项）；
    2. 执行底层流水线重新编译产出物并同步交付目录；
    3. 运行中央主审计套件验证；
    4. 记录根因与解法至 `CHANGELOG.md`。
  - **验收门禁**：Master MSDS Audit 170/170 项全绿，真实退出码 0 (实测: 170/170 满分全绿，退出码 0)。
