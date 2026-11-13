# Spec: Dynamic Template Topology Engine

## ADDED Requirements

### Requirement: REQ-TOPO-02 Decoupled Template Topology Recognizer
The system SHALL provide a dedicated Template Topology Recognizer that parses any DOCX template file into an abstract geometric and semantic topology blueprint without hardcoded assumptions about rows, columns, or fixed slot positions.

#### Scenario: Dynamic extraction of template topology from arbitrary DOCX template
- **WHEN** a DOCX template file path or buffer is supplied to the Template Topology Recognizer;
- **THEN** it SHALL inspect the document tables, rows, cells, and headers, and return a structured blueprint declaring:
  1. Header and footer slot positions and properties;
  2. 16 section table identifiers, total row count, column count, and cell widths;
  3. Cell semantic roles (Section Header, Parent Label, Child Label, Editable Value, Table Header, Multi-Column Data Row, Note/Explanation);
  4. Cell layout type (`FULL_WIDTH`, `TWO_COLUMN`, `MULTI_COLUMN`).

### Requirement: REQ-TOPO-03 Topology-Driven Matching and Adaptive Overwrite
The Matching Engine SHALL ingest the dynamically parsed Template Topology Blueprint and map chemical facts into the recognized template slots, dynamically adapting output topology when the template is swapped.

#### Scenario: Dynamic adaptation when template is replaced
- **WHEN** a different template with alternative layout geometry or modified columns is provided;
- **THEN** the system SHALL re-parse the template topology and produce matching slot structures that conform 100% to the newly supplied template's physical geometry without manual source code adjustments.
