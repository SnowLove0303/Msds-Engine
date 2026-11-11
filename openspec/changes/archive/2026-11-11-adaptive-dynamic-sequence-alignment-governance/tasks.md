# Tasks: 自适应动态序号对齐几何拓扑实施计划

- [x] 1. 编辑器底层原语解耦与动态位数感知重构 <!-- id: 1 -->
  - 在 `web/src/universal-editor-primitives.js` 中移除 `|| (sectionNumber === 11)` 特判
  - 增强 `c0Text.match(/^(\d+(?:\.\d+)+)/)` 动态萃取算法
  - 保证仅当 `maxSeqDigitCount >= 4` 时启用 560 dxa，否则恒定启用 420 dxa
  - 验证命令: `node -e "import('./web/src/universal-editor-primitives.js')"`

- [x] 2. docx-engine 原语与 Section 11 解耦 <!-- id: 2 -->
  - 在 `web/src/docx-engine.js` 的 `formatSection11LabelCell` 中将硬编码 560 改为基于 `numberStr` 的动态感知 (`digitsOnly.length >= 4 ? '560' : '420'`)
  - 适配 `formatSection11ToxicologyRow` 动态传递标尺
  - 验证命令: `node -e "import('./web/src/docx-engine.js')"`

- [x] 3. pipeline-engine 辅助格式化解耦 <!-- id: 3 -->
  - 在 `web/src/pipeline-engine.js` 的 `formatEnglishLabelCell` 中移除 `if (sectionNumber === 11) indent = '560'`
  - 统一按表格实际最大位数动态计算
  - 验证命令: `node -e "import('./web/src/pipeline-engine.js')"`

- [x] 4. OS-8970 全量 8 产出物重新生成与端到端实测核销 <!-- id: 4 -->
  - 执行 `node web/scripts/generate_os8970_deliverables.mjs`
  - 运行 `run_master_msds_audit.mjs` (150+ 主审计) 验证退出码 0
  - 运行 `audit_bipolar_bilayer.mjs` 验证退出码 0
  - 运行 `check_pdf_s9_alignment.py` 验证垂直对齐
  - 提取 Section 11 DOCX 真实 XML 验证 `w:left="420"` 与 `w:hanging="420"`
  - 同步更新至用户目录 `E:\冠志\TDS MSDS (2)\待处理文件\OS-8970\`
