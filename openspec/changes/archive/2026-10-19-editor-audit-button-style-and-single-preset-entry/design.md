# Design

## Context

2026-10-19 用户要求记录两个问题，未要求本轮实施。旧变更已归档至 `openspec/changes/archive/2026-10-18-unify-neutral-controls-and-flat-toolbars/`，durable规范为 `openspec/specs/neutral-controls-and-flat-toolbars/spec.md`；无活动变更，故建立本后续记录，不重开/篡改归档。

截图：`fd76fe755ae617316618da0a052166d9.png`，六个红框以2026-10-19最新标记为准。当前源码仍在 renderEditorBanner() 与 renderEditorToolbarButtons() 各输出一个 `open-preset-manager-modal`。参考按钮为 renderEditorToolbarButtons() 中 `button[data-action="run-audit"].button.button-secondary.button-sm`。

## Goals / Non-Goals

Goals：一个预设管理入口；六组标记控件使用“审计”按钮视觉规范（边框线+字体+白底）。

Non-goals：全站换肤、改导航/页面标题/章节列表/文档/识别匹配/弹窗、修改数据和引擎、发布或派发。本轮仅记规范。

## Decisions

### 问题1：两个预设管理合并为一个

实施默认保留右上主操作区入口（与审计、批注、导出同组），删除上下文栏 `.normal-banner-actions` 内重复入口。不通过仅隐藏重复DOM来验收；主稿/预设/页眉页脚分支都检查，一个入口始终可达。预设模式目前toolbar分支可能不输出管理，需补足，不能删掉上下文入口后导致某模式零入口。管理弹窗、新建/编辑/保存逻辑保留。

### 问题2：以当前审计按钮为参照，禁止另定样式

实现前读取并记录当前审计按钮实际computed：background、border宽度/颜色/样式、font-family/size/weight/color、height、padding、radius、hover/focus/disabled；本轮不猜测固定#111/#8a8a8a/28px等新值。源码基础 `.button-secondary`、`.button-sm` 仅为定位，最终参照是页面实际呈现。冻结该参照后复用局部class/token；不能先改审计按钮再用它宣称其他控件一致。

| 最新红框组 | 定位 | 内容 |
| --- | --- | --- |
| 1右上操作 | renderEditorToolbarButtons / editor内的.page-band .band-actions | 审计、批注、导出、预设管理、恢复模板；导出也改为审计同款白底边框，不再保留旧蓝色例外 |
| 2上下文动作 | renderEditorBanner / .normal-banner-actions；预设模式对应操作 | 进入预设编辑；重复管理按问题1删除；预设模式等价按钮使用参照 |
| 3文件名 | #quick-export-name-input、reset-filename-to-standard | 输入框边框/字/白底与审计协调，保持文本左对齐、宽度按内容用途，不强制等宽 |
| 4基准 | renderBaselineSelectorMarkup / #baseline-select、toggle-baseline-complete | select及完成按钮统一外观，选中/完成信息保留 |
| 5编辑header | [data-toolbar-scope="editor-table-heading"] .heading-pills | Section、行数、恢复、说明、追加、清空、通过；前三类状态span保持非交互，不为统一外观加假点击或tabstop |
| 6预览header | [data-toolbar-scope="editor-preview-heading"]、renderZoomBar('editor') | 模式、缩放、展宽、原件；模板效果badge、自适应文字、只读均是状态元素，不变成按钮 |

同组按钮/输入/select高度和字形对齐，以审计参照为准；图标继承文字色。保留交互类型差异、选中标识、焦点和禁用语义、危险操作确认；不以保留蓝绿红填充作为例外。wrapper不再重复画一圈边框，分段控件单圈外框+内隔线。状态元素可用相同字体/底色但不能伪造可点击性，冗余状态显示可收敛。

### 样式作用域及旧规范冲突

最新截图新增右上操作区，因此替代旧durable规范中“top-right export stays blue”这条对编辑器的限制。左侧Section标题本次未框选，保持不变。编辑器主体及其工具条以opt-in scope限定；不可改全局.button、:root、通用zoom控件以影响其他页面。仅这一局部需求更新，识别页已恢复样式受保护，不再次调整。

## Risks / Trade-offs

- 删除入口导致预设模式无入口 → 验证各editor渲染分支均恰好一个管理按钮。
- “同款”误变成全站硬编码重写 → 冻结实际审计样式并局部复用，只改六组。
- span状态误做按钮 → 保留语义，不增加focus/点击；样式按状态用途收敛。

## Verification / Handoff

