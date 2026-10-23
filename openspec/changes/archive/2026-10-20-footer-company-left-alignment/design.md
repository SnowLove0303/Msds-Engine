# Design: 页尾公司名称左对齐技术实现 (Footer Company Left Alignment Design)

## 1. 架构与数据流

在 [docx-engine.js](file:///F:/App%20Location/Guanzhi%20Tong/Skill/MSDS-Engine/web/src/docx-engine.js) 的 `updateHeaderFooterData` 函数中：
- 遍历所有 `word/footer*.xml`；
- 针对表格型页脚，定位 `rows[0].cells[0]`；
- 针对非表格型页脚，正则匹配包含公司实体名称的段落；
- 统一调用或应用对齐强化逻辑：
  - 获取或创建 `<w:pPr>`；
  - 查找或创建 `<w:jc>` 节点，设置 `w:val="left"`；
  - 检查并移除意外残留的 `<w:ind>` 缩进节点；
  - 写入公司名称与型号；
  - 标记 `modified = true` 并序列化回 `supportingXml`。

## 2. OOXML 节点规范

```xml
<w:tc>
  <w:tcPr>
    <w:tcW w:w="4984" w:type="dxa"/>
    <w:vAlign w:val="center"/>
  </w:tcPr>
  <w:p>
    <w:pPr>
      <w:spacing w:line="0" w:lineRule="atLeast"/>
      <w:jc w:val="left"/>
      <w:rPr>
        <w:kern w:val="0"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:hint="eastAsia"/>
        <w:kern w:val="0"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
      <w:t>广州冠志新材料科技有限公司 EP-1702-MSDS</w:t>
    </w:r>
  </w:p>
</w:tc>
```

## 3. 防回归与稳健性
- 当 `targetCompany` 或 `targetModel` 为空时，若单元格已有公司名称，仍强制加上 `<w:jc w:val="left"/>`，防止未改动文本的文档遗漏对齐属性；
- 无论单段还是多段折行，均保持左边缘平齐。
