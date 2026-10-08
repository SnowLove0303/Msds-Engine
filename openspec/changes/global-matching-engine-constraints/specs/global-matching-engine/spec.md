# Spec Delta

## Purpose

The global matching engine defines the pure, section-agnostic matching protocol and underlying core runtime, providing unified fact decomposition, slot binding without positional inference, value sanitation, missing vs substantive negative differentiation, an action code state machine, and atomic template engine handoff.

## ADDED Requirements

### Requirement: Run-Level Role and Colon Fact Decomposition
The system SHALL decompose raw source paragraphs and cells into candidate label-value pairs by analyzing bold/regular run styles and inline colons, while sanitizing prefix noise.

#### Scenario: Decomposition of inline colons and run styles
- **WHEN** raw source text contains a bold label run followed by a regular value run, or an inline label ending with a colon
- **THEN** the system splits the entity into candidate label and value without corrupting chemical ratios or time expressions

#### Scenario: Sanitization of numbering prefixes
- **WHEN** source labels contain arbitrary numbering prefixes like `1.1`, `9.3`, `（1）`, or `v1.`
- **THEN** the system strips the numbering prefix during semantic comparison while retaining the original text locator in metadata

#### Scenario: Bold run role disambiguation by length and parent context
- **WHEN** a bold text run appears after an existing label in the same line, or exceeds 10 characters (excluding Section header titles)
- **THEN** the system treats the bold text as a value instead of a label, preserving it as normal content value

### Requirement: Canonical Slot Binding Without Positional Inference
The system SHALL bind candidate entities to registered standard slot IDs based strictly on normalized semantic alias matching, explicitly rejecting any row-positional inference (OW-029).

#### Scenario: Rejection of row positional inference
- **WHEN** an extracted source record contains rows in non-standard physical order
- **THEN** the system resolves target slots strictly by alias semantics and rejects mapping based on row index numbers

#### Scenario: Exclusivity and conflict detection
- **WHEN** multiple source facts target the same slot ID with conflicting substantive values
- **THEN** the system marks the item as `REVIEW_AMBIGUOUS` and prevents silent value overwrite

### Requirement: Value Sanitation and Typographic Fidelity
The system SHALL clean invisible control characters and extraneous whitespace while preserving meaningful soft line breaks and chemical/measurement symbols.

#### Scenario: Cleaning whitespace and preserving soft breaks
- **WHEN** raw extracted text contains zero-width spaces (`\u200b`), BOM (`\ufeff`), or carriage returns
- **THEN** the system purges control characters and standardizes line breaks to single `\n` within value cells

#### Scenario: Distinction between list slashes and native compound phrases
- **WHEN** source values contain list slashes ` / ` vs native tight compounds like `通风/排气` or `有/无`
- **THEN** the system splits list slashes into multiline items while preserving native compound phrases intact

### Requirement: Missing Detection and Negative Finding Protection
The system SHALL differentiate true missing placeholder expressions from substantive negative technical findings, strictly protecting substantive negative conclusions from pruning.

#### Scenario: Detection of true missing placeholders
- **WHEN** an extracted value matches placeholder expressions like `无数据`, `未测定`, `—`, or `No data available`
- **THEN** the system flags the item as missing and routes it for authorized pruning or standard placeholder retention

#### Scenario: Protection of substantive negative conclusions
- **WHEN** an extracted value contains a negative finding such as `不适用`, `非危险品`, `无危险反应`, `初沸点以下无闪点`, or `无刺激`
- **THEN** the system classifies the item as `MATCHED` and strictly forbids treating it as a pruned item

### Requirement: Standard Action Code State Machine
The system SHALL assign exactly one action code (`MATCHED`, `PRUNED`, `EMPTY`, `NOT_APPLICABLE`, `UNMATCHED`, `REVIEW_AMBIGUOUS`) to each processed fact.

#### Scenario: Execution of state machine assignment
- **WHEN** the matching engine evaluates an extracted source fact against target slots
- **THEN** the system outputs a structured payload with a single authoritative action code and disposition reason

### Requirement: Atomic Engine Handoff and Renumbering
The system SHALL hand off matching results to the template engine by writing 12pt non-bold values, safely deleting pruned rows from bottom to top, and automatically triggering continuous renumbering.

#### Scenario: Safe bottom-up deletion and renumbering
- **WHEN** a matching payload containing `PRUNED` items is applied to a cloned template engine
- **THEN** the system deletes pruned rows in descending order to avoid index drift and renumbers the remaining rows consecutively
