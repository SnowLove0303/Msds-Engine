# MSDS Engine Web UI 三界面审查与 Agent 改造实施方案

日期：2026-10-17  
唯一项目根：F:\App Location\Guanzhi Tong\Skill\MSDS-Engine  
交付：问题证据、量测结果、具体修改方案、代码位置与验收清单，集中在本文件。  
实施对象：后续执行修改的 Agent。当前应用代码与用户数据未被本次审查修改。

## 1. 结论与实施目标

当前界面存在可以量测和复现的可读性问题。根因是**全局已切成浅色主题，后续新增工具条、下拉框和弹窗仍在硬编码深色表面，同时继续使用浅色主题的深灰文字变量**。结果不仅是风格分裂，而是部分可操作文字几乎与背景融在一起。

本次从真实页面取得 21 个代表性文字/背景配对，其中 14 个未达到普通文字 WCAG 2 AA 的 4.5:1 阈值。预设下拉框只有 1.28:1，“模板基准”标签只有 1.21:1。弹窗还实测存在焦点留在背景、Tab 进入背景导航、Esc 无法关闭的问题。

建议目标：**统一为专业文档工具的浅色工作界面，先恢复控件可读性，再整理操作层级和布局。** 延续现有深青色品牌主色，应用字体沿用当前系统无衬线字体栈；DOCX 内容字体和版式按原模板保留。

本文件是改造方案。后续 Agent 按第 9-13 节实施、按第 14 节验收；不要把“报告已完成”理解为界面问题已修复。

## 2. 范围、材料与技术栈

### 2.1 三张截图对应的范围

- 图 S1：[批量导出弹窗原图](<D:/APP/xwechat_files/wxid_no8adlqlwik622_2f03/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8/17e14a39bfcb9d7220a444c1d83ea08f.png>)。
- 图 S2：[预设管理弹窗原图](<D:/APP/xwechat_files/wxid_no8adlqlwik622_2f03/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8/f2d6299de98a23de04940f04cd3c230d.png>)。
- 图 S3：[模板编辑器预设模式原图](<D:/APP/xwechat_files/wxid_no8adlqlwik622_2f03/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8/a7449afe4f53ee5a3ef6ad7b7fb767ca.png>)。

红色框为用户标注，不属于产品设计。图片源于用户提供的页面画面；运行时复核使用当前安装目录对应的 5173 页面，独立诊断上下文，不刷新用户原有工作标签页。

主要覆盖模板编辑器工具区、预设编辑条、基准选择器、两个弹窗的选择/关闭流程。没有宣称完整审查全部识别、智能匹配、版本更新或仓库页面；共享组件修改仍需对这些页面回归。

### 2.2 栈与现有约束

- Vite 7 + 原生 JavaScript 字符串模板 + 单个主样式表。
- 没有 React、Tailwind 或现成 UI 组件库；本次改造不要求迁移框架或新增一套组件依赖。
- main.js 编排 UI 和事件；styles.css 提供全局和功能样式。
- render-utils.js 将 DOCX 内容样式转成 Web 展示；docx-preview 展示 Word 原版式。
- 项目内检索未发现 AGENTS.md、CONTRIBUTING.md、CODING_STANDARDS.md 或独立 design-system 文档；项目根已有 OpenSpec 与历史 UI/预设设计，操作边界同时沿用本次会话提供的规范。

本轮评审使用 better-interface，按其要求读取 accessibility/layout/writing/typography/colors/ui 六个领域技能，并用 contrast-check 出数值。参考 focus-and-keyboard、contrast 与 token-naming 的本地说明。技能用于组织证据，不授权更改业务行为。

## 3. UI 代码地图

