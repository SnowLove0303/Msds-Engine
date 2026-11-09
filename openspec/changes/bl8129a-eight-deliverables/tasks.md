# Tasks: BL-8129A Eight-Deliverable Production

## PStack selected playbook copied verbatim

# Figure it out

When the task matches no playbook, design one. The deliverable before any code is the workflow itself: a sequence of phases that scales rigor to the task, runs the scientific method, and leaves a decision trail a human can audit after stepping away.

## Start

Open a todolist whose first item is to read the Principles section of the **poteto-mode** skill. Then add the phases below as todos.

## Phase A: Frame

Ground first, then commit. Don't start the run until you can state:

- The definition of done as a falsifiable predicate (the **prove-it-works** principle skill).
- Scope, quantified: rough units and effort, plus the blockers grounding surfaced.
- The rigor level, biased high. One-way doors and high blast radius get more. Reversible low-stakes steps get less. Rigor is gates and artifacts, not "try harder".

Present the framing and tradeoffs before committing to a long run. Reversible work proceeds (the **never-block-on-the-human** principle skill), but a multi-hour run earns one checkpoint.

## Phase B: Design the workflow

Decompose into atomic, independently-landable units. Sequence riskiest-unknown-first. Scaffold and verification come before features (the **foundational-thinking** principle skill).

- Build the verification harness before the work, with the baseline captured from the pre-change state, so the check reads as "old value vs new value".
- For one-way-door design decisions, run the **architect** skill (it runs **arena**). Skip it for mechanical work whose shape is already concrete. A second arena over a settled design is over-engineering (the **laziness-protocol** principle skill).
- Decide what fans out. Parallelize only across seams, and give each worker its own worktree or branch (the **separate-before-serializing-shared-state** principle skill). Don't over-fan. Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section of the **poteto-mode** skill.
- Write the designed phase list down. That list is what the human reviews.

Then execute the design. Add its steps to the todolist as concrete items between the Phase C and Phase D entries. Run each under the Phase C loop discipline, and weave the Phase D log through them, a row as each step lands, rather than saving the whole trail for the end.

## Phase C: Run the loop

Each unit is an experiment. State the hypothesis, make the smallest change, measure against the predicate on the real artifact, keep it if it advanced, revert it if it didn't. Apply the **sequence-verifiable-units** principle skill, verifying each unit before starting the next instead of batching checks at the end.

- Verify by inspecting the artifact, never a self-report. When something passes too easily, suspect the observation method before the system.
- Pair delegated work with a judge. If a worker games the gate, reset and harden the contract. If the gate itself is wrong, fix the gate in its own change rather than routing around it.
- A verdict is VERIFIED, NOT VERIFIED, or INCONCLUSIVE. Inconclusive is not a pass. Don't hide a negative.

## Phase D: Keep the audit trail

Log the run via the **show-me-your-work** skill. figure-it-out's work is usually ambitious enough to commit the trail so the reviewer can read it in the PR. The trail plus the diff is what lets the human come back and trust the work.

## Phase E: Verify and hand back

Check the whole against the Phase A predicate on the real product, not just the harness. Encode any recurring correction as a gate, a lint rule, a check, or a script (the **encode-lessons-in-structure** principle skill).

**Reply:** the playbook you designed, the rigor level and why, the decision-trail path, what's verified against the predicate, and what's still open.


## 1. Frame and preflight

- [x] 1.1 Route through poteto-mode, select Figure it out, and read its playbook and applicable principles. Evidence: global PStack files read at C:/Users/Administrator/.codex/pstack-upstream/skills/.
- [x] 1.2 Verify OpenSpec context from the named MSDS-Engine root. Evidence: openspec context --json returned F:/App Location/Guanzhi Tong/Skill/MSDS-Engine.
- [x] 1.3 Capture branch and base. Evidence: main, 5c304c3a986d7758c34a8c4665a7bd17d630f83d.
- [x] 1.4 Recognize the source through official MCP and confirm the target folder is empty. Evidence: modelCode BL-8129A, 16 sections, target listing [].
- [x] 1.5 Confirm the four template identities and output names through MCP. Evidence: CN_Guanzhi, CN_Guocai, EN_Guanzhi, EN_Guocai; all 8 exact names are in design.md.
- [x] 1.5a Peek critical template rows in Sections 2, 3, 8, 9, and 11 for CN/EN Guanzhi. Evidence: gateway MCP peeks; source file templates include sample values, and batch builders call cleanSlateTemplate before writing.
- [x] 1.6 Plan the audit contract and check its behavior. Evidence: planAuditTargets shows a default Danger word and mandatory oral/inhalation/dermal fields; verifyAuditContract does not enforce those fields.
- [x] 1.6a Confirm the approved integrated editor/export route. Evidence: msds_batch_export_eight calls executeEightDeliverablesPipeline; isolated msds_execute_editor_ops saves a separate work-session output that the batch call does not consume.
- [x] 1.7 Obtain the project's second gate: user explicitly replied “执行” after reviewing the translation preview, templates, MCP payload, and audit approach. Approval is recorded in proposal.md.

## 2. Generate through the official MSDS pipeline

