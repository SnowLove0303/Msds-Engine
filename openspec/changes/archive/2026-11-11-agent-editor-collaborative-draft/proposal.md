# Proposal: Agent-Editor Collaborative Draft Workflow (Zero-UI-Disruption)

## Why

Currently, MSDS Studio operates with a divide between headless Agent API pipelines (which generate deliverables directly in Node.js server runtime) and the interactive Web Editor (which manages state and drafts inside browser memory at `http://127.0.0.1:5173/`). When an AI Agent extracts specialized chemical facts, completes 16-section translations, or derives slot values, there is no standardized API channel to inject these structured facts into a draft that the human operator can inspect, review, and fine-tune in the browser before final export.

Furthermore, user instructions strictly demand: **Maximum UI reuse without unauthorized additions or layout modifications**. Any change must avoid cluttering the interface with new arbitrary buttons, controls, or banners unless explicitly guided and approved by the user.

## UI Invariant Wall (最高视觉与交互只读封印)

> **用户法定裁决**：现有的图形界面、编辑器样式、配色方案、按钮功能及排版网格，皆为经过深度手工微调的法定成果，享有**绝对只读豁免权**。

- **禁止触碰 CSS**：严禁修改 `web/src/styles.css`，不得变动任何现有类名、边距、配色或布局。
- **禁止破坏 HTML/DOM**：严禁在 `web/index.html` 或现有主界面模板中擅自插入新控件、新弹窗或篡改原有按钮功能。
- **纯后台数据赋能**：实现必须采用“**零 UI 侵入（Zero-UI-Mutation）**”方式，仅通过数据管道（如启动时读取 `?draftId=...` 参数或既有加载通道）将 Agent 生成的数据无缝注入现有的 `state.editor.engine`，打开后依然是用户熟悉、调优完毕的 100% 原生界面。

## Capabilities

### New Capabilities
- `agent-editor-collaborative-draft`: Server-side draft management, incremental slot patching for Agents, and seamless integration with existing Web Editor loading pipelines without unauthorized UI modification.

## Impact

- **Affected Backend Modules**: `web/src/msds-api-controller.js` (add draft endpoints), `web/src/docx-engine.js` / `pipeline-engine.js` (slot patching & validation).
- **Frontend Modules**: `web/src/main.js` (reuse existing `loadDocx` / draft hydration logic only; strictly zero unapproved layout/UI changes).
- **Template & DB Protection**: Official benchmark templates in `web/public/templates/` remain SHA-256 locked and read-only.
