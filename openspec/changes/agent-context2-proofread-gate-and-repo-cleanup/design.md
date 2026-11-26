# Design: Two-Phase Context 2 Gate & Repo Hygiene

```text
  [Source DOCX]
       │
       ▼  (--prepareOnly)
  [Stage 1-3: Context 1 -> Context 2]
       │  outputs: <MODEL>_context2_review.md + <MODEL>_context2_translations.json
       ▼
  [Producer Agent Proofread]  (核对 CN↔EN 译文、补全/修正 JSON)
       │
       ▼  (--approveContext2 --translations=<json>)
  [Stage 4-6: Editor -> DOCX/PDF -> Mechanical Audit]  (无 --approveContext2 硬阻断)
```
