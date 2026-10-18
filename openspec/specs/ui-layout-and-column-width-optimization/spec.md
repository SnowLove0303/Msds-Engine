# ui-layout-and-column-width-optimization Specification

## Purpose
为 DOCX 原版式预览引入智能宽度自适应缩放（Fit to Width）引擎与宽幅对等网格分配机制，彻底根除预览截断与横向滚动条问题，提供高质量的同屏对照体验。

## Requirements

### Requirement: DOCX 原版式预览视口智能宽度自适应缩放（Fit to Width）
系统所有 DOCX 预览视口（`.docx-preview-shell`）SHALL 具备自动测量并计算页面缩放比例（Fit to Width）的能力，使渲染后的 Word A4 页面（`section.docx`）在视口内横向完全舒展呈现，严禁因页面固定像素宽度撑爆容器而产生水平横向滚动条。

#### Scenario: 初始载入与容器尺寸变化自动适应宽
- **WHEN** DOCX 文件在识别页或匹配页预览视口中渲染完成，或者视口尺寸发生变化时
- **THEN** 系统自动按 `scale = (containerWidth - 20) / pageWidth` 执行缩放变换，保证 A4 文档左右边距完整可见，水平横向滚动条完全消失。

### Requirement: DOCX 预览手动缩放调节控制器
系统 DOCX 预览视口顶部 SHALL 提供快捷缩放控制工具栏（包含“适应宽度”、“100% 原始比例”、“放大”、“缩小”），便于用户在全版速览与局部微字精读之间灵活切换。

#### Scenario: 用户切换缩放比例
- **WHEN** 用户点击缩放控制栏的按钮（如点击 100% 或 放大/缩小）
- **THEN** 预览页面实时按指定缩放率重新渲染，并提示当前缩放百分比。

### Requirement: DOCX 识别页面对等宽幅网格重构
系统 DOCX 识别页面 SHALL 将主视口调整为对等宽幅网格（结构化表格与 DOCX 预览各占约 50% 空间），为 DOCX 预览分配至少 750px~850px 的充裕横向宽度。

#### Scenario: 识别页面大屏对等并排
- **WHEN** 用户在识别页面查看已载入的 DOCX 文档
- **THEN** 左侧结构化数据表与右侧 DOCX 原版式预览并排平分工作区，两边均拥有宽广阅读视野。

### Requirement: 智能匹配页面多态对照模式（含原件 vs 标准对照）
系统智能匹配页面 SHALL 支持多态对照模式切换，包括：
1. **原件对照（DOCX 预览 50% vs 标准匹配 50%）**：以源文档全宽原版式直接对标标准模板插槽；
2. **数据比对（原始识别 50% vs 标准匹配 50%）**：对比识别表格与标准模板；
3. **三屏全览（原始识别 + 标准匹配 + DOCX 预览）**：三列并排且 DOCX 预览自动应用 Fit-to-Width 缩放。

#### Scenario: 用户切换至原件对照模式
- **WHEN** 用户在智能匹配页面切换至“原件对照”
- **THEN** DOCX 原版式预览与标准匹配表格各占据 50% 超宽视口，无需左右拉动即可直接逐行比对原版格式与标准模板填充内容。

### Requirement: 预览工具条行的换行自适应与不可覆盖

模板编辑器预览工具条行（`[data-toolbar-scope="editor-preview-heading"]`）SHALL 在容器宽度不足、其内部控件（模式切换、缩放控制、只读标记）发生换行时随内容增高，使全部控件完整可见、可点击；该行 MUST NOT 被相邻的预览容器或任何后续兄弟元素覆盖或裁切。宽度充足时该行 MUST 保持既有的单行紧凑高度，外观与交互不得回归。

#### Scenario: 窄容器下换行后控件全部可见
- **WHEN** 预览面板宽度不足以单行容纳模式切换、缩放控制与只读标记
- **THEN** 该工具条行自动增高以容纳换行后的全部控件，每个控件完整可见、可点击，无任何部分被遮挡

#### Scenario: 增高后不与预览容器重叠
- **WHEN** 工具条行因换行而增高
- **THEN** 其下方的 DOCX 预览容器顺延排布，工具条行的底边 MUST NOT 超出预览容器顶边，二者 MUST NOT 发生覆盖

#### Scenario: 宽度充足时保持单行紧凑高度
- **WHEN** 预览面板宽度足以单行容纳全部控件
- **THEN** 工具条行高度保持既有紧凑值（38px），控件排布与改动前一致

#### Scenario: 允许换行与固定高度不得同时存在
- **WHEN** 检查任一工具条作用域的样式契约
- **THEN** 不得存在「固定高度（`height` 与 `min-height` 同为固定像素）且允许换行（`flex-wrap: wrap`）」的组合；若该行允许换行，其高度 MUST 为自适应

### Requirement: DOCX 预览包装层底色与页面投影契约

系统的 DOCX 预览 SHALL 使渲染页面与其外层包装连续呈现同一白底。判定以**渲染后 DOM 的计算样式**为准：视口（`.docx-preview-shell`）、包装持有者（`.docx-preview-wrapper-holder`）与包装层（`.docx-preview-wrapper`）的计算背景色 MUST 为白（`rgb(255, 255, 255)`）；包装层 MUST NOT 保留三方库默认注入的深灰底色与 30px 内边距；页面节（`section.docx-preview` / `section.docx`）的计算投影 MUST 为轻微值（约 12% 透明度量级）。

#### Scenario: 三种预览视图页面四周无灰框
- **WHEN** 用户在识别页、匹配页或模板编辑器查看已渲染的 DOCX 页面
- **THEN** 白色页面四周 MUST NOT 出现深灰边带，页面与外层背景纯白连续

#### Scenario: 计算样式证明包装层为白且无 30px 内边距
- **WHEN** 对渲染后的预览取包装层与视口的计算样式
- **THEN** 其 `backgroundColor` MUST 为 `rgb(255, 255, 255)`，且包装层的上下内边距 MUST NOT 等于三方库默认的 `30px`

#### Scenario: 页面投影为轻微轮廓
- **WHEN** 取页面节的计算投影
- **THEN** 投影 MUST 为轻微值，MUST NOT 为三方库默认的 `rgba(0, 0, 0, 0.5)`

#### Scenario: 覆盖规则缺失时判据必须失败
- **WHEN** 包装层的白底覆盖规则被移除或失效
- **THEN** 验收判据 MUST 报告失败；判据 MUST NOT 仅检查样式表中是否存在某条规则文本，MUST 以渲染后计算样式为证据

#### Scenario: 自适应缩放作用于库实际生成的结构
- **WHEN** 用户切换自适应宽 / 100% / 放大 / 缩小
- **THEN** 缩放 MUST 作用于三方库实际生成的包装层与页面节，页面随容器缩放并居中，MUST NOT 因选择器不匹配而静默失效
