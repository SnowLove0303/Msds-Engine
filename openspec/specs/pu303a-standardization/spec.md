# pu303a-standardization Specification

## Purpose
TBD - created by archiving change pu303a-system-mcp-api-standardization. Update Purpose after archive.

## Requirements

### Requirement: Exclusive System Controlled Pipeline Routing
The agent MUST drive the MSDS generation strictly through the MSDS-Engine official API (`POST /api/msds/pipeline/generate-eight`) or the official pipeline engine, and MUST NOT write ad-hoc scripts to directly mutate DOCX/PDF files.

#### Scenario: Agent requests full PU-303A production via system API
- **WHEN** the agent initiates production for model PU-303A
- **THEN** the request is dispatched to `http://127.0.0.1:5174/api/msds/pipeline/generate-eight` and returns HTTP 200 with 8 standard deliverables.

### Requirement: Section 2 Full-Width Single-Cell Topology
The system MUST assemble Section 2 of PU-303A as a full-width single-cell block across two columns (`gridSpan="2"`, width `9795 dxa`), encapsulating acute toxicity, skin corrosion, eye irritation, reproductive toxicity, STOT, and DMAC cutaneous absorption risks.

#### Scenario: Section 2 hazardous fact assembly
- **WHEN** source document contains hazardous classification facts for PU-303A
- **THEN** Section 2 Row 1 is rendered with `gridSpan="2"` and 9795 dxa containing full GHS classification, pictograms, signal words, H/P statements, and DMAC specific hazard statements without multiline distortion.

### Requirement: Standard 8 Deliverables and Original Source Preservation
The system MUST preserve the original input file by creating `*_源文件留存.docx` prior to write-out, and MUST deliver exactly 8 files (4 DOCX + 4 PDF for CN/EN × Guanzhi/Guocai) into `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine\算法训练材料\TDS MSDS 重写版\01-1 单组份水性聚氨酯树脂 PU\PU-303A` without any temporary debris.

#### Scenario: Eight deliverables verified and audited
- **WHEN** production completes
- **THEN** exactly 8 files exist in the target directory, all passing zero Chinese assertion (`assertZeroChinese`) and mechanical deep audit (`audit_bipolar_bilayer.mjs`).
