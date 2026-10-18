# Spec Delta

## ADDED Requirements

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