| 对象 | 代码入口 | 主要样式来源 |
|---|---|---|
| 基准选择器与完成按钮 | [main.js:572](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js:572>) renderBaselineSelectorMarkup | [styles.css:2595](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css:2595>) 至基准按钮状态规则 |
| 预设编辑条 | [main.js:595](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js:595>) renderEditorBanner | [styles.css:1650](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css:1650>)、名称/切换/保存状态规则 |
| 统一导出弹窗 | [main.js:755](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js:755>) renderUnifiedExportModal | [styles.css:2377](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css:2377>) 及模板中的 inline style |
| 预设管理弹窗 | [main.js:918](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js:918>) renderPresetManagerModal | 模板 inline style + [styles.css:2710](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css:2710>) |
| 页面级工具栏 | [main.js:2000](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js:2000>) renderEditorToolbarButtons | .button 系列与浅色覆盖规则 |
| 全页面重绘 | [main.js:1323](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/main.js:1323>) renderApp | root.innerHTML 重建，影响焦点生命周期 |
| 文件名输入框 | .quick-export-name-input | [styles.css:1163](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css:1163>) |
| 文档内容排版 | [render-utils.js:28](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/render-utils.js:28>)、[render-utils.js:52](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/render-utils.js:52>) | 源 DOCX 字体/段落/单元格样式，不属于普通应用控件 |
| 单元格编辑与继承标记 | [render-utils.js:303](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/render-utils.js:303>) renderEditorCell | .excel-cell-editor、.preset-mode-cell-tag |
| 浅色主题 | [styles.css:270](<F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/styles.css:270>) 附近 :root 与 .button 覆盖 | --ink、--muted、--panel、--cyan 等 |

行号对应本次源码快照；实施前以函数名和选择器再次定位，避免其他 Agent 修改后沿用过期行号。

## 4. 分领域覆盖

| 领域 | 已检查证据 | 结果与边界 |
|---|---|---|
| 无障碍 | 弹窗 DOM、打开时焦点、Tab、Esc、可操作元素和对话框属性 | 有实际键盘问题；真实读屏和高对比度系统模式 Not verified |
| 布局 | 三张截图、1920 视口、320px 两个弹窗当前内容边界 | 工具区密集和分组问题；320px 当前样本关键按钮未越出弹窗，不报告未发生的裁切 |
| 文案 | 弹窗标题、格式标签、100% 承诺、基准状态与代码条件 | 有误导和工程术语堆叠 |
| 字体 | computed font-size/weight/family、11px 快捷文字、10px 多色标签 | 应用字阶与密度不统一；Word 字体单独保留 |
| 颜色 | computed 前景、祖先背景/opacity 合成，21 个现状配对与 7 个候选配对 | 14 个现状配对 WCAG 失败，另有 APCA 分歧 |
| UI 细节 | 深色/浅色混用、卡片嵌套、emoji、按钮和重复颜色、局部动效规则 | 主题一致性与组件规则需要收敛；生成中真实动画和触屏行为 Not verified |

## 5. 合并问题清单

以下每行是一类根因，避免把同一个文字变量错误拆成十几个独立问题。

