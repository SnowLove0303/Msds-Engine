# Proposal: MSDS CAS 正确性全景核查纳入审计范围

## Why
在化工安全技术说明书（MSDS / SDS）生产中，Section 3 组分表与 Section 2.2 标签有害成分中的 CAS 注册号（Chemical Abstracts Service Registry Number）是法律责任与化学品唯一性鉴定的核心凭证。
此前审计套件主要覆盖了表格行数、排版几何、字体字阶、双语行数同构与通用文本匹配，尚未将 CAS 编号的国际数学标准校验（加权模 10 校验和）、源文件 1:1 事实物理对账、CAS 与中英文化学品名称语义一致性、以及 Section 2 至 Section 3 的跨章节穿透核查固化为机械硬门禁。
为彻底杜绝笔误、数字篡改、张冠李戴以及外生凭空捏造等严重安全隐患，必须将 CAS 的全景正确性核查正式纳入中央主审计套件与全自动流水线。

## What Changes
1. **新增纯函数模块 `web/src/cas-validator.js`**：
   - 实现符合 IUPAC / CAS 国际注册规范的标准格式校验与加权模 10 校验和算法；
   - 支持商业机密（保密 / Trade secret / Proprietary 等）合法豁免断言；
   - 内置核心通用化学品与溶剂双向语义对账映射库（`CAS ⟷ 中文名 ⟷ 英文名`）。
2. **在集中式中央主审计套件 `web/scripts/run_master_msds_audit.mjs` 中增设 4 项专属 CAS 硬门禁**：
   - 环 3: `Section 3 CAS 格式与加权模 10 校验和合规硬门禁 (INV-CAS-CHECKSUM)`
   - 环 3: `Section 3 组分 CAS 编号源文件 1:1 物理对账硬门禁 (INV-CAS-SOURCE-FIDELITY)`
   - 环 3: `Section 3 CAS 编号与化学品名称实体一致性硬门禁 (INV-CAS-NAME-COHERENCE)`
   - 环 3: `Section 2 标签有害成分与 Section 3 组分 CAS 穿透核销硬门禁 (INV-CAS-S2-CROSS-CHECK)`
3. **在双极双层全景深度审计套件 `web/scripts/audit_bipolar_bilayer.mjs` 中同步注入 CAS 验证**。
4. **与 `run_universal_msds_pipeline.mjs` 全自动流水线无缝集成**，CAS 校验不合格直接返回真实退出码 1 熔断发布。

## 1:1 需求物理对账矩阵 (RTM) 映射
- **REQ-CAS-01** ⟷ `SPEC-CAS-01: CAS 格式与加权模 10 校验和数学验证`
- **REQ-CAS-02** ⟷ `SPEC-CAS-02: 源文件与交付物 CAS 事实 1:1 物理对账`
- **REQ-CAS-03** ⟷ `SPEC-CAS-03: CAS 编号与中英文化学品名称语义一致性核查`
- **REQ-CAS-04** ⟷ `SPEC-CAS-04: Section 2 标签有害成分与 Section 3 组分 CAS 跨章节穿透核销`
- **REQ-CAS-05** ⟷ `SPEC-CAS-05: 集中式中央主审计套件与流水线自动化门禁集成`
