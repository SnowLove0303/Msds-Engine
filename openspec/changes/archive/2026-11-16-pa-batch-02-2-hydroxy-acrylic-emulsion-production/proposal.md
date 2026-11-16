# 提案: 02-2 水性羟基丙烯酸乳液全量 13 型号受控覆写与全要素深度审计

## 一、 背景与变更目标
根据用户指令，针对 `算法训练材料/源文件材料/2-2 水性羟基丙烯酸乳液 PA RA` 目录下的全部 13 个型号：
1. `PA-4000`
2. `PA-4006`
3. `PA-4771`
4. `PA-4778`
5. `PA-4800`
6. `PA-4804T`
7. `PA-4807`
8. `PA-4808`
9. `PA-4812`
10. `PA-4816`
11. `PA-4817`
12. `PA-4819`
13. `PA-4835`

严格排他过滤（排除 TDS），摄入各型号 MSDS 源文件（遇到 `.doc` 自动无损转换为 `.docx`），依托统一受控通用流水线 `run_universal_msds_pipeline.mjs`，执行 12 阶标准作业规程，输出广州冠志与英德国彩双主体 × 中英双语的 8 格式标准交付物矩阵（每个型号 4 DOCX + 4 PDF，总计 $13 \times 8 = 104$ 份交付物），并持久化存放于目标目录 `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/<ModelCode>/`，各型号均需 100% 通过集中式中央主审计与双极双层法医审计。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM Injection)

| 需求编号 | 需求描述 | 拟定资产与交付指标 | 验证命令与准出条件 |
| :--- | :--- | :--- | :--- |
| **REQ-01** | 全量型号源目录扫描与排他性锁定 | 扫描 `2-2 水性羟基丙烯酸乳液 PA RA`，锁定 13 个型号合法 MSDS 源文件，排除 13 份 TDS | 13 个型号源文件 100% 物理检出且字节数 > 0 |
| **REQ-02** | 13 个型号批量 8 格式受控流水线覆写 | 依托统一流水线 `run_universal_msds_pipeline.mjs`，落实六大排版几何硬指标（INV-ZERO-EXOGENOUS、INV-S2-TYPOGRAPHY-HIERARCHY 等），每个型号生成 4 DOCX + 4 PDF | 13 个型号集中式主审计退出码全部为 0，缺陷数恒为 0 |
| **REQ-03** | 产出物精确分发归档至对应型号目录 | 将 104 份交付物精确归档至 `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/<ModelCode>/` | 13 个型号子目录各 8 份文件物理存在，单文件 > 20KB |

---

## 三、 法定双清单自证 (Dual-List Certification)

### 1. 拟变范围清单 (Proposed Scope of Change)
| 变动文件 / 产出物路径 | 因果角色 (Causal Role) | 变动说明 |
| :--- | :--- | :--- |
| `openspec/changes/2026-11-16-pa-batch-02-2-hydroxy-acrylic-emulsion-production/*` | `[Specification Legislation]` | OpenSpec 增量规格四大法定资产 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4000/*` (8 格式) | `[Deliverable - PA-4000]` | PA-4000 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4006/*` (8 格式) | `[Deliverable - PA-4006]` | PA-4006 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4771/*` (8 格式) | `[Deliverable - PA-4771]` | PA-4771 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4778/*` (8 格式) | `[Deliverable - PA-4778]` | PA-4778 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4800/*` (8 格式) | `[Deliverable - PA-4800]` | PA-4800 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4804T/*` (8 格式) | `[Deliverable - PA-4804T]` | PA-4804T 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4807/*` (8 格式) | `[Deliverable - PA-4807]` | PA-4807 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4808/*` (8 格式) | `[Deliverable - PA-4808]` | PA-4808 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4812/*` (8 格式) | `[Deliverable - PA-4812]` | PA-4812 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4816/*` (8 格式) | `[Deliverable - PA-4816]` | PA-4816 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4817/*` (8 格式) | `[Deliverable - PA-4817]` | PA-4817 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4819/*` (8 格式) | `[Deliverable - PA-4819]` | PA-4819 4 DOCX + 4 PDF 标准交付矩阵 |
| `算法训练材料/TDS MSDS 重写版/02-2 水性羟基丙烯酸乳液 PA/PA-4835/*` (8 格式) | `[Deliverable - PA-4835]` | PA-4835 4 DOCX + 4 PDF 标准交付矩阵 |

### 2. 保持现状承诺清单 (Invariant Scope of Preservation)
| 受控模块 / 承重墙路径 | 保护原因与封印级别 |
| :--- | :--- |
| `web/src/`（核心引擎代码） | 系统核心目录绝对只读公理 (`INV-SYSTEM-READONLY`)，严禁篡改底层代码 |
| `web/templates/`（官方母版） | 官方母版拓扑与边框样式基座，物理只读 |
| `web/scripts/`（核心审计与导出脚本） | 法医级审计与验证工具链，严禁为特判而修改测试或审计逻辑 |
| `算法训练材料/源文件材料/`（全部原始源文件） | 原始事实指纹源头，严禁篡改任何源文档 |