| 级别 | 领域 | 位置 | Before：当前实现 | After：具体更改 | Why：用户影响 |
|---|---|---|---|---|---|
| HIGH | Colors | .preset-selector-dropdown、.preset-name-label、.baseline-label、.export-chip、.export-quick-link、状态标签及恢复按钮 | 浅色主题深字配深底，恢复操作橙字配白底；详见量测表 | 同一表面同时确定前景/背景，统一为浅色角色 token；去掉整块 opacity 压低 | 普通文字对比度不足，已影响识别和操作；未选中不等于不可用 |
| HIGH | Accessibility | 两个 modal renderer、renderApp 和关闭事件 | 无 dialog 语义，打开后焦点留在 BODY，Tab 进入背景，Esc 不关闭 | 原生 dialog/showModal 或等效完整控制；建立初始焦点、背景 inert、循环与返回焦点 | 模态交互没有阻止背景参与键盘操作，用户易误操作 |
| HIGH | Writing | main.js:786、824；基准/保存状态提示 | 文案“未完成阻断、100%真实可靠”，代码 isReady 却接受 editing；“已保存”也未说明范围 | 用真实状态与已确认保存结果表达；删除无依据的可靠性保证，完成规则冲突另列产品问题 | 用户可能误以为已完成审阅/已持久保存，界面承诺与行为不一致 |
| MEDIUM | UI | .preset-mode-banner、.unified-export-dialog、管理弹窗与全局 .button | 浅色工作台上嵌深色条和深色弹窗，部分按钮又是白底 | 编辑器操作区、管理和导出共用浅色表面、同一层级/边框/按钮规则 | 相邻功能像不同产品，操作层级难以建立 |
| MEDIUM | Layout | 预设条、file-ribbon、章节工具区 | 七个预设动作与文件名、基准切换、权限开关密集并列 | 建立页面动作、当前编辑上下文、章节动作三种职责；低频动作进入更多菜单 | 用户需要反复扫描大量控件，文档编辑主体被弱化 |
| MEDIUM | Typography | styles.css:2420、2507、2548、1753；管理列表 inline 字号 | 10/11/11.5/12/12.5/13px 混用，文件名等宽小字，多处短标签比实际内容更醒目 | 应用控制字阶收敛为 14/13/12px，文件名 13px 常规字体可换行，正文保持清楚行高 | 宽屏仍显细碎，中文名与文件名难以快速核对 |
| MEDIUM | Layout | 导出 .export-chip-group、.export-preview-tags 与管理分组 | 版本做成横排 chips，清单每行又叠三个彩色标签，管理分组嵌套多个卡片 | 基准分组下使用纵向复选行；版本名、目标文件和辅助信息对齐；去掉重复标签 | 选版本和核对结果重复阅读，颜色多但比较信息少 |
| MEDIUM | Writing/UI | 两个弹窗标题、说明、按钮、emoji | “交付物统一导出中心”“高清打印版·并发渲染”、火箭/楼房/灯泡混用 | 标题“批量导出”“预设管理”；格式“Word（.docx）”“PDF”；按钮“导出 ZIP（N 个文件）”；装饰图标删除 | 名称表达实现和宣传，增加模板化观感且没有帮助决策 |
| MEDIUM | UI/Colors | styles.css 两个 :root、后续硬编码、inline style、UI !important | 一个属性可受通用样式、局部规则、inline 与 !important 多次决定 | 保留一套当前主题角色，整理原规则而不是文件尾再叠补丁；只移除 UI 区域的冲突声明 | 局部修正容易漏改其他状态，颜色问题反复出现 |
| LOW | Writing/Layout | “留空则继承普通模式值…”与微型继承标识 | 多行重复占据编辑画布，却不呈现具体继承来源 | 统一术语“继承基础稿”，状态提示靠近字段；已有可靠值路由时展示继承值，否则不编造 | 降低重复视觉噪声，让用户理解当前修改的范围 |

删除、恢复等操作当前已有 window.confirm，不将它们错误报告为“没有任何确认”。它们的视觉位置和说明仍需调整。

## 6. 真实颜色量测

### 6.1 方法与判定

- 从真实页面取 getComputedStyle 的前景、背景、字号、字重和祖先 opacity。
- 对平面 rgba 背景及祖先 opacity 递归合成；在实际所在控件/卡片表面量测，不拿页面白底代替深色卡片底。
- 使用已安装的 contrast-check 逐配对计算 WCAG 比值和 APCA Lc。下表小数显示为两位；原始阈值判定未因四舍五入改变。
- 这些样本字号 10-15px，不属于大字，普通文字 WCAG 门槛为 4.5:1。未选中预设仍可操作，不能套用 disabled 豁免。
- APCA 为补充可读性指标，表中标签/短文案参考 |Lc|≥60；多行正文另参考 ≥75。APCA 建议失败不能单独称作 WCAG 不合规。
- 本次为 computed 样式合成，非截图像素采样；字形抗锯齿、原生 select 展开菜单、图像/渐变背景不在该数值覆盖内。

### 6.2 现状结果

| 位置 | 选择器或明确配对 | WCAG | APCA Lc | WCAG 结论 |
|---|---|---|---|---|
| 预设模式标识 | .preset-banner-badge | 2.29:1 | -18.54 | 失败 |
| 预设名称标签 | .preset-name-label | 2.75:1 | -20.66 | 失败 |
| 预设切换标签 | .preset-switch-label | 2.75:1 | -20.66 | 失败 |
| 预设选择器文字 | .preset-selector-dropdown | 1.28:1 | 0.00 | 失败 |
| 已保存状态 | .preset-status-indicator | 2.44:1 | -20.49 | 失败 |
| 模板基准标签 | .baseline-label | 1.21:1 | 0.00 | 失败 |
| 基准选择器文字 | .baseline-dropdown | 17.82:1 | -103.72 | 通过 |
| 标为已完成按钮 | .btn-toggle-baseline-complete | 1.29:1 | 0.00 | 失败 |
| 文件名输入 | .quick-export-name-input | 7.11:1 | -64.89 | 通过 |
| 导出快捷选择文字 | .export-quick-link | 2.67:1 | -18.22 | 失败 |
| 未选中但可选的预设 | .export-chip:not(.active) | 3.14:1 | -22.25 | 失败 |
| 已选中的格式 | .export-chip.active | 13.18:1 | -99.85 | 通过 |
| 未开始基准说明 | .export-baseline-empty-tip | 2.30:1 | -14.16 | 失败 |
| 基准/主体标签 | .export-pill-tag.tag-entity | 2.80:1 | -22.68 | 失败 |
| 基础稿标签 | .export-pill-tag.tag-cn | 2.91:1 | -24.71 | 失败 |
| PDF 标签 | .export-pill-tag.tag-pdf | 2.29:1 | -17.50 | 失败 |
| DOCX 标签 | .export-pill-tag.tag-docx | 6.51:1 | -56.23 | 通过 |
| 导出主按钮 | .modal-actions .button-primary | 5.50:1 | -82.51 | 通过 |
| 导出弹窗标题 | .unified-export-dialog .modal-title | 16.00:1 | -102.50 | 通过 |
| 管理弹窗编辑按钮 | #2b7188 / #ffffff | 5.50:1 | 77.20 | 通过 |
| 恢复系统初始预设 | #f59e0b / #ffffff | 2.15:1 | 41.78 | 失败 |

