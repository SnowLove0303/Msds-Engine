# Spec: 全量底层通用性修复与防复发门禁

## ADDED Requirements

### Requirement: RTM-01 Section 11 通用双范式分类（单物质 2 列分列 vs 多物质通栏）
`context-governor.js` and `topology-matcher.js` **SHALL** parse Section 11 toxicological endpoints semantically by counting distinct substances per test condition:
- **WHEN** a test condition / endpoint involves at most 1 substance (general case, e.g., `HPU-7651` where all 16 endpoints refer only to `聚氨酯分散体`), it **SHALL** be emitted as a **2-column KV row** (`label = endpoint`, `value = substance + details`);
- **WHEN** the same test condition involves 2 or more distinct substances, that block **SHALL** use full-width (`1_COL_MERGED`) with structured bold component headers and paragraph spacing.

### Requirement: RTM-02 & RTM-07 官方 PDF 通道与机械审计防复发门禁
All PDF deliverables **SHALL** be produced via `web/src/pdf-converter.js` (`Windows COM / WPS/Word`). `staged-mechanical-audit.js` **SHALL** enforce:
1. `P6_PDF_NO_LIBREOFFICE`: PDF metadata `Producer` **SHALL NOT** contain `LibreOffice`;
2. `P5_S11_DUAL_PARADIGM`: Single-substance Section 11 endpoints **SHALL** be 2-column KV rows;
3. `P5_EN_CHEMICAL_SUBSCRIPT`: When source/CN contains chemical formulas (`CO2`, `H2O`, etc.), EN DOCX **SHALL** contain `w:vertAlign="subscript"` runs;
4. `P5_S2_PRESERVE_LABEL_ELEMENTS`: When source Section 2 contains `2.2 标签要素`, governed CN/EN **SHALL** preserve `2.2 标签要素` / `2.2 Label elements` without fabricating `象形图：无` / `信号词：无`.

### Requirement: RTM-05 局部规范防篡改封印（Section 1 中英文差异 & Section 8.2）
`context-governor.js` **SHALL** wrap the following local specifications in `@ANTIGRAVITY_INVARIANT_LOCK_START` / `@ANTIGRAVITY_INVARIANT_LOCK_END`:
1. Section 1 CN (`1.1 产品名称` + `中文名称` without model suffix) vs EN (`1.1 Product name` merging English name + model);
2. Section 8 canonical order (`8.1 暴露控制 -> 8.2 控制参数`).

### Requirement: RTM-06 识别引擎非危否定句与 EN 视图准确性
`recognition-engine.js` `isNegationCategory` **SHALL** recognize negation phrases including `不属于危害化学品`, `不属于危险`, `Not a hazardous substance` so `facts.ghs.isHazardous` is `false` on non-hazardous products, and `serializeFactsToMarkdown` **SHALL** display English labels/CAS (`Trade secret`) cleanly for English source/output documents.