- [x] 2.1 Confirm original DOCX/PDF hashes still match the preflight baseline and allow the pipeline to create preservation copies beside the source. Evidence: SHA-256 values still match proposal.md immediately before export; target directory remains empty.
- [x] 2.2 Call msds_batch_export_eight via web/scripts/msds_mcp_gateway.mjs with modelCode BL-8129A, the specified sourceFilePath, and the specified targetDir. Record the real process exit code and raw result. Evidence: two official MCP runs produced the eight files; both returned exit 1 at Gate 12.
- [x] 2.3 Verify the target directory contains exactly the eight listed files and no extra files. Record names, sizes, and hashes. Evidence: exactly eight named DOCX/PDF files, sizes and SHA-256 values captured in the run transcript; no extra files.
- [x] 2.4 Confirm the source DOCX and PDF hashes are unchanged and verify their preservation copies exist outside the target directory. Evidence: source hashes still match proposal.md; DOCX/PDF preservation copies exist beside source and their hashes match the originals.

## 3. Verify facts and layout

- [x] 3.1 Call msds_compare_source_with_output against the Chinese Guanzhi output and each other DOCX variant. Record all actionable gaps; pass requires zero gaps or documented hard failure. Evidence: all four calls ran; each reports one Section 3 COMPONENT_COUNT_MISMATCH caused by physical row-count comparison although all four ingredients and values are present. This remains a validator defect.
- [x] 3.2 Run msds_audit_deliverables and the project's audit_bipolar_bilayer.mjs against the target directory. Record raw results and measured exit codes. Evidence: msds_audit_deliverables failed G-41~G-46 at 107/112; bipolar audit failed G-38 and both G-40 Section 2 row-count checks. The direct official G-38 checker measured 9 misaligned rows per CN PDF and 19 per EN PDF.
- [x] 3.3 Inspect the real DOCX and PDF outputs for 16-section fidelity, four separate Section 3 ingredients, source-only GHS and toxicology facts, Section 14 storage limits, Guanzhi/Guocai identity, English text purity, PDF content, and layout. The MSDS-Engine production AGENT requires an adversarial self-audit. Evidence: output recognition, source comparisons, PDF text extraction, company headers, and bilingual audit identified the deficiencies documented in design.md.
- [ ] 3.4 Mark complete only when the exact 8-file matrix exists and required source comparisons and audits pass. If any hard gate fails, leave the task incomplete and report the blocker with evidence.

## Scope and protected paths

- Writable: this OpenSpec change directory; the requested target directory for the eight named files; the source directory only for the official pipeline preservation copies.
- Read-only: original source DOCX and paired PDF; web/src/, web/public/templates/, web/scripts/, all other existing project files and unrelated untracked paths.
- Protected invariants: INV-MCP-EXCLUSIVE-GATEWAY; INV-SAFE-HALT-AND-ESCALATION; G-01 exact eight-file purity; G-11 label/value font separation; zero-hallucination source-fact rules.
- Prior verified work: MCP recognition of BL-8129A succeeded; four schema identities resolved; target folder was empty; source DOCX/PDF hashes are recorded in proposal.md.
- Non-goals: no engine/template/audit code modifications, no TDS edits, no deletion of prior files, no invented GHS or toxicology content.
- Acceptance evidence: raw MCP call results and exit codes; exact target file listing; before/after source hashes; source/output compare reports; mechanical and adversarial audit evidence.

## Gate outcome

- [x] 3.3a Record the source-fact and geometry findings in design.md. Evidence: MCP recognition, four source/output comparisons, official bilingual audit (107/112), official bipolar audit (three failures), direct PDF alignment script (9 CN and 19 EN failures), and output artifact hashes.
3.4 remains open. The target contains exactly eight generated files, but hard audits fail for Section 1.1, Section 2 row count, Section 8 parent/title translation, Section 9 alignment, and the source/output comparator’s component-row check. No system code or output file has been edited after the failing audits.

## 4. Respond to the latest directive

- [x] 4.1 Leave shared engine and audit files unchanged. Record the editor-workflow deviation and all measured product/audit issues in the user-facing report at C:/Users/Administrator/Documents/Codex/2026-11-09/f-app-location-guanzhi-tong-skill/outputs/BL-8129A_MSDS_生产问题报告.md. Evidence: report exists and includes output hashes, failures, root causes, source-preservation hashes, and official regulatory references.
- [x] 4.2 Re-execute through msds_execute_editor_ops with official CN/EN Guanzhi templates and Guocai presets, then convert those editor DOCX files through the official local PDF converter. Evidence: exact eight-file matrix and sizes are listed in outputs/BL-8129A_MSDS_生产问题报告.md; msds_audit_deliverables passed 112/112.
- [x] 4.3 Record remaining compare and bipolar audit failures without changing shared engine, templates, or audit logic. Evidence: report addendum records COMPONENT_COUNT_MISMATCH and G-09, Section 3 formatting, and L-S16 failures.
- [ ] 4.4 Acceptance remains open: required bipolar audit is not clean and compare reports a Section 3 row-count discrepancy; do not mark deliverables accepted.
