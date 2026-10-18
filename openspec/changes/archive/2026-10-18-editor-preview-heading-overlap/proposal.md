# Proposal

## Why

模板编辑器右侧的 DOCX 预览标题行（模式切换 + 缩放控制 + 只读标记）在面板宽度不足时会发生换行，但该行被 CSS 固定为 `height: 38px / min-height: 38px`（`web/src/styles.css:3088-3096`），换行后的第二行溢出盒子，随即被紧随其后的 `.docx-preview-shell.editor-preview`（`#dbe2e8` 底色 + 渲染页阴影）覆盖。用户可见症状是「一条粗边框压住上方按钮」——被覆盖的按钮既看不清也无法点击，直接阻断预览模式切换与缩放操作。

已取证的系统性事实：编辑器 5 个工具条作用域中有 4 个被固定高度（`editor-file-ribbon` 28px、`editor-section-heading` 38px、`editor-table-heading` 38px、`editor-preview-heading` 38px），其中**只有预览标题行同时启用了 `flex-wrap: wrap`**（`web/src/main.js:2373` 内联样式），因此只有它在窄容器下溢出并被覆盖。

## What Changes

- 预览标题行改为**自适应高度**：宽度充足时保持既有 38px 单行紧凑外观；宽度不足而换行时该行随之增高，完整容纳全部控件。
- 为该行补 `flex-shrink: 0`，避免作为 flex 子项被压缩而再次产生溢出。
- 保留 `flex-wrap: wrap`：窄屏下换行优于隐藏或裁切控件。
- 明确**不采用**给标题行加 `z-index` / 定位的写法：那只是把覆盖方向反转（改为遮住预览内容），溢出根因仍在。
- 登记其余三个固定高度作用域的同类风险审计结论（当前均未启用换行，维持现状不修改）。
- 增补回归守卫：静态断言禁止「固定高度 + 允许换行」的组合；真实排版与视觉按项目既有「UI 真实核验原则」由人工在浏览器核验。

## Capabilities

### New Capabilities

（无。本缺陷属于既有 UI 布局能力的健壮性缺口，不新建近似能力。）

### Modified Capabilities

- `ui-layout-and-column-width-optimization`: 新增一条要求「预览工具条行的换行自适应与不可覆盖」，约束该工具条行在任意面板宽度下完整可见且不与预览层重叠；既有 4 条要求不变。

## Impact

- 代码：`web/src/styles.css`（`[data-toolbar-scope="editor-preview-heading"]` 规则）；必要时微调 `web/src/main.js:2373` 的内联样式
- 界面：模板编辑器右侧预览标题行的高度行为；单行宽度下外观与交互不变
- 兼容性：无接口变更；其余 4 个工具条作用域不受影响
- 测试：新增静态布局契约断言，配合人工浏览器核验