特别值得注意：

- .preset-selector-dropdown 的实际前景 rgb(32,42,51)，背景 rgb(8,19,34)，比值 1.28:1；这是截图中下拉文字像被隐藏的直接依据。
- .baseline-label 前景 rgb(94,104,114)，背景由 rgba(15,23,42,.6) 叠白底而成，约 rgb(111,115.8,127.2)，比值仅 1.21:1。
- .export-quick-link 还有 opacity:.85，已计入有效文字颜色；其 2.67:1 不能当作“次要文字可浅一些”略过。
- 管理页的“编辑”青字白底为 5.50:1，文字本身通过。它的问题是与深色卡片不统一；不能把每个白按钮都判断成对比度失败。
- DOCX 标签 WCAG 通过、APCA 约 -56.23，属于分歧，且只有 10px；应简化标签、提高可读性，但不误称 WCAG 失败。

### 6.3 拟采用配对已量测

| 角色 | 前景 | 背景 | WCAG | APCA Lc |
|---|---|---|---|---|
| primary text | #202a33 | #ffffff | 14.58:1 | 101.37 |
| secondary text | #5e6872 | #ffffff | 5.68:1 | 78.41 |
| accent text | #2b7188 | #eef5f7 | 4.98:1 | 70.45 |
| primary button | #ffffff | #2b7188 | 5.50:1 | -82.51 |
| status | #236748 | #edf7f2 | 6.18:1 | 76.83 |
| danger | #a43d48 | #fff5f5 | 5.88:1 | 75.89 |
| control edge | #7c8791 | #ffffff | 3.66:1 | 64.25 |

除最后一行是控件边界 3:1 门槛，其余候选均按普通文字计算。候选值通过不代表修改后的页面已经验收；仍需读取落地后的 computed 样式复测。

## 7. 字体与文档样式必须分开处理

应用层字体继续沿用：

```css
font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
```

现有 Inter 名称可保留在已安装/已加载时的字体栈中；本轮不要求下载新字体。没有必要为这个文档工作台增加展示型字体。

应用字阶建议：

| 角色 | 字号 | 字重 | 行高 |
|---|---|---|---|
| 页面标题 | 20px / 1.25rem | 600 | 1.3 |
| 弹窗标题 | 16px / 1rem | 600 | 1.3 |
| 主要控件、预设名称 | 14px / .875rem | 400/600 | 1.4 |
| 文件名、辅助正文 | 13px / .8125rem | 400 | 1.5 |
| 次要状态短标 | 12px / .75rem | 400/600 | 1.4 |

这是当前密集专业工具的建议尺度，不强迫所有文档正文也改成 14px。缩放后字体和按钮要能自然增高，禁止固定高度裁掉文字。

**保护范围：**

- render-utils.js 的 sourceRunStyle/sourceParagraphStyle 会承接 DOCX 的字体、字号、粗细和段落信息。
- Word 预览中的宋体/Times New Roman、黑字、表格边框是文档内容；不能因应用层改版而用全局通配符覆盖。
- 禁止使用 * { font-family: ... !important }、td { color: ... !important }、button,input,span 一锅端颜色等规则。
- 不删除保护文档标签、序号、合并和表格几何的 !important；本次只整理 UI 控件上的冲突。
- .docx-wrapper / section.docx 不继承新增 UI 皮肤。Word/PDF 的 XML、字体、打印效果和文件生成代码不因本轮视觉修改发生变化。

