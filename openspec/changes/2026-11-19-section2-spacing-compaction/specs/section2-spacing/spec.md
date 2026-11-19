# Specification: Section 2 Spacing Compaction Invariants

## 1. RFC 2119 行为契约

### REQ-01: Section 2 组间垂直间距压缩至一行空行
- 系统 **SHALL** 针对 Section 2 的 6 行大通栏数据行（Row 1 至 Row 5）调整其几何间距。
- **WHEN** 计算 Section 2 单元格上下边距与段落前间距时；
- **THEN** 系统 **SHALL** 将数据行单元格边距 `tcMar` 的 `top` 与 `bottom` 调整为 `60` dxa（3pt），并将节标题起始段落（2.2, 2.3, 2.4, 2.5）的 `w:before` 调整为 `100` dxa（5pt），使得各小节间的总物理留白严格处于 `220` dxa（11pt，等价于标准单行空行高度）范围，杜绝达到两行空行的 480 dxa 冗余留白。

### REQ-02: 视觉紧实度与层级对齐保全
- 系统 **SHALL** 保持 Section 2 内部分类正文段落（如 H412、P 代码等）的单倍/1.25 倍基础行间距不变；
- **WHEN** 排版渲染 Section 2 时；
- **THEN** 节标题保持纯左对齐加粗，二级值段落保持层级缩进（中文 840 twips / 英文 677 twips），整体视觉重心稳健、排版紧实。

### REQ-03: 八格式交付物双语镜像同构
- 系统 **SHALL** 将上述 Section 2 间距压缩规制应用于全部 8 份标准交付物：
  - `EP-1501 msds_CN 冠志.docx` / `EP-1501 msds_CN 冠志.pdf`
  - `EP-1501 msds_CN 国彩.docx` / `EP-1501 msds_CN 国彩.pdf`
  - `EP-1501 msds_EN Guanzhi.docx` / `EP-1501 msds_EN Guanzhi.pdf`
  - `EP-1501 msds_EN Guocai.docx` / `EP-1501 msds_EN Guocai.pdf`
- **WHEN** 导出 Word 与调用 Windows COM WPS/Word 转译 PDF 时；
- **THEN** 中英文两版在 PDF 与 Word 中的 Section 2 组间空行跨度表现 **SHALL** 保持完全相同的单行空行紧实视觉。

### REQ-04: 化学事实与机械审计一票否决门禁
- 系统 **SHALL NOT** 更改或删除 Section 2 中的任何分类文本、H 声明与 P 声明；
- **WHEN** 运行集中式中央主审计与双极双层法医审计时；
- **THEN** 退出码 **SHALL** 保持 0，违章数 **SHALL** 保持 0，167/167 项断言全部绿灯通过。