将来实施时需在5173主稿/预设模式、普通Section/页眉页脚切换后验证管理按钮数量为1，点击可开、关闭返回焦点。对照六组控件computed边框/字体/背景及高度，截图验证无组框套框；检查识别/匹配/nav/文档未变，运行相称语法/build。未执行这些验证前全部任务保持未完成。

当前仅记录，不向Antigravity线程发消息，不开始apply，不宣称代码已修复或归档。

## 详细实施说明（2026-10-19补充）

### A. 对“统一参考审计按钮”的准确解释

统一的是控件视觉语言，不是把所有元素都改成同宽按钮。按钮保留居中文字，文件名输入保持左对齐，下拉框保留箭头和选择行为；状态span保持非交互。文字内容、控件用途、必要宽度、tab顺序和业务事件不因样式统一而改变。

参照必须限定为模板编辑器右上 `[data-action="run-audit"]`，不是下方“审计”面板标题，也不是对话框内其他次级按钮。优先测量可见主稿中的该按钮，记录浏览器视口/缩放、源码版本或文件hash、截图、selector、computed值，冻结为本轮reference。不能用上一轮全中性`#8a8a8a/#111`规则替代当前较轻的审计按钮样式。

| 属性 | 当前源码线索（不是已测computed结论） | 实施要求 |
| --- | --- | --- |
| DOM/class | renderEditorToolbarButtons()内 `.button.button-secondary.button-sm` | 以这一实际可见按钮为reference，保留本按钮现有样式 |
| 默认底色 | `.button-secondary` 为 `#ffffff` | 六组内可用按钮/输入/select均同款白底，禁止蓝色导出、红色清空、绿色模式等默认填充例外 |
| 默认边框 | `.button` 1px solid，`.button-secondary` 引用 `--border-base`（当前根定义#cbd5e1） | 读取实际四边色/宽/style，控件不能仍保留更深#8a8a8a边框；不重复描边或用阴影模拟第二圈 |
| 默认文字 | `.button-secondary` 引用 `--text-secondary`（当前#475569） | 采用实际审计文字色，用户口中的黑字按该可见深色字体理解，不擅自改为纯#000或#111 |
| 字号/字体 | `.button-sm` 11.5px，系统字体栈由root继承 | freeze实际font-family/size/weight/line-height；同组不能混用11/12/13px造成漂移 |
| 高度/圆角 | `.button-sm` min-height28px、radius7px | 测量实际border-box高度与圆角，同排等高；不能另推6px/4px圆角体系 |
| padding/gap | `.button-sm` 0 10px；button gap8px | 普通文字按钮复用reference；图标按钮允许等高的适当紧凑横向padding，不强制45px等宽 |
| 阴影/焦点 | `.button` 基础微阴影；focus-visible继承outline | 依实际reference决定是否保留微阴影；焦点不删除，不能给其他按钮额外蓝色光晕/强投影 |

以上CSS线索在2026-10-19读取，最终值受cascade和inline影响，必须实测后记录，不把表内值直接当网页验收通过。若实际审计样式与截图有差异，记录差异来源；不主动改变reference去迎合其他旧规则。

### B. 问题一：重复管理入口的精确改法

现有两个可见来源：

1. `renderEditorToolbarButtons()`：右上主操作区的 `button[data-action="open-preset-manager-modal"]`，主稿分支有，预设编辑分支当前仅审计/批注/导出。
2. `renderEditorBanner()`：`.normal-banner-actions` 内相同data-action的“预设管理”，位于“进入预设编辑”后。

默认保留第一处，在主稿与预设模式的统一主操作渲染路径都输出一次；第二处从模板字符串移除，不设置display:none蒙混去重。上下文栏保留“进入预设编辑”和必要的预设上下文动作。页眉页脚编辑分支复用同一主工具栏，不得额外生成第三处。

功能保护：保留既有打开/关闭管理函数、event delegation、baseline归属、新建/删除/编辑操作及触发器focus恢复。若重复入口曾导致绑定特例，仅调整必要的触发器定位；不要顺带重构管理数据。验收计数限定编辑器页面工具栏/上下文区，不能误把管理弹窗内部的编辑按钮或隐藏模板字符串计为重复入口。

计数必须同时满足：主稿页工具栏DOM管理入口数=1；可见数=1；可聚焦且aria未禁用；预设模式和页眉页脚模式同样。点击后确实打开原管理弹窗，Escape/X/关闭后回到唯一入口。隐藏旧入口但DOM仍两个不算完成；某模式入口数为0也不算。