## 8. 目标版式

### 8.1 编辑器：让当前编辑上下文成为一个整体

推荐结构：

```text
Template editor                         Audit  Comments  Export

Baseline: [registered name v]  Preset: [preset name v]
Preset editing / save state       More actions  Return to base  Save preset

File name: [editable filename]              Advanced edit settings

Section navigation | Editable document | Preview / audit
```

实际界面使用中文业务标签，以上只是 ASCII 布局示意。

- 取消深色整条预设横幅与深灰基准容器。
- 基准切换、预设切换、保存状态属于一个上下文区。避免两个显著框让用户辨别正在操作哪个范围。
- 预设模式“保存预设”为上下文主操作；页面导出降为次级入口。普通基准模式恢复导出主操作。
- 新建、复制/另存为、管理放到低频操作区；删除与清空在更多菜单的危险分组，不与保存抢同一级位置。
- 两个“特殊情况”开关收到“高级编辑设置”可展开区域；默认收起但有明确入口。
- 文件名改为白底输入，深灰文字，不用深色终端式输入框。
- 标题/上下文在宽屏目标为紧凑两层；窄屏自然换行，不以缩小到 10px 来塞下。
- 保留章节导航和编辑/预览关系，不改变文档数据顺序。

### 8.2 批量导出：基准分组与纵向复选行

```text
Batch export                                      Close
Select prepared baseline versions and file formats.

Formats: [x] Word (.docx)   [x] PDF

Baseline A                           Editing / completed
  [x] Base draft
  [ ] Preset A1
  [ ] Preset A2

Baseline B                           Not prepared
  Prepare this baseline                         Edit

Files
  file_A.docx
  file_A.pdf

2 files / 1 ZIP                         Cancel  Export ZIP
```

- 使用注册基准的显示名称，不恢复写死的 CN/EN、公司×语言排列。
- 不展示“100%真实可靠”“高清”“极速并发”等没有当前用户决策价值的表述。
- 去掉连续三个彩色标签；基准/预设可在相邻文本列呈现，格式直接在文件名或轻量文字中表达。
- 不用整块 opacity 降低“未开始”分组，尤其其中“前往编辑”还是可用按钮；状态说明保持可读。
- 仅保留一处数量摘要。真实打包规则未统一前，文案必须反映实际执行；不得光改成“始终 ZIP”却仍给单文件。
- 空选择应清楚说明“选择至少一个版本”，并保留恢复选择的入口。

### 8.3 预设管理：可扫描的基准分组列表

```text
Preset management                     New preset   Close

Baseline A
  Preset A1              Publisher / configured overrides     Edit
  Preset A2              Publisher / configured overrides     Edit

Baseline B
  Preset B1              Publisher / configured overrides     Edit

More actions: Restore system presets                    Done
```

- 基准分组保留，但从“暗色大卡套小卡”改成浅色分组标题+列表行。
- 用空间区分组，行之间只保留必要分隔线。
- 长发布主体信息允许自然换行，左侧内容 min-width:0，右侧编辑操作保持可见。
- “新建预设”显示当前归属，用户能明确选择目标基准。
- “恢复系统初始预设”移入管理操作，使用危险确认文案；点击前明确是否会清空自定义预设，沿用真实行为。
- 导出与管理不要另起两套弹窗皮肤。

## 9. 具体 CSS 改造方案

### 9.1 沿用现有变量，补齐角色，不另造一套主题

在现有浅色主题块中整理以下角色。旧变量用作兼容入口，组件逐步改用角色别名；值只在主题定义处出现。这里只补本次实际使用的角色，不生成无人使用的十级色阶。

```css
:root {
  /* Existing light appearance */
  --panel: #ffffff;
  --ink: #202a33;
  --muted: #5e6872;
  --cyan: #2b7188;

  --color-bg-surface: var(--panel);
  --color-bg-subtle: #f8fafc;
  --color-bg-selected: #eef5f7;
  --color-text-primary: var(--ink);
  --color-text-secondary: var(--muted);
  --color-text-on-accent: #ffffff;
  --color-accent-solid: var(--cyan);
  --color-accent-text: var(--cyan);
  --color-border-control: #7c8791;
  --color-border-subtle: #d8dde2;
  --color-focus: var(--cyan);
  --color-success-text: #236748;
  --color-success-bg: #edf7f2;
  --color-danger-text: #a43d48;
  --color-danger-bg: #fff5f5;
}
```

