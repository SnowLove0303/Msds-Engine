# Specification: PU-218A TDS 与 MSDS 标准化生产规范

## 1. RFC 2119 规范声明

### 1.1 TDS 生产规格 (TDS Standardizer)
- The TDS Subagent SHALL read input from `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A tds_CN 冠志.docx`.
- The TDS Subagent SHALL generate exactly four DOCX variants: `PU-218A tds_CN 冠志.docx`, `PU-218A tds_CN 国彩.docx`, `PU-218A tds_EN Guanzhi.docx`, `PU-218A tds_EN Guocai.docx`.
- The TDS Subagent SHALL convert all four DOCX variants into corresponding PDF deliverables using official word2pdf converter.
- Extraneous headings and unmapped bracket headers SHALL NOT be present in output.

### 1.2 MSDS 生产规格 (MSDS Standardizer)
- The MSDS Subagent SHALL read input from `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx`.
- The MSDS Subagent SHALL clear active templates before injecting new facts to prevent residual contamination.
- In Section 2, pictograms SHALL be left-aligned (`jc="left"`), section labels SHALL retain numerical indices, and spacing between label blocks SHALL be preserved.
- In Section 9, values SHALL be left-aligned and the first character SHALL align vertically at $X_0 = 80.28\text{ pt}$ in rendered PDF.
- In Section 11, the reproductive toxicity block (or equivalent toxicological summary) SHALL use a 3-column vertical merge structure.
- The MSDS Subagent SHALL generate exactly four DOCX variants and four corresponding PDF deliverables.

### 1.3 交付物与隔离规格 (Deliverable Purity & Isolation)
- All 16 deliverable files SHALL be written to `F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-218A`.
- The deliverables SHALL NOT be tracked or added to Git repository.
