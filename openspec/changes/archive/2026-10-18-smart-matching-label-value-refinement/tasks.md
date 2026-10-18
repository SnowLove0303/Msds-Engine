# Tasks

## 1. Section 2 复合单元格前置解耦与槽位精准分流

- [x] 1.1 在 `web/src/smart-matching.js` 中实现 `decoupleSection2CompoundBlocks(cellText, rowObj)` 函数，按 2.1 分类、2.2 标签要素、GHS-象形图、2.3 其他危险等子条款将聚合单格拆解为独立候选事实，并通过单元测试验证拆解正确性
- [x] 1.2 在 `runSmartMatching` 的 Section 2 提取管道中集成解耦器，使纯净分类结论（2.2）、象形图状态（置空/无象形图）、信号词（无信号词）与其他危险（2.10）分别注入对应标准插槽，消除整段挤压缺陷

## 2. Section 11 结构化毒理长文多端点切片与精准对齐

- [x] 2.1 在 `web/src/smart-matching.js` 中实现 `decoupleSection11ToxicologyBlocks(cellText, rowObj)` 函数，支持将聚合毒理学大段落切分为急性毒性、皮肤刺激、粘膜刺激、致敏性、遗传毒性、STOT、CMR 等独立端点段落
- [x] 2.2 在 `runSmartMatching` 的 Section 11 处理逻辑中集成切片器，对齐注入模板 11.1~11.10 各独立端点插槽，避免由单一致敏性槽位吞噬全部毒理数据

## 3. Section 1 品名型号分流与 Section 16 独占性去重

- [x] 3.1 优化 Section 1 品名与型号识别逻辑，支持从复合名称中分流规格型号（如 `PU-2341E`）并精准注入模板 `model` 插槽，确保 1.1 产品名称与型号互不缺失
- [x] 3.2 优化 Section 16 映射逻辑，对已注入 `disclaimer` 的免责长文本执行排他去重，避免向 `16.1 other_info` 产生无意义的整段镜像复制

## 4. 全量回归测试与端到端报告验证

- [x] 4.1 新增解构单元测试 `web/tests/test_compound_decoupling.mjs`，运行 `node web/tests/test_compound_decoupling.mjs` 验证切分正确率达 100%
- [x] 4.2 重新执行针对真实样本 `PU-2341E msds_CN 冠志.docx` 的端到端匹配，输出全新 16 个章节报告并验证 Section 2、Section 11、Section 1、Section 16 零内容粘连且插槽填充准确
- [x] 4.3 运行 `npm run test:smoke` 与原有测试套件，验证项目已有功能全部通过无回归破损