色值来自第 6 节的候选量测。浅色分隔线可使用 subtle；输入控件不能只靠很浅的线作为唯一边界。只读/禁用状态使用文字说明和语义属性，不能误把可操作项做成不可读的 disabled 样式。

### 9.2 在原选择器处替换，而不是 styles.css 尾部追加覆盖

以下示意应落回原声明或整理后的组件文件，配合删除同属性的 inline style。保留 class/data-action 兼容。

```css
.preset-mode-banner,
.normal-mode-banner,
.baseline-switch-group {
  color: var(--color-text-primary);
  background: var(--color-bg-subtle);
  box-shadow: none;
}

.preset-name-input,
.preset-selector-dropdown,
.baseline-dropdown,
.quick-export-name-input {
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-control);
  font: inherit;
  min-height: 2rem;
  min-width: 0;
}

.preset-name-label,
.preset-switch-label,
.baseline-label {
  color: var(--color-text-secondary);
}

.export-chip {
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
  box-shadow: none;
}
.export-chip.active {
  color: var(--color-accent-text);
  background: var(--color-bg-selected);
  border-color: var(--color-accent-solid);
  box-shadow: none;
}

.preset-status-indicator.status-clean {
  color: var(--color-success-text);
  background: var(--color-success-bg);
}
.export-baseline-card.is-unstarted {
  opacity: 1;
}
```

还要删除 .btn-toggle-baseline-complete 的灰底灰字 !important 组合，按按钮等级使用中性文字，完成态使用已测的 success 配对。状态没有变化时，不加发光圆点或额外动画。

### 9.3 两个弹窗共享尺寸与滚动

给管理弹窗增加明确的组件 class；统一导出 class 可保留。优先采用原生 dialog，以下 .app-dialog 为共享视觉类，不要求替换现有业务函数名称。

```css
.app-dialog {
  box-sizing: border-box;
  width: min(48rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: .5rem;
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
  box-shadow: 0 12px 32px rgb(15 23 42 / .16);
}
.app-dialog[open] {
  display: flex;
  flex-direction: column;
}
.app-dialog::backdrop {
  background: rgb(15 23 42 / .35);
}
.app-dialog__header,
.app-dialog__footer {
  flex: none;
  padding: 1rem 1.25rem;
}
.app-dialog__body {
  min-height: 0;
  padding: 1rem 1.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.app-dialog__header {
  border-bottom: 1px solid var(--color-border-subtle);
}
.app-dialog__footer {
  border-top: 1px solid var(--color-border-subtle);
}
.app-dialog__body input,
.app-dialog__body select {
  font-family: inherit;
}
.app-dialog__body .file-name {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  font-size: .8125rem;
}
:where(.app-dialog, .preset-mode-banner, .baseline-switch-group)
  :focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
@media (max-width: 40rem) {
  .app-dialog__header,
  .app-dialog__footer {
    flex-wrap: wrap;
    gap: .5rem;
  }
}
```

不能只换 class 就算完成：当前 main.js 的弹窗头部/页脚背景、标题/计数字色、宽度等 inline style 必须同步移除，否则仍压过新样式。

遮罩暂不使用重度 blur。原有模糊如确有保留理由，应测背景读数和 reduced-motion/性能；本轮优先删除，减少装饰与渲染成本。

## 10. 对话框行为与重绘处理

优先采用 <dialog> + showModal()，关联标题；关闭按钮用“关闭批量导出”或“关闭预设管理”的可访问名称。打开后聚焦标题或第一个合适控件；关闭返回原触发按钮。

原生 dialog 可以处理背景不可交互与 Esc；若保留现有 div overlay，必须完整实现等价的 role、aria-modal、标题关联、背景 inert、焦点循环和恢复，不能只加两个 ARIA 属性。

**现有 renderApp 会替换 root.innerHTML。** 这会销毁当前焦点元素与 dialog 节点。实施 Agent 必须处理：

