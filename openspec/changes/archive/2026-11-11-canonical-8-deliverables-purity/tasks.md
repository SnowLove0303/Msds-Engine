# Tasks: 交付目录绝对纯净门禁实施与验证

- [x] Task 1: 改造 `web/src/pipeline-engine.js` 中的文件锁管理与冗余留存逻辑 <!-- id: 1 -->
  - [x] 1.1 改造 `safeWriteFileWithLockGuard`：写入主文件成功后，主动 `fs.unlink` 删除匹配的 `(最新)`、`(更新)`、`(临时更新)` 等碎片文件
  - [x] 1.2 移除 `batchExportDeliverables` 内部对输出文件 `docxPath` 与 `finalPdfPath` 的 `preserveOriginalFileBackup`
  - [x] 1.3 在 `batchExportDeliverables` 结尾增加目录自动清场机制，清理交付目录内的非 8 格式历史碎片
- [x] Task 2: 改造 `web/scripts/generate_pa3223_deliverables.mjs` <!-- id: 2 -->
  - [x] 2.1 移除在 `targetDir` 中显式落盘 `PA-3223 msds_CN 冠志_源文件留存.docx` 的逻辑，采用内存 buffer 安全传递
- [x] Task 3: 改造 `web/scripts/audit_bipolar_bilayer.mjs` G-01 门禁 <!-- id: 3 -->
  - [x] 3.1 G-01 严格断言物理文件总数恒等于 8，且完全精确匹配法定 8 格式名称
  - [x] 3.2 移除对 `(最新)`、`(更新)` 降级文件名的兼容容忍逻辑
- [x] Task 4: 清理交付目录并重新全量运行流水线 <!-- id: 4 -->
  - [x] 4.1 清理 `算法训练材料/PA-3223/` 目录中的历史碎片
  - [x] 4.2 重新生成 8 格式标准文件
  - [x] 4.3 运行双极双层深度审计，验证 Exit Code 0，确认有且仅有 8 个完全合规文件
- [x] Task 5: 经验永续与知识库沉淀 <!-- id: 5 -->
  - [x] 5.1 更新 CHANGELOG.md 与 pstack 经验库
  - [x] 5.2 Git atomic commit 归档
