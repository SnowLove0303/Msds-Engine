# Proposal: 恢复 Section 11 毒理学说明源文档空行间隔 (msds-section11-empty-lines)

## 1. 变更背景与问题定位

在 MSDS 源文档（如 `PU-2341E msds_CN 冠志.docx` 及 `PU-2341E msds_CN 国彩.docx`）中，Section 11（毒性资料 / 毒理学信息）通常将大量毒理学实验评估（急性毒性经口/经皮/吸入、皮肤刺激、粘膜刺激、致敏性、遗传毒性、致癌性、生殖毒性、STOT 等）排版在同一个单元格内（包含 104 个段落）。

在源文档 OOXML 中，各毒理学专项之间存在显式的空段落（`<w:p/>`，共 17 处），作为段落间的空行间隔（Spacer）。

然而在前端解析渲染渲染时（`render-utils.js` 中的 `renderParagraph`）：
- 空段落渲染成了空标签 `<div class="" style=""></div>`；
- 在 HTML/CSS 盒模型中，没有任何文本、空白字符或行高的空 `div` 元素其渲染高度直接坍缩为 `0px`；
- 导致前端识别渲染结果中，所有专项之间的空行间隔全部丢失，104 个段落紧密挤压在一起，破坏了与源文档的一致性及阅读层次。

## 2. 变更目标

1. **精准呈现空行间隔**：针对多段落单元格内的空段落，在前端生成具备标准行高与非坍缩内容的段落占位元素（`<div class="paragraph-spacer" style="min-height:1.2em;line-height:1.2em">&nbsp;</div>`），忠实还原源文档空行视觉间隔。
2. **区分空表格行与空段落**：保持之前实现的表格空行清理（`logicalTableRows` 中剔除全空 `<tr>` 行）机制不变，确保空行删除与空行间隔两者互不干扰。
3. **保持真·空白单元格语义**：如果整个单元格本身完全没有文本与图片，保持显示“空白单元格”，不被段落占位机制误伤。

## 3. 影响范围

- `web/src/render-utils.js`：更新 `renderParagraph`，增加对空段落的识别与非坍缩渲染；
- `web/src/styles.css`：定义 `.paragraph-spacer` 规范样式（`min-height: 1.2em; line-height: 1.2em; user-select: none;`）；
- `web/tests/smoke.mjs`：补充针对 Section 11 空行间隔及全套文档回归断言。
