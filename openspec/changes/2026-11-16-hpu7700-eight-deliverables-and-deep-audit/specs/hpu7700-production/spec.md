# Specification: HPU-7700 Production & Audit Contracts

## 1. 规范概述 (Overview)
本规范定义产品型号 `HPU-7700`（羟基聚氨酯分散体）的 MSDS 八格式标准生产与质量验收准则。

## 2. 行为契约 (RFC 2119 SHALL/WHEN/THEN)

### 2.1 源事实提取与绑定契约 (Source Fact Grounding Contract)
- **SHALL**: 系统 SHALL 严格从源文档 `HPU-7700 msds_CN 冠志.docx` 提取化学事实，包括品名 `羟基聚氨酯分散体`、型号 `HPU-7700`、三项组分（聚氨酯聚合物 ＞35%、水 ＞55%、N,N-二甲基乙醇胺 1-5%）、外观 `透明至半透明液体`（英译 `Transparent to translucent liquid`）、固含 `37±2%` 等。
- **SHALL NOT**: 系统 SHALL NOT 虚构或外生引入未经源文件载明的事实（如严禁输出“象形图: 无 / 信号词: 无”，严禁将外观篡改为“乳白”）。

### 2.2 交付物完整性契约 (Deliverable Set Completeness)
- **WHEN**: 流水线执行完毕并导出时；
- **THEN**: 系统 SHALL 在目标目录 `算法训练材料/TDS MSDS 重写版/01-2 水性羟基聚氨酯树脂 HPU/HPU-7700/` 下产出且仅产出以下 8 个文件：
  1. `HPU-7700 msds_CN 冠志.docx`
  2. `HPU-7700 msds_CN 国彩.docx`
  3. `HPU-7700 msds_EN Guanzhi.docx`
  4. `HPU-7700 msds_EN Guocai.docx`
  5. `HPU-7700 msds_CN 冠志.pdf`
  6. `HPU-7700 msds_CN 国彩.pdf`
  7. `HPU-7700 msds_EN Guanzhi.pdf`
  8. `HPU-7700 msds_EN Guocai.pdf`

### 2.3 机械排版与全景法医级审计门禁 (Audit Gate Contract)
- **SHALL**: 4 份 PDF 交付物中的 Section 9 全量标签首字必须绝对垂直对齐至 `x0 = 80.28pt`（误差 $\le 1.2\text{pt}$）。
- **SHALL**: 英文版 PDF 说明行实际字号必须保持为 `9.50pt`（$\le 11.0\text{pt}$）。
- **SHALL**: 全篇表格内非法自定义 `<w:tabs>` 制表位必须为 0，值格内非法 `<w:tab/>` 必须为 0。
- **SHALL**: 英文版 4 份交付物中文字符数严格为 0。
- **SHALL**: 必须通过三大自动化测试审计套件，缺陷数全为 0，真实退出码为 0。