### C. 问题二：逐控件改动矩阵

| 组 | 控件/状态 | 精确定位 | 改动及保留行为 |
| --- | --- | --- | --- |
| 1 | 审计 | editor顶栏 `[data-action="run-audit"]` | reference本体保持原样，运行规则审计行为保留 |
| 1 | 批注及数量 | `[data-action="toggle-review-drawer"]` | 同reference；保留实时数量、打开批注行为 |
| 1 | 导出 | `[data-action="open-unified-export-modal"]` | 取消本区域primary蓝底/白字，改reference；保留打开导出及就绪校验，弹窗内部不随之换肤 |
| 1 | 预设管理 | 顶栏 `[data-action="open-preset-manager-modal"]` | 唯一保留入口，同reference，不再quiet透明无框 |
| 1 | 恢复模板 | `[data-action="reset-all-template"]` | 同reference；危险性用原确认流程和文字表达，不能取消确认 |
| 2 | 进入预设编辑 | banner `[data-action="enter-preset-mode"]` | 同reference，保留模式切换；旁边重复管理删除 |
| 2 | 预设编辑时保存/另存/清空/返回 | banner内save-current-preset/save-as-new-preset/clear-all-preset-overrides/exit-preset-editing | 同一语义区域切换后的等价动作也按reference，不能切到预设模式又出现蓝/红/透明按钮；保留保存和清空确认语义 |
| 3 | 导出文件名输入 | `#quick-export-name-input` | 同reference边框/字体/白底/高度，保持左对齐与可输入；长名不得撑爆条；两处editor渲染分支都检查 |
| 3 | 文件名重置↺ | `[data-action="reset-filename-to-standard"]`，仅该文件名组 | 去20px高度等inline冲突，等高图标按钮，保留恢复规范命名 |
| 4 | 模板基准select | `#baseline-select.baseline-dropdown` | 同款灰边/字体/白底，保留箭头、键盘选择、当前项与独立草稿切换 |
| 4 | 标为已完成/已完成 | `[data-action="toggle-baseline-complete"]` | 去绿色完成按钮外观，与reference一致；文字/勾表意，保留真实状态与导出资格逻辑 |
| 5 | Section1、10行、通过/问题数 | `.heading-pills > span.pill` | 非交互状态：字体与白底协调，去蓝绿硬底/过深边框；不添加点击、role=button、tabindex；必要异常仍明确可读 |
| 5 | 恢复本节 | `[data-action="reset-current-section"]` | 同reference，保留只恢复本节的确认及record-id |
| 5 | 说明行/追加行 | `[data-table-action="add-note-row"]` / `[data-table-action="add-row"]` | 同reference，不丢record-id与追加位置 |
| 5 | 清空本节填写值 | `[data-action="clear-current-section-values"]` | 取消局部danger红字/红框，保持reference；保留清空确认，不能扩大到全模板 |
| 6 | 源文件原版式/模板效果 | `[data-editor-preview-mode="source"]` / `template` | 清理inline蓝绿底/白字；各按钮同reference，选中以勾/下划线/字重表达，不改变预览源 |
| 6 | 绿色“模板效果”显示牌 | `.preview-type-badge.badge-template`，仅editor工具条 | 是只读类型标签，不是按钮；去残留绿胶囊，必要可并入模式信息避免重复 |
| 6 | 自适应宽/100%/−/+ | editor zoom group内 `[data-zoom-action="fit"/"100"/"out"/"in"]` | 各自reference外观，保留操作与真实倍率；active不得恢复蓝色填充 |
| 6 | 自适应或倍率文字 | `.zoom-text` | 非按钮，采用协调字体，保留真实数值；冗余时可合并，不能显示假倍率 |
| 6 | 展宽/还原 | `[data-zoom-action="toggle-expand"]`，editor限定 | 同reference，保留展开与还原状态及文案 |
| 6 | 原件 | `[data-action="pick-preview-doc"]`，editor工具条限定 | 同reference，保留DOCX/PDF/DOC选择，不打开无关输入器 |
| 6 | 只读 | editor header `.preview-lock` | 保留只读语义，字体/底色协调；不伪造按钮或加入tab顺序 |

### D. 交互状态与对齐细则

