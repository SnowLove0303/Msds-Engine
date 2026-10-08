# Tasks: DOCX 预览宽度自适应与布局深度优化 (Implementation Checklist)

## 1. DOCX 预览宽度自适应与缩放引擎 (DOCX Preview Auto-Fit Engine)

- [x] 1.1 实现 DOCX 页面宽度自适应算法（`fitDocxToWidth`）与 `ResizeObserver` 动态监听：根据容器实际宽度动态计算 `scale = (containerWidth - 24) / pageWidth` 并应用 `transform: scale`，强制 `overflow-x: hidden` 消除横向滚动条；核验整版 A4 页面左右边距完整可见。
- [x] 1.2 在 DOCX 预览面板中增加缩放控制工具条：提供“适应宽（默认）”、“100% 原始大小”、“＋ 放大”、“－ 缩小”快捷按钮与倍率指示；核验缩放切换平滑可用。

## 2. 页面网格与宽幅对等重构 (Layout Grid & Multi-Mode Compare)

- [x] 2.1 DOCX 识别页面重构为对等宽幅并排网格：侧边栏精简至 140px，结构化数据表与 DOCX 预览按对等比例（`1.05fr 1fr`）分屏，确保两栏均获得 750px~850px+ 的充裕视口；核验网格比例生效。
- [x] 2.2 智能匹配页面支持原件对标与多态对照模式：在顶部提供对照模式切换（【原件对标 DOCX vs 模板】、【识别对标 表格 vs 模板】、【三屏全览】），使 DOCX 预览在与标准模板对照时独占 50% 宽幅；核验模式切换正常。

## 3. 全局构建与功能核验 (Build and Verification)

- [x] 3.1 执行 `npm run build` 打包前端资源，核验无语法错误与构建失败。
- [x] 3.2 实际载入 MSDS 文档验证：核验 DOCX 预览在各模式下均无横向滚动条拖拽烦恼、整版文字完整可见、对照体验舒适。
