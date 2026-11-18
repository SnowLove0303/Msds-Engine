# Tasks: MSDS Recognition Precision Enhancement (enhance-msds-recognition-precision)

- [x] 1. 实现章节标题容差前缀匹配与清洗 (`recognition-engine.js`) <!-- id: 1 -->
  - 更新 `detectSectionHeaderInRow`，支持 `v1.`/`V1.` 容差正则；
  - 自动清洗前缀杂质，使 `v1.物料及供应商标识` 规范化为 `1.物料及供应商标识` 并归类为 `章节标题`；
  - 验证命令: `node -e "import('./web/src/recognition-engine.js').then(m => console.log('Task 1 ready'))"`

- [x] 2. 实现 Section 2 复合单元格多行多层级穿透拆解 (`recognition-engine.js`) <!-- id: 2 -->
  - 将 Section 2 的单大单元格穿透解构为：一级子题头（“物质或混合物分类”）、二级标签/值（“GHS分类：”与“GHS象形图：”）；
  - 验证命令: `node -e "import('./web/src/recognition-engine.js').then(m => console.log('Task 2 ready'))"`

- [x] 3. 增强续行长句说明与前置引导语判定算法 (`recognition-engine.js`) <!-- id: 3 -->
  - 纠偏 Section 5 行 4（“在着火或爆炸情况下，不要吸进烟尘。”）为 `说明行`；
  - 纠偏 Section 11 行 2（“类似产品的风险评估数据：”）与 Section 15 引导语为 `说明行`；
  - 验证命令: `node -e "import('./web/src/recognition-engine.js').then(m => console.log('Task 3 ready'))"`

- [x] 4. 全量运行统一 CLI 重新生成 PA-3612 Context 1 并出具 1:1 批注核销清算表 <!-- id: 4 -->
  - 运行 `node web/scripts/run_source_recognition.mjs --source="..."`；
  - 逐项核对用户的 4 处手写批注，确保 100% 纠偏吻合；
  - 验证命令: `node "web/scripts/run_source_recognition.mjs" --source="web/scratch/pa_doc_converted/PA-3612 msds_CN 冠志.docx" --output="output/PA-3612"`