- 默认态是审计reference的实际边框、字体和白底；不为主/危险按钮保留例外，彩色emoji若造成字形不一致可使用同色图标，保留可访问名称。
- hover/focus/pressed优先复用reference现有状态，不另设计几套primary/danger交互色；本次用户指定默认白底，不因hover需要擅自重画全站reference。
- 切换型按钮selected需明确标记且有aria-pressed/aria-selected等匹配语义；不把所有按钮设为相同状态而失去可辨识性。完成按钮文字反映真实完成状态。
- disabled保持原生disabled/aria-disabled，不用pointer-events或CSS外观假装禁用；禁用状态不强制伪装为可用的审计按钮。
- 同排控件外边框高度和垂直中线一致，目标误差<=1 CSS px；输入文本左对齐，按钮文字居中，图标视觉中心对齐。不同字长允许宽度不同。
- 不用固定工具栏高度裁切多行控件，长文件名/基准名不导致横向全局溢出；必要只在六组内适当收缩或换行，不重排整个编辑器/预览宽度。

### E. 去框细则与局部代码组织

`.baseline-switch-group`、`.preview-zoom-bar` 等纯分组容器无外框/替代阴影，内部按钮/输入各自单层审计式边框。两个模式切换优先采用两枚独立同款按钮+组间距；若采用分段组则只允许单圈外边和内隔线，不能内外双圈。正常focus outline、面板分隔线、DOCX表格线不算冗余框，不得删除。

现有scoped规则里大量 `#8a8a8a/#111/6px/11px/12px/!important` 与当前审计11.5px/7px/更浅边框竞争，应在原局部规则中归并替换，而非末尾再加一组更高优先级覆盖。将reference的局部可复用样式应用到六组，顶栏增加明确editor-only marker，避免headerBand在识别/匹配页复用造成泄漏；renderZoomBar('inspect'/'matching')保持原样。

不允许修改全局root palette、通用.button系列定义、全局mode/zoom/nav或全站filter来完成局部一致性。只读状态标签如需要调整应在editor对应scope，不跨到其他页。源文件行号随改动变化，实施需复核函数/selector而不是依赖历史行号。

### F. 验收矩阵、证据与不通过条件

| 验收面 | 操作/证据 | 通过条件 |
| --- | --- | --- |
| 入口 | 主稿->预设->主稿；普通Section->页眉页脚->返回；打开管理->关闭 | 每个状态1个DOM入口、1个可见可聚焦入口，管理仍正常，关闭focus回唯一按钮 |
| reference冻结 | 改前采集审计默认和hover/focus等computed及截图 | reference有实际测量，不是从源码推测或改后自证 |
| 六组默认样式 | 每个有代表性的按钮、输入、select和span记录selector/tag/role/bg/border/font/height/radius | 可用交互控件与reference一致；有意保留的类型差异注明，不漏文件名重置、完成状态、绿色badge/只读 |
| 选中/禁用 | 切换模式、fit/100、展开/还原、未就绪状态 | 可见且语义正确，不恢复蓝绿红特例或丢失选择状态 |
| 功能保护 | 点击批注/管理/导出、文件名编辑/重置、基准选择、说明/追加/恢复/清空、预览缩放 | 在可丢弃测试数据上原行为保留；不对真实用户文档执行清空/恢复测试 |
| 去组框 | DOM及截图检查父/子边框/阴影 | 不存在wrapper+内部控件双层装饰；focus与表格/面板边界未损坏 |
| 区域外 | 对照nav、Section搜索/列表/标题、文档单元格、识别空态/载入、matching、dialogs | 无颜色/字体/尺寸泄漏，不把最新局部范围再扩大 |
| 双视口 | 1920x1080与1366x768，读取实际innerWidth/Height和scale | 同组对齐、无遮挡或控件孤立换行；截图尺寸不能代替真实CSS视口 |
| 工程 | changed JS syntax、build、必要相关既有回归 | 给真实输出和警告，不能仅凭build替代UI验收 |

不通过例：管理入口display:none但仍重复DOM、预设模式无入口、导出仍蓝底、完成仍绿字、清空仍红框、zoom仍小一号、输入边框仍深灰、badge残留绿色、组外又一圈框、改到了识别/匹配页或文档字体。任何失败应记录具体控件/状态，不整项勾选。

证据建议字段：view/mode/section/viewport/selector/tag/role、referenceId、背景/文字/四边宽色、font-family/size/weight/line-height、height/radius/padding、centerY、selected/disabled/focus、对比截图路径、实际结果与未验证原因。样式对照以显示中的实例为准，不用隐藏DOM默认值冒充。

### G. 当前交付状态

本次详细化只更新proposal/design/spec/tasks，无应用实现、无外部派发、无新的测试通过声明。全部待执行项保持未完成；未来实施后仍需真实5173验收，不能把文档完整或CLI的planning complete当成问题已修复。
