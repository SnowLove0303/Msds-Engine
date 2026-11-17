# 提案: 场景B - 11月16日 22款产品 176份全量交付物母版拓扑与企业预设标准化刷新

## 一、 背景与变更目标

在 2026-11-16 的 MSDS 批量生产任务中，系统针对 22 款产品（涵盖 PU、HPU、PA 单组份与 PA 羟基 4 大品类）产出了 88 份 DOCX 与 88 份 PDF。经系统性全检法医审计，发现历史产出物存在三大微观几何与企业预设瑕疵：
1. **企业主体名称未完全统一**：国彩部分文件存在历史旧称“英德市国彩新材料有限公司”残留，需统一为官方法定名称“英德市国彩精细化工有限公司”（英文：`Yingde Guocai Fine Chemical Co., Ltd.`）；
2. **页脚修订日期 Y 轴浮动**：第 0 行单元格未显式继承垂直居中与零行距，导致修订日期基准线高于左侧实体名称约 $7.27\text{ pt}$；
3. **页脚页码字阶过大**：页脚页码硬编码为小四号（12pt / 24半磅），脱离了母版小五号（9pt / 18半磅）的规范字阶。

当前底座通用母版拓扑识别、动态预设及排版渲染引擎（`web/src/template-topology-recognizer.js`, `web/src/docx-engine.js`, `web/src/msds-db.js`）已全部升级并完成了单体与集成测试验证。用户在 Step 0 正式选定【场景B】：将 11 月 16 日改动的这 22 款产品全部基于最新通用流水线重新覆写并生成高清矢量 PDF，确保历史交付物库 100% 干净、统一、无瑕疵。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM Injection)

| 需求编号 | 需求描述 | 拟定资产与交付指标 | 验证命令与准出条件 |
| :--- | :--- | :--- | :--- |
| **REQ-SCENARIO-B-01** | 全量 22 款产品 176 份终验交付物批处理覆盖刷新 | 覆盖 4 个品类共 22 款产品，重新执行标准化生产覆盖刷新 88 份 DOCX 及 88 份 PDF | 22 目录各含 4 DOCX + 4 PDF，总数 176 份物理存在且时间戳最新 |
| **REQ-SCENARIO-B-02** | 国彩企业主体法定命名全量统一 | 中文必须为 `英德市国彩精细化工有限公司`，英文必须为 `Yingde Guocai Fine Chemical Co., Ltd.` | 全量交付物中废弃旧称“英德市国彩新材料有限公司”及英文旧称检索出现次数为 0 |
| **REQ-SCENARIO-B-03** | 页脚修订日期与实体名称 Y 轴水平基准线严密齐平 | 页脚第 0 行右侧与左侧单元格中心高差 $\Delta Y \le 1.5\text{ pt}$，段落间距归零 | PyMuPDF 实测 $\Delta Y \le 1.5\text{ pt}$，两端处于同一视觉基线 |
| **REQ-SCENARIO-B-04** | 页脚页码字号物理规格严格恢复标准 9pt | Word XML `<w:sz>` 严格等于 18（9pt），PyMuPDF 外接矩形高度 $H_{\text{box}} \le 13.5\text{ pt}$ | 176 份交付物中 0 处 12pt (24半磅) 残留，$H_{\text{box}} \le 13.5\text{ pt}$ |
| **REQ-SCENARIO-B-05** | 页脚残存伪字符与排版瑕疵彻底清零 | 消除 `"P修订日期"` 伪字符前缀残留、消除异形窄空格 `\u2005`，消除尾随多余空格 | 176 份交付物中 `/P\s*修订日期/i` 与 `\u2005` 匹配计数为 0 |
| **REQ-SCENARIO-B-06** | 源文件化学事实 100% 守恒与双轨两阶 165 项对账 | 严格忠于各产品源文件化学事实（CAS、组分、GHS、理化特性），通过双轨两阶 165 项全要素对账 | 22 款产品全部通过双轨两阶 165 项全要素审计，退出码 0 |

---

## 三、 法定双清单自证 (Dual-List Certification)

### 1. 拟变范围清单 (Proposed Scope of Change)
| 变动文件 / 产出物路径 | 因果角色 (Causal Role) | 变动说明 |
| :--- | :--- | :--- |
| `openspec/changes/2026-11-17-scenario-b-batch-deliverables-refresh-22-models/*` | `[Specification Legislation]` | OpenSpec 增量规格四大法定资产 |
| `算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-6013Bio/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PU-6013Bio 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7660/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 HPU-7660 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7700/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 HPU-7700 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3612/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-3612 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3615/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-3615 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3617/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-3617 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3655/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-3655 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3656/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-3656 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-3663/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-3663 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4000/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4000 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4006/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4006 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4771/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4771 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4778/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4778 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4800/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4800 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4804T/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4804T 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4807/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4807 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4808/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4808 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4812/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4812 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4816/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4816 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4817/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4817 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4819/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4819 双主体 × 中英双语交付物 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4835/*` | `[Deliverable - 4 DOCX + 4 PDF]` | 刷新生成 PA-4835 双主体 × 中英双语交付物 |
| `web/tests/batch_refresh_scenario_b.mjs` | `[Batch Pipeline Driver]` | 驱动 22 款产品批量刷新的受控无损调用驱动脚本 |
| `web/tests/audit_batch_refresh_scenario_b.mjs` | `[Forensic Full Audit]` | 针对 176 份终验交付物的物理坐标与字符合规法医全检脚本 |

### 2. 保持现状承诺清单 (Invariant Scope of Preservation)
| 受控模块 / 承重墙路径 | 保护原因与封印级别 |
| :--- | :--- |
| `web/src/`（核心引擎代码） | 引擎修复已封印并经回归测通，生产期严禁随意变动底层引擎 |
| `web/templates/`（官方母版） | 官方母版拓扑与边框样式基座，物理绝对只读 |
| `算法训练材料/源文件材料/`（全部原始源文件） | 原始事实指纹源头，严禁修改任何原始源文件 DOCX/DOC |
| 既有 16 章节化学事实契约 | 严禁因格式刷新而改动任何既有 CAS 号、组分比例与分类数据 |
