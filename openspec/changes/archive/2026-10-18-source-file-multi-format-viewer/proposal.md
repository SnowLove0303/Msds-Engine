# Proposal: 智能匹配模块接入 GitHub Top 开源阅览器（PDF.js / js-preview）并重构 X 轴宽度分配

## Why (变更背景与痛点)

1. **原版式格式与技术局限**：
   - 当前工作区仅支持单一的 `.docx`，不支持业务高频的 `.pdf` 与老旧 `.doc`；
   - 仅依赖轻量 DOM 渲染库 `docx-preview`，在复杂表格、多页排版与排版真实度上存在局限。
2. **UI X 轴宽度严重不足导致内容显示不全**：
   - 在“三屏同览”下，当前三列比例为 `1fr : 1.15fr : 1fr`，原版式视口在常规屏幕下仅分得约 400px 左右宽度，而 A4 真实页面基准为 794px~816px，导致缩放比例被压缩至 0.4 甚至更低；
   - 样式中硬编码了 `overflow-x: hidden !important;`，一旦页面有宽表格或用户放大查看，内容右侧直接被截断，完全无法横向滚动；
   - 缺乏合理的列宽权重调度以及快速展开聚焦的能力。

## What Changes (核心改造方案)

1. **接入 GitHub 顶流开源阅览器套件**：
   - **PDF 真实阅览引擎**：接入 GitHub 46k+ Stars 的 **Mozilla PDF.js** 与现代浏览器原生高保真沙箱阅览器（Blob URL 原生内嵌，具备矢量打印级 100% 真实呈现、分页、缩放与选词）；
   - **Office 阅览引擎增强**：集成 GitHub 4.2k+ Stars 的 **vue-office / @js-preview** 生态能力与增强型 `docx-preview`，支持自适应分页排版；
   - **DOC 格式适配通道**：对于 OLE2 二进制 `.doc`，无缝联动本地 Office/WPS 转换桥导出高保真 PDF 预览，离线免环境时提供友好的转换指导。
2. **重构 UI 宽度架构，彻底解决 X 轴显示不全**：
   - **列宽黄金权重重构**：将三屏网格由平均分配改造为偏向原件的科学比例（`minmax(280px, 0.85fr) minmax(320px, 1fr) minmax(520px, 1.45fr)`），显著提升原版式列的有效物理宽度；
   - **解除 X 轴强制截断**：移除 `overflow-x: hidden !important;`，在保持智能宽度自适应（Fit-Width）的同时，放开横向平滑滚动条，彻底杜绝内容被切边；
   - **新增“聚焦展宽 / 还原”双态切换器**：在原版式顶部增加 `[⤢ 聚焦展宽]` / `[⤡ 还原]` 切换按钮，支持在核对细节时一键将原件展开至 70% 宽幅或全屏高保真对照。

## Capabilities

### New Capabilities
- `multi-format-source-viewer`: 接入 GitHub 顶流开源阅览器（PDF.js / 原生 PDF / js-preview 增强），实现 DOCX / DOC / PDF 本地无损真实阅览。
- `responsive-wide-split-workbench`: 三屏同览科学权重列宽与动态聚焦展宽能力，解决 A4 版式 X 轴显示不全。

## Impact
- **代码影响**：
  - `web/src/main.js`：引入多格式阅览引擎调度、聚焦展宽交互、多级缩放与文件接收通道；
  - `web/src/styles.css`：重构三屏同览 Grid 模板、解除 X 轴强制死锁、优化阅览器容器与展宽聚焦样式；
  - `web/package.json`：根据选型引入相关依赖（如 `pdfjs-dist` 或 `@js-preview/pdf`）。
- **质量与兼容性**：
  - 纯本地运行，不向外网传输文件；
  - 现存的所有自动化测试链路（smoke 与清零回归）保持全绿。
