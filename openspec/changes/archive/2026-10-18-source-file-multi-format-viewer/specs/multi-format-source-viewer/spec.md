# Spec Delta: multi-format-source-viewer

## Purpose

支持在智能匹配“三屏同览”工作区中，接入 GitHub 顶流开源阅览器（Mozilla PDF.js / 原生 PDF / 增强型 DOCX），重构 UI X 轴宽度分配，彻底解决原版式页面在常规屏幕下严重缩水、表格被切边或横向内容显示不全的问题。

## ADDED Requirements

### Requirement: 顶流开源阅览引擎接入
系统 SHALL 接入 GitHub 行业标杆阅览方案（Mozilla PDF.js 46k+ stars 及现代浏览器原生 PDFium 引擎），支持直接内嵌解析并渲染 `.pdf` 源文件。

#### Scenario: 阅览真实 PDF 源文件
- **WHEN** 用户导入 `.pdf` 格式的 MSDS 源文件并在智能匹配三屏同览中查看
- **THEN** 右侧视口以无损矢量、全保真分页方式呈现真实 PDF 原貌，支持翻页、平滑缩放与文字选择

---

### Requirement: 科学列宽重构与最小保护宽度
三屏同览布局 SHALL 采用倾斜给原版式列的科学比例分配，并为原版式列提供保底最小宽度保护（$\ge 520\text{px}$）。

#### Scenario: 三屏同览默认呈现
- **WHEN** 页面在智能匹配“三屏同览”模式下渲染
- **THEN** 网格列宽按 `0.85fr : 1.0fr : 1.45fr` 展开，原版式列获得最大 X 轴物理展示空间

---

### Requirement: 解除 X 轴截断与平滑横向滚动
预览视口 SHALL 废除强制 `overflow-x: hidden !important`，在内容或页面宽度超出时提供平滑横向滚动支持。

#### Scenario: 100% 原始大小或宽表格查阅
- **WHEN** 用户将缩放调至 100% 原始尺寸，或源文件包含超宽表格
- **THEN** 内容右侧严禁被硬切断，视口允许用户横向平滑滚动查看全部单元格

---

### Requirement: 原版式聚焦展宽模式
原版式视口工具栏 SHALL 提供一键“聚焦展宽”与“还原”交互，支持临时将原版式列拉伸至主导宽度（约 70% 宽幅）。

#### Scenario: 用户切换聚焦展宽模式
- **WHEN** 用户点击原版式栏顶部的“⤢ 聚焦展宽”按钮
- **THEN** 界面重新分配三栏比例，原版式列扩展至视口主导地位，用户可近距离舒适核对细节；再次点击可一键复原为标准三屏
