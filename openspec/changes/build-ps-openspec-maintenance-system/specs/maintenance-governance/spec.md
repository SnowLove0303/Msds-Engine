# Specification: Maintenance Governance & Anti-Recurrence

## Requirements

### REQ-MNT-01: Single-Module Root-Cause Routing
Any defect investigation or maintenance task SHALL first classify the symptom against the Symptom-to-Module Routing Matrix in `MAINTENANCE_GUIDE.md` and locate the single authoritative owner module. An Agent SHALL NOT patch upper-layer post-processing locks to mask defects originating in recognition, semantic governance, or underlying OOXML primitives.

### REQ-MNT-02: Role-Driven Single Typography Source
All styling rules (font family, font size, bold weight, vertical alignment, and hierarchical indentation) SHALL be maintained strictly by semantic role (`SECTION_HEADER`, `SEQ_LABEL`, `SUB_LABEL`, `EXPLANATION`, `VALUE`, `HEADER/FOOTER`) inside the underlying OOXML/typography layers (`docx-engine.js`, `template-editor.js`, `topology-matcher.js`). Identical roles SHALL NOT produce divergent styling across different code paths.

### REQ-MNT-03: Anti-Recurrence & Anti-Overwrite Lock
Whenever a general defect is fixed, the maintainer SHALL sink a deterministic verification rule into `staged-mechanical-audit.js` or `lint_code_invariants.mjs` and preserve or add `@ANTIGRAVITY_INVARIANT_LOCK_START` / `@ANTIGRAVITY_INVARIANT_LOCK_END` around critical invariant blocks. Static lint (`lint_code_invariants.mjs`) SHALL enforce pairing integrity of all invariant locks (`LINT-LOCK-01`).

### REQ-MNT-04: Explicit Modification Tagging & Ledger
Every source-code logic fix SHALL include an explicit `@FIX_TAG(YYYY-MM-DD/<module>/<FIX-ID>): <root-cause summary>` annotation at the modified site and record the corresponding root cause and resolution in `CHANGELOG.md`.
