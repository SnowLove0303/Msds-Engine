# Proposal: UI 布局与 DOCX 预览宽度及自适应深度优化 (DOCX Preview Width & Auto-Fit Optimization)

## Why

用户明确指出核心痛点：
系统中的“宽度不足”核心指的是 **DOCX 原版式预览栏目的宽度不足**。
由于 Word 文档默认按 A4 标准页面（通常固定约为 794px~816px 宽）渲染，而当前界面在三栏或双栏时分配给 DOCX 预览的容器宽度仅有 300px~450px，导致整张文档直接被截断近半，**用户必须不断拖动底部的左右横向滚动条才能勉强看全整行内容，极不方便与数据表格进行同屏对照**。仅靠折叠/展开按钮不仅无法解决预览内容被截断的问题，反而丢失了对照基准。

因此，必须从**【DOCX 页面视口智能自适应缩放（Fit to Width）】**与**【页面网格宽度重新倾斜（大屏宽幅对等对照）】**两大维度，系统性根治 DOCX 预览横向滚动溢出问题，使用户一眼看全整版原文。

## What Changes

- **DOCX 预览视口自适应缩放引擎（Fit to Width）**：
  - 引入页面智能缩放机制：根据 `.docx-preview-shell` 实时容器宽度与 `section.docx` 实际页面宽度的比值，自动计算 `scale = (containerWidth - 24) / docxPageWidth`；
  - 应用 CSS 变换与等比包裹高度计算，**使 A4 页面 100% 完整卡合在预览栏内，彻底消除水平横向滚动条**；
  - 增加顶部精简缩放浮动栏：`[ 适应宽度 (默认) | 100% 原始 | ＋ 放大 | － 缩小 ]`，兼顾全局整幅速览与局部微字精读。
- **DOCX 识别页面（Inspector View）对等宽幅网格重划**：
  - 侧边栏紧凑化至 140px；
  - 主视口重构为 **对等宽幅对照网格（`1fr 1fr` 或 `1.1fr 1fr`）**，在常见 1080p 屏幕下为 DOCX 预览面板分配高达 **750px~850px** 的独立宽幅，使标准 A4 页面即便在 1:1 比例下也能几乎免滚动完整呈现。
- **智能匹配页面（Smart Matching View）对照模式多态化**：
  - 提供直观的对照模式切换：
    1. **【原件 vs 标准对照模式】（DOCX 预览 50% vs 标准模板 50%）**：将最核心的源文档与目标标准模板并排同屏对标，单栏宽度达 800px+；
    2. **【数据比对模式】（原始识别 50% vs 标准模板 50%）**：聚焦于识别出来的结构化表格与标准模板装配结果校验；
    3. **【三屏全览模式】**：三栏自适应排布，在三栏下 DOCX 预览同样自动以 Fit-to-Width 缩放适配，绝不出现截断横条。

## Capabilities

### New Capabilities
- `ui-layout-and-column-width-optimization`: 覆盖 DOCX 预览自适应缩放（Fit to Width）、预览栏目网格比例重划、多态对照模式及消除横向滚动条行为。

### Modified Capabilities
<!-- 无既有 Main Spec 变更 -->

## Impact
- `web/src/styles.css`: DOCX 预览包装器、缩放容器、A4 视口适配样式、对等网格分配规则。
- `web/src/main.js`: DOCX 预览自适应缩放脚本逻辑（ResizeObserver）、缩放控制事件、对等/三屏对照切换控制。
