# Change Proposal: 修复页尾修订日期首字母截断吃字缺陷与前缀规范 (Footer Revision Date Clipping & Prefix Normalization)

## 1. 业务背景与问题定义
- **用户反馈**：“页尾 evision Date 要改成Evision Date ，要去调整一下”。
- **深层缺陷机理排查**：
  - 经对底层 PDF 文本与 OOXML 树逐层提取比对，系统在输出时写入的英文修订日期原本为 `Revision Date: 2026/10/20`；
  - 但底模页脚第 0 行第 1 格（Row 0 Cell 1，承载修订日期）残留了超大首行缩进属性：`<w:ind w:firstLine="8730" w:firstLineChars="4850"/>`；
  - 该单元格物理列宽仅为 `4984` dxa，而 `8730` dxa 缩进强行将文本首行向右推移并导致起始字符溢出页面边界；
  - 在 LibreOffice 渲染导出高保真 PDF 及部分 Word 视图中，首字母大写 `R` 被硬性裁剪丢弃，在 PDF 文本提取与肉眼视觉上均呈现为残缺的 `evision Date: 2026/10/20`；
  - 用户在审阅 PDF 时直接读取到了残缺词 `evision Date`，并发现首字母为小写 `e`，故提出将首字母修正大写。

## 2. 变更目标与解决方案
1. **彻底清除 Cell 1 异常缩进**：在 `writeDateToFooterCell` 中定位 `<w:pPr>`，强制剔除 `<w:ind>` 首行/悬挂缩进节点，消灭所有截字溢出源头；
2. **统一调用并固化写入逻辑**：在 `updateHeaderFooterData` 中将 `cells[1]` 统一收敛至 `writeDateToFooterCell`；
3. **前缀兼容与标准化**：兼容识别与标准化 `Revision Date` / `Evision Date` / `修订日期`，确保大写首字母 100% 完整呈现在 PDF 与 DOCX 中；
4. **修复派生阶段 activeDate 传递**：在 `deriveEntityPresets` 中修复英文实体派生时的日期传递，确保冠志与国彩双语版本 100% 呈现标准日期。

## 3. 验收标准
- [x] DOCX `word/footer1.xml` 的 `Row 0 Cell 1` 彻底消除 `w:firstLine="8730"` 缩进；
- [x] LibreOffice PDF 导出的每一页页脚文本中，100% 完整呈现大写首字母 `Revision Date: 2026/10/20`，彻底消灭截字吃字造成的 `evision Date`；
- [x] 运行 `openspec validate footer-revision-date-clip-fix --strict` 校验通过。
