# Change Proposal: 页尾公司名称左对齐规范与几何加固 (Footer Company Left Alignment)

## 1. 业务背景与问题定义
- **用户核心诉求**：明确提出“页尾的公司名称要弄左对齐”。
- **现状与缺陷机理**：
  - 官方底模及输出文档的页脚表格采用表格样式 `Table Grid`（`<w:tblStyle w:val="5"/>`），该样式在 `styles.xml` 中将段落对齐显式声明为两端对齐（`<w:jc w:val="both"/>`）；
  - 页脚第 0 行第 0 格（Row 0 Cell 0）用于承载企业名称与产品型号（如 `广州冠志新材料科技有限公司 EP-1702-MSDS` / `Guangzhou Guanzhi New Material Technology Co., Ltd. EP-1702-MSDS`）；
  - 由于该单元格的段落属性（`<w:pPr>`）未显式指定 `<w:jc w:val="left"/>`，直接继承了表格样式的两端对齐；
  - 在英文版或长公司名发生自动折行时，第 1 行单词间距被拉扯分散以填满单元格，呈现极为不协调的双端拉伸，视觉上完全偏离了左对齐规范。

## 2. 变更目标与解决方案
1. **强制段落左对齐属性注入**：在 `updateHeaderFooterData` 及 `writeCompanyToFooterCell` 中，对页脚承载公司名称的单元格段落显式注入 `<w:jc w:val="left"/>`，权威覆盖底模与表格样式的 `both` 继承；
2. **清除残留缩进**：确保该段落无任何非预期的首行缩进（`w:ind`）；
3. **全模态与实体覆盖**：覆盖冠志（Guanzhi）与国彩（Guocai）的中英文全部 4 类变体与 8 格式导出，保证所有页脚公司信息均严格左对齐。

## 3. 验收标准
- [x] 所有页脚中公司名称段落（Cell 0）均显式包含 `<w:jc w:val="left"/>`，不再受底模 `both` 干扰；
- [x] 重新构建 EP-1702 交付物，中英文 DOCX 及 PDF 页脚公司名称均严格左对齐；
- [x] 运行 `openspec validate footer-company-left-alignment --strict` 校验通过。
