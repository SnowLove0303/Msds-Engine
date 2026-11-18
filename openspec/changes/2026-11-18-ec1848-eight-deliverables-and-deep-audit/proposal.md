# 提案: EC-1848 标准受控八格式覆写与两阶双轨全要素深度审计

## 一、 背景与变更目标
基于用户指派，将最新的 `MSDS-Studio v9.0-ENTERPRISE`（集成最新页脚对齐、页码字号、国彩预设统一及 Scenario B 批刷新能力）受控体系、标准官方底模与企业预设，应用于目标型号 `EC-1848`（水性环氧固化剂，危险化学品 H412）。针对源文件 `算法训练材料/源文件材料/4-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx`，执行 12 阶标准作业规程，输出广州冠志与英德国彩双主体 × 中英双语的 8 格式标准交付物矩阵（4 DOCX + 4 PDF），并自动创建目标文件夹落盘至 `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848`。

---

## 二、 1:1 需求物理对账矩阵 (Spec-Kit RTM Injection)

| 需求编号 | 需求描述 | 拟定资产与交付指标 | 验证命令与准出条件 |
| :--- | :--- | :--- | :--- |
| **REQ-01** | 流水线工作流资产绑定与底模选用 | 装配 `MSDS_Studio_Agent_Test_Kit` 中的 `正式模板_MSDS_CN_冠志(1).docx`、`正式模板_MSDS_EN_冠志(1).docx` 及 `company_presets.json` | 模板存在性校验与历史示范数据 100% 清零 |
| **REQ-02** | 源文件物理化学事实零损耗提取 (`EC-1848`) | 零损耗摄入 `EC-1848 msds_CN 冠志.docx`，提取 4 组分、20 项理化及 H412 危化品事实，生成 Context 1 并通过反向证伪机械审计 | `audit_context1_mechanical.mjs` 退出码 0，CRITICAL: 0, WARNING: 0 |
| **REQ-03** | 双主体 × 双语标准 8 格式交付矩阵覆写 | 落实六大排版几何硬指标（H412危品状态机、INV-S2-TYPOGRAPHY-HIERARCHY、INV-SEQ-TAB-ALIGN 等），生成 4 DOCX + 4 PDF | 173 项主审计与 165 项双极双层法医审计全部 PASS，退出码 0 |
| **REQ-04** | 产出物持久化归档至指定目录（自动创建型号文件夹） | 自动创建 `04-2 水性环氧固化剂 EC/EC-1848` 文件夹，8 格式文件持久化保存至该目录 | 8 份文件物理存在且字节数 > 20KB |

---

## 三、 法定双清单自证 (Dual-List Certification)

### 1. 拟变范围清单 (Proposed Scope of Change)
| 变动文件 / 产出物路径 | 因果角色 (Causal Role) | 变动说明 |
| :--- | :--- | :--- |
| `openspec/changes/2026-11-18-ec1848-eight-deliverables-and-deep-audit/*` | `[Specification Legislation]` | OpenSpec 增量规格四大法定资产 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/` | `[Directory Creation]` | 自动创建目标型号专属文件夹 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx` | `[Deliverable - CN Guanzhi Docx]` | 广州冠志 中文版 Word 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.pdf` | `[Deliverable - CN Guanzhi Pdf]` | 广州冠志 中文版 高清矢量 PDF 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 国彩.docx` | `[Deliverable - CN Guocai Docx]` | 英德国彩 中文版 Word 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 国彩.pdf` | `[Deliverable - CN Guocai Pdf]` | 英德国彩 中文版 高清矢量 PDF 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx` | `[Deliverable - EN Guanzhi Docx]` | 广州冠志 英文版 Word 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.pdf` | `[Deliverable - EN Guanzhi Pdf]` | 广州冠志 英文版 高清矢量 PDF 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guocai.docx` | `[Deliverable - EN Guocai Docx]` | 英德国彩 英文版 Word 交付物 |
| `算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guocai.pdf` | `[Deliverable - EN Guocai Pdf]` | 英德国彩 英文版 高清矢量 PDF 交付物 |

### 2. 保持现状承诺清单 (Invariant Scope of Preservation)
| 受控模块 / 承重墙路径 | 保护原因与封印级别 |
| :--- | :--- |
| `web/src/`（核心引擎代码） | 系统核心目录绝对只读公理 (`INV-SYSTEM-READONLY`)，严禁篡改底层代码 |
| `web/templates/`（官方母版） | 官方母版拓扑与边框样式基座，物理只读 |
| `web/scripts/`（核心审计与导出脚本） | 法医级审计与验证工具链，严禁为特判而修改测试或审计逻辑 |
| `算法训练材料/源文件材料/`（全部原始源文件） | 原始事实指纹源头，严禁修改任何原始源文件 DOCX/DOC |
