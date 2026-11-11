# Change Proposal: 全局编辑器底层拓扑字阶与排版治理 (Global Editor Topology Typography Governance)

## 一、 背景与根因剖析 (Background & Root Cause)

### 1. 历史病态：业务层与模型层“打补丁”式的恶性循环
过往在交付不同产品型号的 8 格式 MSDS 时，由于编辑器底层缺乏对全篇 16 个章节、页眉页脚的强制性排版拓扑约束，开发过程中往往演变为：
1. 底层排版引擎遗留了极其荒唐的“局部缩水”逻辑（如 `universal-editor-primitives.js` 中 `(runText.length >= 5) ? '15' : '18'`，将长序号硬生生从标准 9.5pt 压至 9pt 甚至 7.5pt）；
2. 上层流水线 `pipeline-engine.js` 或具体型号生成脚本（如 `generate_os8970_deliverables.mjs`）为了应付审计，手工追加了数百行脆弱的后置 DOM/XML 正则替换代码（针对 Section 2, Section 3, Section 8, Section 11, Section 13, Section 15 等处做局部硬编码修复）；
3. 这种“打补丁”不仅污染了代码架构，而且导致每次换型号或重新生成时，都需要经历长达 1.5 小时的“生成 -> 报错 -> 修改正则 -> 进程被文件锁挂起 -> 重新生成”的痛苦内耗；
4. 最严重的是，用户直接指出：“编辑器就是用来约束全部产出内容的！”——排版与样式的治理权力必须全部收敛到编辑器底层拓扑结构中，全篇 16 个章节以及页眉页脚，必须在中英文双语下被严格“规定死”，绝不允许任何局部特判和漏洞复发。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM Verbatim Injection)

| 需求编号 | 用户原始诉求与核心指令 | 增量规格立法落实 (OpenSpec Delta) | 严苛验收指标 (Acceptance Criteria) |
| :--- | :--- | :--- | :--- |
| **REQ-01** | 全篇 16 个 section，算上页眉页脚，给我规定死 序号、标签、值的字体和字号 | 在 `MSDS_DESIGN_TOKENS` 与 `applyGlobalTypographyProjection` 中建立涵盖 Header、Footer、Section Header、Sequence Number、Label、Value、Table Header 的全域法定真理源。 | 1. 页眉/页脚/16章节标题/序号/标签/值全部纳入拓扑约束。<br>2. 任何通过编辑器导出的文档均自动符合规范。 |
| **REQ-02** | 别只针对几个 section 或几个部分，从底层拓扑去处理 | 彻底移除所有按章节、按字符长度特判缩放的垃圾代码（如 `? '15' : '18'`），在编辑器底层建立 16 章节无死角的全表格遍历投影机制。 | 1. 英文版全篇 16 章节所有序号恒定为 Arial 9.5pt (`sz="19"`) 加粗。<br>2. 中文版全篇所有序号恒定为 Times New Roman 10.5pt (`sz="21"`) / 9.5pt (`sz="19"`) 加粗。 |
| **REQ-03** | 标签与值的字体字号严格中英文规定死 | 彻底落实“表格二元分类法则”，标签加粗，填写值绝对常规体；中英文完全分离。 | 1. 英文版：标签 Arial 9.5pt 加粗，值 Arial 9.5pt 常规体。<br>2. 中文版：标签 宋体 12pt 加粗，值 宋体 12pt 常规体。 |
| **REQ-04** | 复合通栏行（Section 2/11/15）标签与值原生解耦 | 在编辑器底层（`docx-engine.js:renderFullWidthRow` 与 `applyGlobalTypographyProjection`）直接将标签与值拆分为加粗 Run 与常规体 Run。 | 结构性标签（如信号词、象形图、防范说明、法规要求）加粗，后随内容（无、None、Not classified）常规体，绝不泄露。 |
| **REQ-05** | 彻底清除 Pipeline 和生成脚本中的层层补丁，生产从 1.5 小时降至秒级 | 清除 `generate_os8970_deliverables.mjs` 中 300 行脆弱 XML 正则修补，让流水线直接依赖受控的底层编辑器。 | 8 格式生产在 1 分钟内端到端完成，主审计 158 项全绿通过。 |
| **REQ-06** | 保证以后产出的所有 msds 字体字号符合规范 | 建立机械化终审门禁，对全文档 16 章节所有文本节点的字体字号执行零容忍断言。 | 机械审计脚本新增对英文第 0 列序号/标签字号的全量扫描，退出码 0 为发布充要条件。 |

---

## 三、 拟变范围与影响评估 (Scope & Blast Radius)

- **核心修改文件**：
  1. `web/src/universal-editor-primitives.js`: 升级 `MSDS_DESIGN_TOKENS`，重构 `applyGlobalTypographyProjection` 覆盖页眉页脚与全 16 章节。
  2. `web/src/docx-engine.js`: 强化 `renderFullWidthRow` 与 `formatSection9LabelCell`，保证底层生成的 XML 节点完备携带 `sz`, `szCs`, `rFonts`。
  3. `web/src/pipeline-engine.js`: 清理冗余的局部字号重复修补代码，收敛至通用编辑器投影。
  4. `web/scripts/generate_os8970_deliverables.mjs`: 剥离 300 行脆弱 DOM 正则替换，直接调用流水线秒级生成。
  5. `web/scripts/run_master_msds_audit.mjs`: 加固第 0 列英文序号全量 9.5pt (`sz="19"`) 审查断言。
- **爆炸半径控制**：所有改动严格限制在编辑器拓扑与排版投影层，绝对不篡改源文件的任何化学事实数据（成分 CAS、含量、理化指标、毒理学数值）。
