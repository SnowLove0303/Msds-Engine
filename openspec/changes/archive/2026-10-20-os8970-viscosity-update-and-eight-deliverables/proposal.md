# Change Proposal: OS-8970 理化特性粘度更新与标准 8 格式闭环产出 (OS-8970 Viscosity Update & Eight Deliverables)

## 1. 业务背景与变更诉求
- **目标源文件**：`E:\冠志\TDS MSDS (2)\TDS MSDS\产品 TDS MSDS -- WORD版本\水性噁唑啉交联剂\OS-8970 msds_CN 冠志.docx`
- **用户核心需求**：理化特性中的粘度改为 `＜1000`（即 `＜1000 mPa·s`，与同系产品 OS-8950 标准对齐），并重新生成完整的标准 8 格式（4 DOCX + 4 PDF，覆盖冠志与国彩、中英文全版本）。

## 2. 变更内容与处理规范
1. **理化特性粘度修改**：
   - 中文版（冠志 / 国彩）：Section 9 Row 5 第 2 段粘度值由 `＜500 mPa·s` 更新为 `＜1000 mPa·s`；
   - 英文版（Guanzhi / Guocai）：Section 9 Row 4 第 2 段粘度值由 `＜500 mPa·s` 更新为 `＜1000 mPa·s`。
2. **继承全局排版与页脚加固规范**：
   - 页脚公司名称强制左对齐（`<w:jc w:val="left"/>`）；
   - 剔除页脚日期异常缩进（`<w:ind>`），保障大写首字母及日期 100% 完整可见；
   - 规范修剪历史模板中的多余 `P` 前缀（`Prevision date` 规范化为 `Revision Date: ...` / `修订日期：...`）。
3. **标准 8 格式高保真渲染闭环**：
   - 产出 4 份标准 Word 文档（`OS-8970 msds_CN 冠志.docx`、`OS-8970 msds_CN 国彩.docx`、`OS-8970 msds_EN Guanzhi.docx`、`OS-8970 msds_EN Guocai.docx`，并同步提供中文后缀英文版副本）；
   - 通过 LibreOffice headless 流水线渲染导出 4 份高保真 PDF 交付物；
   - 产出物就地归集于源目录及引擎素材中心（`算法训练材料/OS-8970/`）。

## 3. 验收标准
- [x] 中英文 4 份 Word 中的 Section 9 粘度均已更新为 `＜1000 mPa·s`；
- [x] 全部 4 份 Word 的页脚公司名称严格左对齐、页脚日期规范无吃字；
- [x] 成功生成 4 份对应的 PDF 交付物，PDF 文本与排版与 Word 100% 一致；
- [x] 运行 `openspec validate os8970-viscosity-update-and-eight-deliverables --strict` 校验通过。
