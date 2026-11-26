# 🧪 MSDS-Studio 唯一体系交接资料包与新 Agent 标准化操作入口 (v10.0-UNIFIED)

> **定位**：本目录（`体系交接文档/MSDS_Studio_Agent_Test_Kit`）为 **MSDS-Engine 唯一体系交接资料包与新 Agent 标准操作入口**，统一合并**标准化覆写产出**与**机械 + Agent 三任务介入审计**全闭环。
> **核心技能规范**：完整 SOP 与不变量见本包内 [skill/SKILL.md](./skill/SKILL.md)（与全局 `~/.gemini/config/skills/msds-studio/SKILL.md` 100% 同步）。

---

## 🚨【最高法定红线：唯一标准入口与三权分立铁律】

1. **唯一合法生产入口**：所有正式 8 格式（4 DOCX + 4 PDF）MSDS 产出**必须且只能**通过本包 [run_standard_production.mjs](./run_standard_production.mjs)（或 `../../web/scripts/produce_standard_deliverables.mjs` / MCP `msds_batch_export_eight`）执行，底层统一调度 `web/src/production-orchestrator.js` 7 阶标准流水线。
2. **覆写产出 Agent 绝对禁改源码与审计**：执行覆写产出的 Agent **严禁修改任何 `web/src/*`、`web/scripts/*` 源码及任何审计脚本/规则**（严禁为通过任务而恶意篡改或绕过机械审计），严禁私写分步脚本或调用 LibreOffice 转 PDF。**过程中只要出现报错或审计失败，必须立即停机向主协调汇报错误所在，由用户最终判断裁决**。
3. **审计 Agent 严禁改码与强制三任务交付**：负责审计的 Agent **严禁修改源码或产出物**，必须默认对产出结果保持质疑，严格完成 **任务 1（内容审计）+ 任务 2（拓扑审计）+ 任务 3（全量并集清单与 PDF 终审）** 三份报告并向主协调汇报，由主协调呈报用户判断。
4. **系统修改与重同步归口**：仅在用户明确裁决指令下，由主协调对系统进行修改、同步更新本资料包并重新分发任务。

---

## 一、 资料包资产清单

| 资产路径 | 角色说明 |
| :--- | :--- |
| `skill/SKILL.md` | **完整工业级生产与审计总纲**（12 阶 SOP + 阶段 6 三任务审计规范） |
| `run_standard_production.mjs` | **唯一受控覆写生产 Runner**（封装 `production-orchestrator.js` 7 阶流水线） |
| `run_three_task_audit_prep.mjs` | **Agent 审计任务 1 前置采集器**（生成中英文单文件合并版 `<MODEL>_context3.md`） |
| `presets/company_presets.json` | **企业双主体预设**（广州冠志 / 英德国彩） |
| `templates/` | **官方中英文正式底模** |
| `source/` & `facts_override_sample.json` | **示例源文件与事实覆盖模板** |

---

## 二、 标准执行两步走（先产出 → 后三任务审计）

### 第一步：两段式 Agent-in-the-Loop 标准化覆写产出（严禁跳过校对直通）
```powershell
# 1. 阶段 A：运行 Context 1 -> Context 2 并导出校对包（不写入编辑器）
node run_standard_production.mjs --source="<SOURCE_DOCX>" --model=<MODEL> --targetDir="./output/<MODEL>" --prepareOnly

# 2. Agent 逐行校对 <MODEL>_context2_review.md 的中英文翻译，修正/补全 <MODEL>_context2_translations.json

# 3. 阶段 B：Agent 显式批准 Context 2 后，放行写入编辑器、导出 4 DOCX + 4 PDF 与机械审计
node run_standard_production.mjs --source="<SOURCE_DOCX>" --model=<MODEL> --targetDir="./output/<MODEL>" --approveContext2 --translations="./output/<MODEL>/<MODEL>_context2_translations.json"
# 如需直接分流至 Word/PDF 目录，可附加：--wordDir="<WORD_DIR>" --pdfDir="<PDF_DIR>" --skipUserSync
```

### 第二步：强制 Agent 三任务介入审计（默认质疑）
1. **任务 1（内容审计）**：运行 `node run_three_task_audit_prep.mjs --model=<MODEL> --source="<SOURCE_DOCX>" --cn="<CN_DOCX>" --en="<EN_DOCX>" --out="./output/<MODEL>/<MODEL>_context3.md"` 生成**单文件合并版 Context 3**（含 16 章节三方对照总览表 + CN 全量 + EN 全量）。依据**“内容来源于源文件、继承源文件内容”**并兼顾底层硬规白名单，逐章核查缺漏与非法新增，输出 `<MODEL>_content_audit_report.md`。
2. **任务 2（拓扑结构审计）**：对全部 8 份交付物（4 DOCX + 4 PDF）实测 7 大维度（模板与示范清零、双主体零串号、表格拓扑含 **S11 单物质 2 列分列 vs 多物质通栏**、**S3/S8 居中零 `w:ind`**、排版 Tokens 含下标/制表符、EN 零中文、官方 COM PDF 通道与页数锚点），输出 `<MODEL>_topology_audit_report.md`。
3. **任务 3（全量并集核销与 PDF 终审）**：将任务 1 与任务 2 **100% 无删减取并集**构建全量问题清单，结合 PDF 逐页渲染内容复核作出放行/阻断裁决，输出 `<MODEL>_final_audit_report.md`。

---

## 三、 必须死守的局部硬性规范与底层不变量

1. **Section 1 中英文差异局部规范 (`@ANTIGRAVITY_INVARIANT_LOCK`)**：
   - 中文版保留 10 行：`1.1 产品名称：` 填纯型号，`中文名称：` 严格继承源文中文品名（**不拼接型号**）；
   - 英文版合并为 9 行：取消 `Product Chinese name`，将完整英文品名与型号合并写入 `1.1 Product name:`。
2. **Section 2 源文继承与防虚增**：
   - 非危险化学品严禁外生编造 `GHS象形图：无`、`信号词：无`；同时保留源文 `2.2 标签要素`（`2.2 Label elements`）标题，不擅自删减。
3. **Section 3 & Section 8 控制参数物质表居中零缩进**：
   - 多列数据网格全部 `jc="center"`、`vAlign="center"`，且**彻底清除 `w:ind`（`left`/`right`/`hanging`）**，确保表头与第 1..N 行严格同轴居中。
4. **Section 8 唯一规范顺序 (`@ANTIGRAVITY_INVARIANT_LOCK`)**：
   - 强制 **`8.1 暴露控制 / Exposure controls`** 在前，**`8.2 控制参数 / Control parameters`** 在后（含控制参数物质表时置紧邻表头之前）。
5. **Section 11 双范式结构**：
   - 一般情况（同一测试条件仅涉及 1 种物质）：**必须采用标准 2 列分列结构**；
   - 特殊情况（同一测试条件涉及 ≥2 种物质说明）：方可使用通栏。
6. **PDF 官方通道唯一性**：
   - 严禁 LibreOffice 裸转，必须通过 `web/src/pdf-converter.js`（`Windows COM / WPS/Word`）生成高清矢量 PDF。
