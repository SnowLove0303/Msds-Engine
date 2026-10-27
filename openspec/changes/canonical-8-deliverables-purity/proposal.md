# Change Proposal: 交付目录绝对纯净门禁与 8 格式精准交付 (Canonical 8-Deliverables Purity)

## 1. 业务动机与背景
当前流水线在输出目标交付目录（如 `算法训练材料/PA-3223/`）时，因三处过度防护与未闭环逻辑，导致交付目录产生 16~24 个非预期垃圾文件（含 `_源文件留存.*`、`(最新).*`、`(更新).*` 等碎片），严重背离“只交付 8 个不同格式的正确文件”的核心业务法定诉求。

## 2. 核心目标
1. **源文件留存物理隔离**：源文件备份绝不直接倾倒在客户交付物目录中，通过内存流转或内部专有备份目录隔离。
2. **剔除交付物递归备份**：删除 `batchExportDeliverables` 内部对 4 DOCX + 4 PDF 导出的冗余 `preserveOriginalFileBackup` 调用。
3. **文件锁降级碎片彻底清退**：在 `safeWriteFileWithLockGuard` 成功写入标准文件名后，主动 `unlink` 物理清理任何历史遗留的 `(最新)`、`(更新)`、`(临时更新)` 碎片。
4. **交付目录绝对纯净门禁 (Canonical 8-Deliverable Purity Gate)**：
   - 流水线最后增加清场保障：清除任何非 8 格式文件。
   - 深度审计（Gate 12 / G-01）强制断言：物理文件总数严格等于 8，且文件名逐一完全精确匹配，禁止任何前缀后缀妥协，非 8 文件一票否决熔断。

## 3. 受影响文件范围
- `web/src/pipeline-engine.js`
- `web/scripts/generate_pa3223_deliverables.mjs`
- `web/scripts/audit_bipolar_bilayer.mjs`
