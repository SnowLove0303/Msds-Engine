# Proposal

## Why

依据《MSDS Studio 识别页与智能匹配页可用空白及标签列宽度审计报告》，当前系统在识别页与智能匹配页存在两大核心排版与布局瓶颈：
1. **标签换行续行首字回左错位（关键缺陷）**：当标签因列宽不足发生自动折行时（如 Section 5 中的 `5.1  合适的灭火剂：`），第二行的第一个汉字回退到了单元格最左侧，与第一行中文首字错开了一个序号槽宽度（实测错位量达 44.79px）。排查确认根因为 `styles.css` 中 `.structured-table td:first-child .label-parent-row` 规则以更高特异性将 `.label-line-grid` 强制重写为 `display: block !important`，导致 Grid 双槽位容器降级为普通行内流；
2. **宽屏可用空白严重闲置与三屏挤压**：外层容器 `main.page-shell` 被硬性限制为 `max-width: 1920px`，在 2304px 等常见宽屏视口下两侧留下近 380px 的未使用空白；智能匹配三屏模式下原始表仅 427px、标准表仅 502px，标签列被极度压缩，推高了换行概率。

必须按照审计报告确立的科学顺序进行重构：先解决真实 Grid 布局与续行首字共线，再释放外层可用空白并优化各模式面板分配。

## What Changes

1. **恢复 `.label-line-grid` 真实 Grid 布局与续行垂直共线**：
   - 消除 CSS 特异性冲突：排除 `.label-line-grid` 被 `.label-parent-row` 等普通块级规则的覆盖，确保 `.label-line-grid` 始终保持 `display: grid !important`；
   - 明确 `.label-text-slot` 作为网格第二槽位并声明 `display: block; grid-column: 2; min-width: 0;`；
   - 实现硬性排版契约：标签发生任何自动换行时，第二行及后续行首字必须绝对与第一行中文首字处于同一垂直参考线。

2. **释放外层工作区可用空白**：
   - 放宽 `main.page-shell` 在宽屏（>=1920px）下的宽度限制，采用 `max-width: calc(100vw - 32px)` 或 `max-width: 2400px` 超宽流式策略，消除 180px 级的左右空白浪费；
   - 保留 1280px 以下现有的响应式折叠逻辑，保证移动端与小屏兼容性。

3. **重构识别页三列分配**：
   - 保持 140px 固定章节导航侧栏；
   - 结构化识别表提升弹性权重至 `minmax(0, 1.25fr)`；原版式预览列保持稳定的最低可读宽度（`minmax(820px, 1fr)`）。

4. **重构智能匹配页三种模式分配与内边距回收**：
   - 回收 `.matching-col-scroll` 的横向内边距（由 `10px` 优化为 `4px`），每表回血约 20px 横向可用空间；
   - 三屏同览模式下提高原始表与标准表的宽度分配预算，避免标签列被压至 140px~170px 的极窄状态。

5. **网页阅读层纯二列标签-值表自适应保底策略**：
   - 仅对纯两列标签-值表提供自适应列宽保底（`min-width: 180px`），大幅减少不必要换行；
   - **严格红线**：绝不修改 Section 3 三列成分表、绝不触碰单列说明正文、绝不将网页显示列宽回写到 DOCX 模型的 `gridWidthsTwips` 或导出文件。

## Capabilities

### New Capabilities
- `label-continuation-alignment-and-workspace-layout`: 涵盖 `.label-line-grid` 双槽位续行共线几何契约、宽屏外层空白释放、识别页与匹配页面板比例分配及纯二列表格自适应保底规则。

### Modified Capabilities
<!-- No requirement changes to existing capability delta specs -->

## Impact
- **代码影响**：`web/src/styles.css`（网格选择器特异性调整、外层宽度、工作区网格分配、滚动容器内边距）、`web/src/render-utils.js`（表格渲染层布局类辅助）。
- **视觉影响**：消除宽屏无意义巨额空白；全 16 章节标签在发生换行时，第二行文字绝对与第一行中文首字左对齐，彻底消除阶梯状缩进断层；标签列可用宽度显著提升。
- **架构与数据安全**：纯前端呈现层与样式优化，不影响后端 API、不改动 DOCX 导出、不改变匹配结果模型。
