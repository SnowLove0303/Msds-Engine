# Design: 页尾修订日期缩进清除与首字防截断设计 (Footer Date Indent Pruning & Clipping Prevention)

## 1. 核心流程与数据流

1. **`writeDateToFooterCell` 加固**：
   - 获取单元格第 1 个段落 `<w:p>`；
   - 获取或创建 `<w:pPr>`；
   - 检查是否存在 `<w:ind>`，若存在立即执行 `pPr.removeChild(ind)`；
   - 保持 `<w:jc w:val="right"/>` 右对齐；
   - 单一 Run 节点写入 `${formattedDate}   `，清除后续多余 Run。

2. **`updateHeaderFooterData` 统一收敛**：
   - 替换原有的行内分散写入逻辑，直接调用 `writeDateToFooterCell(doc, cells[1], formattedDate)`；
   - 标记 `modified = true`。

3. **`pipeline-engine.js` 派生日期传递修复**：
   - 在 `deriveEntityPresets` 中，将 `revisionDate: activeDate` 传入英文派生配置，避免 null 传递。
