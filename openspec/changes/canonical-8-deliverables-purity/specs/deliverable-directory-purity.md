# Spec: 交付目录绝对纯净门禁规范 (Deliverable Directory Purity Spec)

## 规范定义
1. **法定 8 格式文件清单 (The Canonical 8 Deliverables)**：
   - `<MODEL> msds_CN 冠志.docx`
   - `<MODEL> msds_CN 冠志.pdf`
   - `<MODEL> msds_CN 国彩.docx`
   - `<MODEL> msds_CN 国彩.pdf`
   - `<MODEL> msds_EN Guanzhi.docx`
   - `<MODEL> msds_EN Guanzhi.pdf`
   - `<MODEL> msds_EN Guocai.docx`
   - `<MODEL> msds_EN Guocai.pdf`

2. **零多余文件公理 (Zero-Surplus-File Axiom)**：
   - 交付目录内非目录物理文件总数 `files.length === 8`。
   - 严禁出现带有 `(最新)`、`(更新)`、`(临时更新)`、`_源文件留存`、`_原版留存` 等任何修饰后缀的文件。
   - 严禁在交付目录保留开发草稿（如 `手做改版材料.docx`、`当前匹配结果.docx` 等）。

3. **机械断言判定 (G-01 Purity Gate)**：
   - 若 `files.length !== 8`，审计必须直接判定失败，退出码非 0。
   - 缺失任一法定文件，或存在任一未授权文件，直接熔断交付。