- 首次打开和选择变更分别处理，不能每次勾选都把焦点送回标题。
- 重绘前保存当前控件的稳定 key（data-action、target-key、preset-id 等），重绘后恢复对应控件焦点。
- native dialog 新节点插入后调用 showModal()，不能仅渲染 open 属性就宣称背景已经 inert。
- 关闭时根据稳定触发标识寻找当前 DOM 节点，不能只调用已被销毁节点的旧引用。
- 生成中是否允许关闭、如何取消沿用当前真实任务能力；没有取消能力就不能写“已取消生成”。

## 11. 文案与布局必须同时改的项目

| 现状 | 建议 | 实施说明 |
|---|---|---|
| MSDS 交付物统一导出中心 | 批量导出 | 简短标题即可 |
| PDF（高清打印版·并发渲染） | PDF | 内部转换机制不占主界面 |
| 基础底稿（主版本） | 基础稿 | 与管理、编辑页面同名 |
| 未完成自动阻断，保证 100% 真实可靠 | 仅可导出已准备好的基准版本 | 具体资格条件以实际规则为准，文案不能掩盖 editing 可导出的冲突 |
| 立即打包导出全部 N 份交付物 | 导出 ZIP（N 个文件） | 仅在确实生成 ZIP 时使用 |
| 专属覆写 N 项 | 覆盖配置 N 项 | Object.keys 数量不等于已成功应用数量 |
| 留空则继承普通模式值 | 继承基础稿 | 在字段或上下文提供一次完整解释 |
| 已保存 | 已保存 / 当前会话暂存 | 根据真实保存位置和结果显示，不由 UI 自行承诺持久化 |
| 恢复系统初始预设 | 恢复默认预设 | 危险确认必须明确“自定义预设将被清空”等真实后果 |

当前导出可选条件接受 status==='editing'，与“未完成编辑自动阻断”的文字有冲突。本次 UI 报告不授权 Agent 擅自重写完成状态或数据保存；应关联既有多基准方案处理，UI 先删除绝对化保证并正确显示现状。

## 12. Agent 文件修改清单与边界

| 文件 | 必须做 | 不得顺带做 |
|---|---|---|
| main.js | 整理三个 render 函数和 toolbar；移除 UI 硬编码颜色；统一布局类与文案；补弹窗生命周期和焦点 | 改模板语言路由、文件内容、归属判断、审计规则或批量格式语义 |
| styles.css | 整理浅色主题、按钮/输入/弹窗/预设条/基准选择器；修复全部配对状态；控制字阶与间距 | 删除所有 !important；全局覆盖 DOCX 字体、颜色与表格几何 |
| render-utils.js | 仅在必要时调整 UI 继承标记的文案/无障碍说明 | 改 sourceRunStyle/sourceParagraphStyle 的文档样式输出 |
| docx-engine.js、msds-db.js、pdf-converter.js | 本轮 UI 改造无需修改 | 为改外观重写引擎、迁移 DB、重装转换器 |
| package.json | 默认无需改动 | 引入新框架/大型 UI 库以替代几组 CSS |
| OpenSpec 现有变更 | 实施前继承相关设计、按实际完成项记录证据 | 另建第二套正式项目、端口、预设库或重复任务体系 |

**必须保留的事件契约：**

- #baseline-select、#switch-editing-preset-select、#editing-preset-name-input；
- data-action：open-unified-export-modal、close-unified-export-modal、confirm-unified-export；
- open-preset-manager-modal、close-preset-modal、edit-preset-from-manager；
- save-current-preset、create-new-preset、save-as-new-preset、clear-all-preset-overrides、delete-current-preset、exit-preset-editing；
- 导出格式/版本复选框的 data-action、data-format、data-target-key 和 checked 状态。

改 DOM 布局后必须核对监听仍然命中，不得用外观相似的新按钮代替原动作却不接事件。

## 13. 实施顺序

1. 记录当前三界面截图与源码基线，保留工作树原有修改。
2. 在原主题/选择器位置统一前景背景，移除三个 UI 区域的 inline 配色和冲突 !important；先完成可读性。
3. 整理预设条和基准选择器，合并上下文、收纳低频动作与高级开关。
4. 两弹窗共享浅色结构，清单改纵向，减少卡片、标签和 emoji，落实第 11 节文案。
5. 补 dialog 语义、焦点与 Esc，并处理 renderApp 重建节点时焦点丢失。
6. 复测真实 computed 配对，再对功能入口和输出不变性做有针对性的验收。
7. 清理本轮产生的废弃 UI 样式，不保留一套“旧暗色规则+新白色补丁”。

