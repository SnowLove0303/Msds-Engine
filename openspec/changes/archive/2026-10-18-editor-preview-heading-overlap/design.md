# Design

## Context

动机见 `proposal.md`。塑造本方案所需的现状事实（均已核对到行）：

- 预览标题行 DOM：`.panel-heading.compact.preview-heading-flex[data-toolbar-scope="editor-preview-heading"]`，内含
  - `.preview-tab-group`：两个模式药丸（`▤ 源文件原版式`、`📑 模板效果`）
  - `renderZoomBar('editor')` 产出的 `.preview-zoom-bar`：徽标 + `自适应宽` + `100%` + `－` + `＋` + 缩放文本 + `⤢ 展宽` + `📂 原件`
  - `.preview-lock`：`只读`
  见 `web/src/main.js:2373-2380` 与 `web/src/main.js:3742-3765`。
- 该行内联样式：`display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;`（`web/src/main.js:2373`）。
- 作用域规则固定高度：`[data-toolbar-scope="editor-preview-heading"] { min-height: 38px; height: 38px; padding: 0 12px; box-sizing: border-box; }`（`web/src/styles.css:3088-3096`）。
- 父容器：`.editor-layout .preview-panel { display:flex; flex:1 1 55%; min-height:0; flex-direction:column; }`（`styles.css:499-501`），且 `.preview-panel { overflow: hidden; }`（`styles.css:345`）。
- 紧随其后的预览容器：`.docx-preview-shell.editor-preview`，在编辑器布局下取 `flex:1 1 auto; min-height:0; height:auto`（`styles.css:500`），自带底色 `#dbe2e8`（`styles.css:345-346`）与渲染页阴影 `section.docx { box-shadow: 0 5px 15px rgba(23,35,46,.18) }`（`styles.css:426`）。
- 编辑器作用域高度审计结果：`editor-file-ribbon` 28px、`editor-section-heading` 38px、`editor-table-heading` 38px、`editor-preview-heading` 38px；四者均固定高度，**仅预览标题行启用换行**。

失效机制：标题行内容换行后超出被锁定的 38px 高度，但其自身布局高度不变；该行为静态（无定位）flex 子项，溢出内容不占据布局空间；紧随其后的预览容器按 DOM 顺序绘制在其之上，于是形成「粗边框压住按钮」。

## Goals / Non-Goals

**Goals:**

- 任意面板宽度下，预览标题行全部控件完整可见、可点击，且不被预览层覆盖。
- 宽度充足时保持既有单行紧凑高度与外观，不做视觉重设计。

**Non-Goals:**

- 不重构缩放控件本身（不把按钮收进「更多」菜单）。
- 不改动其余三个固定高度作用域（它们当前未启用换行，无此缺陷）。
- 不为识别页/匹配页的预览标题行做同类调整（结构与预览页相同，但同样未启用换行；若将来启用换行需一并纳入）。

## Decisions

### D1 用「自适应高度」替代固定高度

将作用域规则改为 `height: auto; min-height: 38px;`。

替代方案：(a) 移除 `flex-wrap: wrap` —— 控件会被挤出可视区或压缩变形，等于把「遮挡」换成「裁切」；(b) 缩短按钮文案 —— 治标，更窄时仍会溢出；(c) 给标题行加 `z-index`/定位 —— 只是把覆盖方向反转（改为遮住预览内容），溢出根因仍在。

选择自适应高度：根因是「固定高度容不下换行后的内容」，直接解除该约束即可闭环。

### D2 标题行声明 `flex-shrink: 0`

标题行作为 flex 子项，若被压缩会再次产生溢出。显式禁止收缩，使高度始终等于内容高度。

### D3 保留换行能力

窄屏下换行优于隐藏或裁切控件；配合自适应高度后，换行成为安全行为。

### D4 不做定位/层叠 hack

不引入 `position: relative` + `z-index` 之类写法。此类写法会让标题行压住预览，掩盖根因并增加后续排查成本。

### D5 其余作用域维持现状并登记

三个未启用换行的作用域保持不动（最小因果集）。其固定高度契约只有在「启用换行」时才会成为缺陷，故以审计结论登记，不做预防性修改。

### D6 回归守卫以静态契约断言实现

解析 `styles.css`，禁止「固定高度 + 允许换行」组合。真实排版与视觉无法用 jsdom 断言，按项目既有「UI 真实核验原则」由人工在浏览器以窄/宽两种宽度核验。

## Risks / Trade-offs

- [标题行高度随宽度变化] → 属换行的自然结果；单行宽度下高度不变（38px），已列为验收场景。
- [其余三个作用域在极窄宽度下可能溢出] → 已审计：未启用换行，暂不处理，登记为观察项。
- [静态断言无法覆盖真实排版] → 以人工浏览器核验补齐，并在 tasks 中固定核验步骤。
- [将来为其他预览标题行启用换行] → 守卫断言会在同一变更内提示同类问题。

## Migration Plan

单文件 CSS 修改（必要时微调一处内联样式）。前端构建产物更新后即生效；回滚为 revert 对应提交。

## Open Questions

- 是否在更窄宽度下把缩放控件折叠进「更多」菜单以维持单行：属体验优化，可延后，不影响本变更的规约与任务分解。
