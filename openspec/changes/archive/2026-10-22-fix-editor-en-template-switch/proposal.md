# Change Proposal: 修复模板编辑器切换 EN 冠志底模状态未同步问题

## 1. 摘要与背景 (Summary & Motivation)
用户在 Web 工作台编辑器中切换【EN 冠志】模板基准时，界面未能及时切换为全套英文底模，或者在智能匹配导入 EN 模板后，基准下拉框与草稿状态仍停留在 CN。

### 根因分析 (Root Cause Analysis)
1. **多格式基准解析与兼容容错不足**：`switchBaselineDraft(targetBaselineId)` 仅精确匹配 `b.id === targetBaselineId`，当传入 `EN 冠志`、`正式模板 · EN 冠志 (OSHA GHS)` 等展示名或语言代码时，回退兜底为 `TEMPLATE_BASELINES[0]`（即 CN 冠志），导致反向切回中文；
2. **状态未完全对齐 (State Drift)**：智能匹配点击【导入模板编辑器】（`commit-to-editor`）时，仅设置了 `state.editor.template`，未同步更新 `state.editor.currentBaselineId` 与对应草稿池 `state.editor.drafts[targetBaselineId]`，导致编辑器进入后依然锚定在 CN 基准；
3. **事件监听重复与竞态条件**：`#baseline-select` 在 `bindEvents()` 中直接绑定 `change`，同时全局事件委托中又绑定了冒泡的 `change`，导致 `switchBaselineDraft` 并发执行两次，发生状态竞争；
4. **页眉页脚语言版本未联动**：Section 00 中修改【语言版本】（`#hf-lang-select`）仅修改文字，未联动切换底模基准；
5. **单真理源缺失**：`loadEditorTemplate(name)` 与 `switchBaselineDraft(id)` 存在冗余分叉，未形成统一基准草稿驱动通道。

## 2. 拟议变更与目标规格 (Proposed Specification)
1. **智能鲁棒的基准解析器**：在 `switchBaselineDraft` 中增强基准解析逻辑，对 `id`、`displayName`、`label`、`templateFile`、`language` 及含 `EN`/`CN` 关键词进行精准归一化匹配，确保切换到 EN 冠志 100% 命中；
2. **智能匹配导入时基准全状态同步**：`commit-to-editor` 时根据所选模板同步设置 `state.editor.currentBaselineId`、`state.editor.template` 并将当前引擎存入对应基准的独立草稿池；
3. **事件去重与防抖加锁**：清理重复的 `change` 监听器，在 `switchBaselineDraft` 内部增加并发执行锁；
4. **语言版本切换联动提示**：在 Section 00 的 `#hf-lang-select` 切换为 EN 或 CN 时，联动切换对应的底模基准草稿；
5. **右侧预览智能感知**：切换到 EN 基准时，自动将预览模式切为 `📑 模板效果`，确保用户能够第一时间直观看到英文排版。

## 3. 验收标准 (Acceptance Criteria)
1. 在编辑器基准下拉框选择 `正式模板 · EN 冠志 (OSHA GHS)`，编辑器 Section 1 标题立即呈现为 `1.Identification`，左侧导航和右侧表格完全呈现英文内容；
2. 在智能匹配中选 `EN 冠志` 并导入编辑器，编辑器基准下拉框自动对应为 `正式模板 · EN 冠志 (OSHA GHS)`，草稿状态正常流转；
3. 单元测试与端到端冒烟测试全绿（0 失败）；
4. `ai-harness validate` 0 errors，`openspec validate --all` 全绿。
