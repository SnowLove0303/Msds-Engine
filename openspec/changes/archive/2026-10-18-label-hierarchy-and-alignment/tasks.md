# Tasks

## 1. 角色样式与标签字号规范化

- [x] 1.1 优化 `web/src/docx-engine.js` 中的 `deriveRoleStyles`，仅扫描正文表格（`part === 'word/document.xml'`）中 row > 0 的数据行，排除页眉、页脚及文档封面标题的干扰，强制将标签字号规范为小四（12pt / 24 halfPoints）加粗；验证通过测试脚本加载 CN 模板后 `engine.roleStyles.label.sizeHalfPoints` 为 `24`。
- [x] 1.2 调整 `web/src/main.js` 中 `sourceRunStyle` 的样式映射逻辑，确保标签运行区统一呈现 12pt 加粗效果，序号与标签字体比例协调；验证标签文本渲染后 CSS `font-size` 为 `12pt`。

## 2. 序号健壮识别与零丢失提取

- [x] 2.1 增强 `web/src/docx-engine.js` 与 `web/src/main.js` 中的序号识别算法，全面支持多级数字（`1.1`、`1.2`、`1.1.1`）、单级数字（`1.`、`2.`、`1、`）以及 Word `numbering.xml` 自动编号；验证 Section 1、2、8、9 的序号全量被捕获，无断号漏识。
- [x] 2.2 优化 `renderParagraph` 的前缀生成与文本剥离（`stripRemaining`）逻辑，当未识别到序号时严禁截断正文，识别到序号时将序号作为独立的 `.sequence-run` 节点输出；验证正文文本内容字符零丢失。

## 3. 父子标签分类与层级判定

- [x] 3.1 在 `web/src/main.js` 中实现 `classifyLabelTier` 分级函数，依据是否包含有效序号将第一列标签判定为 `parent`（父级）或 `child`（子级）；验证 Section 1 中的 `1.1 产品名称：` 被标记为 parent，`中文名称：` 被标记为 child。
- [x] 3.2 增加 Section 8 专属业务特例规则，将 `建议：` / `Recommendation:` 显式归类为 `parent`（父级标签）；验证 Section 8 的 `建议` 被正确判定为 parent。

## 4. 双垂线排版与垂直对齐样式

- [x] 4.1 移除 `web/src/main.js` 中机械固定的 `label-prefix-spacer`，在 `web/src/styles.css` 中新增 `.label-parent-row` 与 `.label-child-row` 样式类；验证所有父级标签左边缘在最左基准线上严格垂直对齐。
- [x] 4.2 设置 `.label-child-row` 的统一缩进线，验证所有子级标签在同一内缩垂线上严格垂直对齐，且 Section 8 的 `建议：` 顶格对齐于父级基准线上，不发生子级缩进。

## 5. 端到端验证与构建

- [x] 5.1 更新 `web/tests/smoke.mjs`，添加针对标签小四字号（12pt）、全量序号呈现、以及 Section 8 建议父级类名的自动化断言；运行 `npm run test:smoke` 验证测试全绿通过。
- [x] 5.2 执行 `npm run build` 完成生产环境静态构建，并在本地浏览器启动验证实际渲染效果。
