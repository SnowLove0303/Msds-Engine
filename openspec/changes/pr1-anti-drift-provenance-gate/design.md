# Design: PR-1 入口收敛与执行血缘门禁

## 1. 执行血缘凭证数据结构 (`.run_manifest.json`)
存放于产出目录 `<targetDir>/.run_manifest.json`：
```json
{
  "schemaVersion": "1.0.0",
  "runId": "run_...",
  "entrypoint": "run_standard_production.mjs",
  "modelCode": "PA-3655",
  "sourcePath": "...",
  "sourceSha256": "...",
  "phases": {
    "PHASE_1_CONTEXT1": { "sha256": "...", "recordedAt": "..." },
    "PHASE_2_CONTEXT2": { "sha256": "...", "recordedAt": "..." },
    "PHASE_5_EXPORT": { "sha256": "...", "recordedAt": "..." }
  },
  "deliverables": {
    "PA-3655 msds_CN 冠志.docx": { "sha256": "...", "size": 12345, "recordedAt": "..." }
  }
}
```

## 2. 血缘校验与防偷跑门禁 (`auditPhase0Provenance`)
- **P0_PROVENANCE_CHAIN**:
  - 校验 `.run_manifest.json` 存在且可解析；
  - 校验 `entrypoint` 属于受控白名单（`run_standard_production.mjs` | `msds_mcp_gateway.mjs`）；
  - 校验 `PHASE_1_CONTEXT1`、`PHASE_2_CONTEXT2`、`PHASE_5_EXPORT` 阶段指纹完整；
  - 校验 `targetDir` 下所有 `.docx`/`.pdf` 交付物文件与 `deliverables` 中记录的 SHA-256 100% 一致。
- **P0_NO_ADHOC_SCRIPTS**:
  - 扫描 `targetDir` 根目录，禁止存在未注册的临时 `.mjs`/`.js`/`.py`/`.ps1`/`.sh` 脚本。
