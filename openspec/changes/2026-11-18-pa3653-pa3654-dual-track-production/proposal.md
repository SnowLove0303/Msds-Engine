# Proposal: PA-3653 与 PA-3654 MSDS 与 TDS 双轨工业级量产与底座混合排版解析增强

## 1. 业务背景与变更动机 (Background & Motivation)

用户下达明确指令：
针对 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\源文件材料\2-1 单组份水性丙烯酸乳液 PA` 目录下的 **PA-3653** 与 **PA-3654** 两大产品型号，分别执行 **MSDS** 与 **TDS** 双轨全量交付产出：
- **Main Agent (主协调智能体)**：负责 MSDS 工业级量产与深度法医级对账审计（4 DOCX + 4 PDF，共 8 份/型号）。
- **SubAgent (tds-manager 子智能体)**：负责 TDS 工业级量产与单页排版合规审计（4 DOCX + 4 PDF，共 8 份/型号）。
- **目标交付路径**：`F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\02-1 单组份水性丙烯酸乳液 PA\` 下对应的 `PA-3653` 与 `PA-3654` 型号文件夹。
- **总交付资产矩阵**：2 型号 × (8 MSDS + 8 TDS) = **32 份独立交付物**。

在 Step 1 深度底座感知与承重墙探查中，发现了关于两份源文件的重要物理结构特征：
- `PA-3653 MSDS（冠志）.docx` 与 `PA-3654 MSDS（冠志）.docx` 均非标准的 16 个独立表格（`<w:tbl>`），而是采用 **“段落章节标题 (`<w:p>`) + 核心数据表格 (`<w:tbl>` 仅 3 个) + 文本键值段落 (`<w:p>` 14 组)”** 的混合排版拓扑（共 33 个 Word 记录节点）。
- 既有的 `recognition-engine.js` 强假设章节标题嵌入在独立表格行首，未能在跨记录流中持久维护 `currentSecNum` 章节状态机，导致抽取结果全部落空（组分 0、理化 0）。
- 因此，本次变更必须在底座层彻底攻克**混合排版拓扑识别机制 (Hybrid Paragraph-Table Parsing)**，打通通用数据流，方可支撑流水线 100% 真实数据无损注入。

---

## 2. 需求全量物理对账矩阵 (1:1 RTM Matrix)

本矩阵严格 1:1 守恒 Step 0《需求全量对账备忘录》中的 6 项法定条款：

| 需求编号 | 需求项名称 | 负责主体 | 交付物规格与验证标准 | 守恒状态 |
| :--- | :--- | :--- | :--- | :--- |
| **RTM-1** | PA-3653 MSDS 8 份全量交付 | Main Agent | 产出 4 DOCX + 4 PDF 交付矩阵至 `PA-3653/` 目录，通过三阶法医审计 | 100% 守恒 |
| **RTM-2** | PA-3654 MSDS 8 份全量交付 | Main Agent | 产出 4 DOCX + 4 PDF 交付矩阵至 `PA-3654/` 目录，通过三阶法医审计 | 100% 守恒 |
| **RTM-3** | PA-3653 TDS 8 份全量交付 | SubAgent `tds-manager` | 产出/复核 4 DOCX + 4 PDF 交付矩阵至 `PA-3653/`，验证单页合规 | 100% 守恒 |
| **RTM-4** | PA-3654 TDS 8 份全量交付 | SubAgent `tds-manager` | 产出/复核 4 DOCX + 4 PDF 交付矩阵至 `PA-3654/`，验证单页合规 | 100% 守恒 |
| **RTM-5** | 混合排版识别状态机底座增强 | Main Agent | 升级 `recognition-engine.js`，支持跨段落与跨表格章节状态机继承 | 100% 守恒 |
| **RTM-6** | 三阶深度法医级对账审计 | Main Agent & SubAgent | 165 项双极双层审计 PASS + 167 项主审计 PASS + 翻译双显对齐 100% | 100% 守恒 |

---

## 3. 风险评估与承重墙锁定 (Risk & Boundaries)

1. **底座通用性保护 (Universal Compatibility)**：
   - 增强 `recognition-engine.js` 时，必须确保既有 16 表格标准源文档（如 `HPU-7700`, `EC-1848`, `PA-3612` 等）的解析结果绝对不受影响。
   - 运行既有测试集保证退出码 0。
2. **严防脏数据污染 (Anti-Slop)**：
   - 绝不使用硬编码伪造字段，成分（Section 3）必须真实从 Table 1 提取（`丙烯酸共聚物`、`去离子水`、`氨水`），理化（Section 9）真实从 Table 2 提取（11 项指标）。
3. **爆炸半径物理封印 (Blast Radius)**：
   - 仅限 `web/src/recognition-engine.js` 及交付物生成。严禁改动任何无关目录或 SelfWork 空间。