最小交付必须覆盖 S1、S2、S3 三个界面和对应可操作状态；只改弹窗背景或只改某个按钮不算完成。

## 14. 验收要求

### 必须通过

- 三界面沿用同一浅色主题；预设条/基准控件没有残留深色小岛。
- 第 6 节失败配对全部重新读取并量测，普通文字达到 4.5:1；UI 边界/焦点按其相应角色检查。APCA 数值一起报告，但不混淆为 WCAG 判据。
- 未选中项清楚可读且可操作；禁用状态有真实 disabled/aria-disabled 与原因。
- 主操作、次操作、危险操作各有固定样式；预设编辑时保存入口单一清晰。
- 两弹窗打开后背景不进入 Tab 顺序；Esc、Tab/Shift+Tab、关闭后回焦均可用。
- 勾选导出格式/预设后焦点不无故跳回页面；文件数与选择保持同步。
- 长基准名、长预设名、长公司名、长文件名可读；不依赖仅鼠标可见的 tooltip 才能获取必要信息。
- 在 1920、1366、960、320 CSS px 和实际 200% 浏览器缩放下检查。文档表格允许自身滚动，但按钮与操作区必须可达。
- 验证空选择、未开始基准、加载/错误、保存成功/失败状态；未运行的状态不能写成通过。
- Word/PDF 文件内容、模板字体、表格结构和现有数据不因 UI 改造改变；对已有未提交业务代码保持兼容。

### 交付证据

实施 Agent 在本文件末尾补充：
- 实际修改的文件/函数和前后截图；
- 修改后配对的前景、真实背景、WCAG 与 APCA；
- 入口、选择、保存、返回、关闭和导出的实际检查结果；
- 仍未验证的设备/状态；
- 按需执行的构建/现有回归结果。禁止用“构建成功”代替界面量测与操作验证。

## 15. 本次实际检查记录与限制

已执行：
- 在 5173 独立浏览器上下文打开当前编辑器，进入预设编辑、打开导出/管理弹窗。
- 读取真实字号、颜色、背景链与 opacity；运行 contrast-check 计算 21 个现状和 7 个候选配对。
- 导出弹窗打开时 activeElement 为 BODY；按 Tab 聚焦背景“DOCX 识别”；按 Esc 弹窗仍存在。
- 两个弹窗缺 role/aria-modal，背景 main.inert=false。
- 320×800 当前内容下，导出弹窗宽约 304px、管理弹窗约 300.8px，检查的按钮没有越出弹窗边界。本次不声称该样本发生了按钮裁切。
- 未触发下载、删除、恢复默认、完成状态或保存用户预设。

Not verified：
- 真实读屏软件、Windows 强制色模式、触屏 hover、实际 200% 浏览器缩放。
- 20 条以上预设与极长名称的运行测试。
- 生成中/转换失败状态、真实 PDF 排版和输入法组合输入。
- 全部识别/智能匹配/仓库/版本页面。
- 原生 select 展开菜单和任意图像/渐变文字背景的对比度。

未执行产品构建和应用测试套件，因为本轮只新增报告，没有实施 UI 代码。实际浏览器检查与量测如上，不将未执行项表述为通过。

## 16. 源码基线与记录

本次记录的文件哈希：
- main.js：DAB2E65E16DD0A0082F646DA5913C6F811A8714C6BC9F5DF762E6F2733FA8386
- styles.css：F4491934F8899D151591420D067ABB5CA2D9CC062EBD8989AA4E72889AFEC928
- render-utils.js：F93AE82D6E11B453576890AFCF2D54FF6B7F6311BECB673C5600FD9F70722648

工作根与 OpenSpec 根均为 F:\App Location\Guanzhi Tong\Skill\MSDS-Engine，来源 nearest。已有 msds-recognition-editor-four-variants 关联基准/预设流程；本次只写本份报告，没有新增平行变更、修改代码或归档现有开发任务。

## Verdict

**Block。** 当前样本存在已量测的普通文字对比度失败和已复现的模态键盘问题，应完成上述修改后再交付该界面。这个结论覆盖第 2/4 节的实际审查范围；Not verified 项不包含在通过声明中。报告交付本身已完成。

