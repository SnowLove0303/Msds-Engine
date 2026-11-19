# Technical Design: Section 2 排版间距紧实化架构方案

## 一、 几何间距参数对比与因果关系图

### 1. 现状间距参数分析 (松散态，约两行空行)
```text
Row N Content (例如 2.1 危险性类别值)
  └── tcMar.bottom = 160 dxa (8pt)
──────────────────────────────────────────────── (行边界)
Row N+1 Cell (例如 2.2 GHS标签要素)
  ├── tcMar.top = 160 dxa (8pt)
  └── Paragraph 0 (2.2 GHS标签要素：)
        └── w:spacing before = 160 dxa (8pt)

总垂直空白留白 = 160 + 160 + 160 = 480 dxa (24pt)
在 9.5pt/五号字排版下，1 行字高约为 12pt (240 dxa)，因此 480 dxa 正好等于 2 行空行！
```

### 2. 目标紧实间距方案 (紧实态，标准单行空行)
```text
Row N Content (例如 2.1 危险性类别值)
  └── tcMar.bottom = 60 dxa (3pt)
──────────────────────────────────────────────── (行边界)
Row N+1 Cell (例如 2.2 GHS标签要素)
  ├── tcMar.top = 60 dxa (3pt)
  └── Paragraph 0 (2.2 GHS标签要素：)
        └── w:spacing before = 100 dxa (5pt)

总垂直空白留白 = 60 + 60 + 100 = 220 dxa (11pt)
等价于标准单行空行高度（11~12pt），视觉留白减半，排版紧实严谨！
```

## 二、 施工流水线调用点与技术方案

在受控交付流水线 `web/scripts/generate_ep1501_standard_deliverables.mjs` 中，装配 4 格式 DOCX 时执行微观排版几何硬加固：
1. **遍历 Section 2 全部数据行（Row 1 至 Row 5）**：
   - 提取单元格 `w:tcPr` 内的 `w:tcMar`；
   - 将 `w:top` 设为 `60` dxa，`w:bottom` 设为 `60` dxa；
   - 保持 `w:left` 与 `w:right` 仍为 `140` dxa（确保左对齐与右边界稳定）；
2. **规整段落前距 (`w:spacing`)**：
   - 针对各主要小节标题段落（`2.2`、`2.3`、`2.4`、`2.5` 等），将其 `w:spacing` 的 `w:before` 调整为 `100` dxa；
3. **调用官方原生 Windows COM WPS/Word 接口导出 PDF**；
4. **运行 `audit_bipolar_bilayer.mjs` 与 `run_master_msds_audit.mjs` 执行全景回归审计**。

## 三、 依赖与权衡 (Trade-offs)
- **底层代码零篡改**：完全在生产流水线脚本 `generate_ep1501_standard_deliverables.mjs` 中完成几何规整，严格封印 `web/src/*` 底层，杜绝系统副作用；
- **全格式双向同步**：4 DOCX + 4 PDF 统一刷新，修改时间戳同步差控制在 10 秒以内。
