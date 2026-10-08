# Tasks

## 1. 样式重构与边框折叠模型升级 (styles.css)

- [x] 1.1 在 `web/src/styles.css` 中，将 `.structured-table, .editor-excel-table, .editor-table` 声明统一完善为 `border-collapse: collapse !important; border: 1px solid #6f6f6f !important;`。
- [x] 1.2 将所有的单元格边框规则由脆弱的同级选择器（`.structured-table td + td`、`.structured-table tr + tr > td`）彻底重构为全单元格标准规则：`.structured-table td, .structured-table th, .editor-excel-table td, .editor-excel-table th, .editor-table td, .editor-table th { border: 1px solid #6f6f6f !important; }`。
- [x] 1.3 废除 `border: 0 !important;` 单元格清除声明，确保每个单元格在四边均参与自然的 CSS 边框折叠。

## 2. 清除渲染工具层内联边框干扰 (render-utils.js)

- [x] 2.1 在 `web/src/render-utils.js` 的 `sourceCellStyle` 函数中，移除硬编码的 `const styles = ['border:0'];`，将其修改为 `const styles = [];`，杜绝内联 `style="border:0"` 导致的样式屏蔽。

## 3. 自动化测试用例与边界断言覆盖 (smoke.mjs)

- [x] 3.1 在 `web/tests/smoke.mjs` 中添加针对 Section 11（Row 3~6、Row 12~14）及 Section 2（Row 9~13）在 `rowspan > 1` 条件下子单元格边框完整性的断言，验证所有起始列大于 0 的首子单元格（`:first-child`）不再丢失 `border-left` 与全局网格边框。
- [x] 3.2 清理排查期间临时创建的诊断脚本 `web/test-border.mjs`。

## 4. 全流程验证与构建验收

- [x] 4.1 运行 `npm run test:smoke` 验证所有自动化回归测试通过。
- [x] 4.2 运行 `npm run build` 确保生产环境编译打包正常。
- [x] 4.3 验证并在 OpenSpec 规范体系下完成变更状态同步。
