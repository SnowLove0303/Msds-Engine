# Design: DOCX 预览视口自适应缩放与宽幅对等网格架构设计

## Context
`docx-preview` 渲染出的 Word 文档（`section.docx`）具有固定的物理宽度（通常基于 A4 页面为 794px~816px）。
当外层容器（`.docx-preview-shell`）的可用宽度不足 820px 时，固定宽度的页面必然溢出，产生水平滚动条；且在三栏挤压状态下，用户只能看到文档左侧一半。
因此，必须从**【页面自适应缩放（Fit to Width）】**与**【网格大宽幅分配】**协同解决。

## Goals / Non-Goals

**Goals:**
- **DOCX 视口 100% 宽度自适应（Fit to Width）**：整张 A4 文档的左右边距完整可见，彻底隐藏横向滚动条（`overflow-x: hidden`）；
- **缩放比率实时计算与自适应重绘**：通过 `ResizeObserver` 动态监听容器宽度变化，自动以 `(containerWidth - 24) / pageWidth` 为比例进行等比缩放；
- **DOCX 识别页面对等宽幅**：重构为 50%/50% 宽幅对照（各获 750px~850px），配合自适应缩放达到极致阅读体验；
- **智能匹配页面原件对照模式**：支持一键切换【DOCX 原版式 vs 标准匹配模板】超宽双列同屏对照。

**Non-Goals:**
- 不改变 DOCX 内部 XML 结构与排版数据，仅在呈现视口应用保真缩放变换。

## Decisions

### 1. 视口等比缩放与防溢出算法 (Fit-to-Width Scaling Engine)
- 在渲染 DOCX 之后，自动触发 `fitDocxToWidth(container, mode)`：
  ```javascript
  const containerWidth = container.clientWidth - 20;
  const section = container.querySelector('section.docx');
  const wrapper = container.querySelector('.docx-wrapper');
  if (section && wrapper) {
    const pageWidth = section.offsetWidth || 794;
    const scale = Math.min(1.5, Math.max(0.3, containerWidth / pageWidth));
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top center';
    // 容器强制禁止横向滚动，确保界面干净清爽
    container.style.overflowX = 'hidden';
  }
  ```
- 绑定 `ResizeObserver`，当侧边栏折叠或浏览器窗口缩放时无缝重绘，始终保持充满视口。

### 2. 识别页面：对等宽幅并排网格
- 将 `.inspector-layout` 从原先的偏重表格改为**对等宽幅**：
  ```css
  .inspector-layout {
    grid-template-columns: 140px minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 12px;
  }
  ```
- 1080p 屏幕下，左侧数据表格约 820px，右侧 DOCX 原版式预览约 800px，两边互相对标，均无横向滚动条。

### 3. 智能匹配页面：多态对照模式切换
- 在顶部操作栏增加模式切换 Tab：
  - **【原件对标】（默认推荐）**：DOCX 预览 (50%) + 标准匹配 (50%) —— 最贴合用户需求的逐行对标方式！
  - **【识别对标】**：原始识别表格 (50%) + 标准匹配 (50%)；
  - **【三屏全览】**：原始识别 (33%) + 标准匹配 (34%) + DOCX 预览 (33% 含自适应缩放)。

## Risks / Trade-offs

- **[Risk] 缩放后字体在低分辨率下的清晰度**：当缩放比率过低（如 < 0.5）时，小号字体可能不易辨识。
  - **Mitigation**：提供快捷缩放工具条（`[适应宽度 | 100% | ＋ | －]`），默认适应宽度看全排版，需要细看时一键切换 100% 原始尺寸。
