# Proposal

## Why

用户反馈：DOCX 预览视口的灰框**在上一轮改动后依然存在**。上一轮把 `styles.css` 里的 `#eef2f5` / `#dbe2e8` 改成了 `#ffffff !important`，屏幕上毫无变化——因为那些规则**从未匹配任何元素**。

经在 Docker 容器内执行真实 DOM 取证（直接调用 `docx-preview` 渲染并输出子节点树与注入的 `<style>`），找到根本原因：

1. **三方库动态注入深灰底板**
   `docx-preview` 在容器最前注入 `<style>`：
   ```css
   .docx-preview-wrapper { background: gray; padding: 30px; padding-bottom: 0px; display: flex; flex-flow: column; align-items: center; }
   .docx-preview-wrapper > section.docx-preview { background: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); margin-bottom: 30px; }
   ```
   `background: gray`（标准色 `#808080`）叠加 **`padding: 30px`** 就是包住白页的**30px 深灰粗框**。它同时注入 `box-shadow: 0 0 10px rgba(0,0,0,0.5)`（50% 黑），是白页周围另一条深色轮廓来源。

2. **选择器命名脱节，所有覆盖失效**
   `web/src/main.js:3929` 以 `{ className: 'docx-preview' }` 调用 `renderAsync`，库因此产出 **`.docx-preview-wrapper`** 与 **`section.docx-preview`**，且包装层直接挂在 `.docx-preview-wrapper-holder` 下，**没有任何祖先带 `.docx-preview` 类**。
   而 `web/src/styles.css` 写的是 `.docx-preview .docx-wrapper` 与 `.docx-preview section.docx` —— 全部落空，包括 401-405 那条 `#ffffff !important`。

3. **自适应宽度缩放同因静默失效**
   `web/src/main.js:3771` 的 `applyDocxFitToWidth` 查询 `.docx-wrapper` / `section.docx`，取到 `null` 后直接 `return`。既有规格「DOCX 原版式预览视口智能宽度自适应缩放」因此实际处于失效状态，30px 边距以原始尺寸完整暴露。

**结论：这是一次"类名猜错"导致的连锁失效。** 判定必须建立在**渲染后 DOM 的计算样式**上，而不是样式表里是否存在某条规则文本。

## What Changes

1. **`web/src/styles.css`**：新增以真实类名为目标的覆盖规则，覆盖 `.docx-preview-wrapper`、`.docx-preview-wrapper-holder` 与 `section.docx-preview`；强制 `background: #ffffff !important`、`padding: 12px 0 !important`，并把页面投影替换为轻微值（`0 4px 18px rgba(0,0,0,0.12)`）。选择器列表**同时保留** `.docx-wrapper` / `section.docx` 变体，避免结构差异导致再次落空。
2. **`web/src/main.js:3771`**：`applyDocxFitToWidth` 的选择器扩展为 `.docx-wrapper, .docx-preview-wrapper` 与 `section.docx, section.docx-preview`，恢复自适应缩放。
3. **验收判据升级为计算样式断言**：把现有取证脚本 `web/tests/scratch_docx_dom.mjs` 由"临时取证"**改造为运行时计算样式断言测试**（断言包装层 `backgroundColor === 'rgb(255, 255, 255)'`、内边距不再等于 30px、页面投影为轻微值），并做负向验证；`web/tests/test_preview_background_contract.mjs` 的静态断言保留为**补充**防回归，不作为唯一判据。
4. **死规则取舍记录在案**：`.docx-preview .docx-wrapper` / `.docx-preview section.docx` 这类永不匹配的选择器，实施时二选一并记录：重构到真实类名（推荐，只留一套权威规则）或保留现状（最小改动）。
5. **重建容器并交付人工核验**：构建、就绪探针，并给出三视图对照材料交由用户手动核验。

## Capabilities

### Modified Capabilities

- `ui-layout-and-column-width-optimization`: 新增「DOCX 预览包装层底色与页面投影契约」要求，判定以渲染后 DOM 的计算样式为准；既有 5 条要求不变。

## Impact

- 代码：`web/src/styles.css`（真实类名覆盖规则）、`web/src/main.js`（缩放选择器兼容）
- 测试：`web/tests/scratch_docx_dom.mjs`（改造为计算样式断言）、`web/tests/test_preview_background_contract.mjs`（补充静态契约）
- 界面：识别页 / 匹配页 / 模板编辑器三视图的预览观感与缩放行为
- 兼容性：无接口变更；不改动 `docx-preview` 的引入方式与底层实现
