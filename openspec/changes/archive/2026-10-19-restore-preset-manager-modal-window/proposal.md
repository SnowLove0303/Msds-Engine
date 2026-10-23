# Proposal

## Why

预设管理的DOM仍有 `role="dialog"` 和modal/backdrop类名，但当前基础弹窗样式缺失，内容进入主页面文档流并铺到页面底部，失去原本独立窗口体验。用户要求恢复为居中独立窗口，并一并规划窗口颜色、层次、边线、按钮和内部空间布局。

## What Changes

- 恢复预设管理为固定视口遮罩上的居中、限宽限高窗口，窗口标题/关闭、内部滚动内容和底部操作分区清楚。
- 按模板基准组织管理内容；基准标题、新建入口、预设信息、编辑/删除操作列、恢复默认及关闭动作布局一致、可读、可触达。
- 使用项目已有浅色tokens和审计按钮作为交互按钮视觉参考；明确窗口背景、分组背景、边线、文字、分隔、圆角、阴影、按钮尺寸、间距与响应式规则，避免卡片层层嵌套。
- 确保modal结构真正覆盖工作区，遮罩层级和滚动行为正确，背景不可交互；保留Escape/关闭按钮、焦点约束与触发器恢复。
- 只调整预设管理弹窗；导出、版本、批量导入、批注等其他弹窗不受全局modal规则牵连。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `neutral-controls-and-flat-toolbars`: 扩展预设管理为真正的独立modal窗口及其布局、样式和生命周期要求；其他弹窗仍保持原视觉。

## Impact

唯一根 `F:\App Location\Guanzhi Tong\Skill\MSDS-Engine`，目标页面 `http://127.0.0.1:5173/`。预计影响 `web/src/main.js` 中 `renderPresetManagerModal()`/modal生命周期以及 `web/src/styles.css` 中仅预设管理作用域的样式；不改数据库、预设存储语义、其它modal、DOCX内容或Docker部署。
