# Tasks

## 1. 实现单元格内空段落防坍缩机制

- [x] 1.1 在 `web/src/render-utils.js` 的 `renderParagraph` 中增加空段落检测：当段落无有效文本且所属单元格含有内容时，渲染为带明确最小行高的防坍缩占位元素（`<div class="paragraph-spacer" style="...min-height:1.2em;line-height:1.2em">&nbsp;</div>`）。
- [x] 1.2 在 `web/src/styles.css` 中增加 `.paragraph-spacer` 规范样式，设置 `min-height: 1.2em !important; line-height: 1.2em !important; user-select: none;`，杜绝任何高度为 0 的隐形折叠。

## 2. 验证 Section 11 空行间隔恢复

- [x] 2.1 验证在 `PU-2341E msds_CN 冠志.docx` 中，Section 11 第一行单元格中的 17 处空段落全部渲染为 `.paragraph-spacer`，呈现清晰的垂直空行视觉间隔。
- [x] 2.2 验证各毒理学专项（如“急性毒性，经皮”、“急性毒性，吸入”、“原发性皮肤刺激”、“致敏性”等）之间均具备独立空行间隔，不再挤压粘连。

## 3. 守恒验证：保证空表格行删除与空白单元格语义不退化

- [x] 3.1 验证 Section 14 等空表格行（全空 `<tr>`）继续被 `logicalTableRows` 自动识别并删除，不发生逻辑回退。
- [x] 3.2 验证全空单元格（如 PU-1107 中无内容的单元格）仍正常渲染为 `空白单元格` 提示，不产生异常空行堆叠。
- [x] 3.3 验证所有文本的加粗规范（上一任务中确立的仅有源文档加粗与特殊前缀加粗）保持 100% 完好。

## 4. 自动化测试与生产构建回归

- [x] 4.1 在 `web/tests/smoke.mjs` 中增加针对 Section 11 空段落防坍缩断言，确保 17 个空行正确渲染且全套测试用例通过。
- [x] 4.2 执行 `npm run build` 确保生产环境打包构建通过。
