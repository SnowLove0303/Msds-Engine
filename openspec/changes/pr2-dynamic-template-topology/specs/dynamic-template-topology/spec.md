# Spec: Dynamic Template Topology

## ADDED Requirements

### Requirement: Dynamic Section Discovery
`recognizeTemplateTopology` SHALL dynamically discover all section tables in a DOCX template without hardcoding a 16-section count, and SHALL expose `layoutType` (`FULL_WIDTH_OUTLINE`, `KV_TWO_COL`, `MULTI_COL_GRID`, `HYBRID`) and `capabilities` per section.

#### Scenario: Custom 5-section DOCX template is recognized accurately
- **WHEN** `recognizeTemplateTopology` parses a valid DOCX containing 5 section tables with mixed `KV_TWO_COL`, `FULL_WIDTH_OUTLINE`, `MULTI_COL_GRID`, and `HYBRID` layouts
- **THEN** it returns `sectionsCount === 5` with accurate `layoutType` and `capabilities` for each discovered section.

### Requirement: Capability-Driven Topology Compilation
`compileTopologyOps` SHALL iterate over the sections present in `templateSchema.sections` (supporting both array and object representations) and dispatch `FULL_WIDTH_OUTLINE` sections by layout capability rather than hardcoding `sectionNumber === 2` or `1..16`.

#### Scenario: Compiling Context 2 against a non-16-section template succeeds
- **WHEN** `compileTopologyOps` runs with a 5-section `templateSchema` and matching `context2`
- **THEN** it compiles operations for all 5 sections (`stats.sectionsMatched === 5`) without throwing `TOPOLOGY_MISMATCH`.
