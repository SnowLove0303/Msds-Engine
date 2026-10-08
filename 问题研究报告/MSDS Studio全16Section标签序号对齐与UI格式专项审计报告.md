# MSDS Studio 全 16 Section 标签、序号对齐与 UI 格式专项审计报告

**项目：** MSDS Studio  
**审计日期：** 2026-10-07  
**审计范围：** Web 识别表格、智能匹配表格、模板编辑器共用的标签/序号渲染与表格 UI 规则  
**审计方式：** 源代码、CSS、模板结构和浏览器实际 DOM 共同核查  
**审计目标：** 确认 16 个 Section 是否满足序号和标签首字对齐、父子标签对齐、换行续行对齐、标签格垂直居中、文本保持水平，以及标签和值字体角色一致。

## 一、审计结论

当前 Web 表格的整体结构已经具备序号、父级标签、子级标签和值格的基本显示能力，但尚未满足“16 个 Section 统一对齐、统一垂直居中、换行续行保持基线、标签和值使用正确字体角色”的要求。

已经由浏览器实际 DOM 测量确认的全局问题有：

1. 结构化表格的标签单元格实际 computed `vertical-align` 全部为 `top`，没有实现垂直居中；
2. 序号采用可变宽度 inline 文本，导致不同位数的序号对应不同的标签首字 X 坐标；
3. 多行长标签的续行回到整个单元格左边，没有与第一行标签首字对齐；
4. Section 8、Section 11 的窄标签列出现严重折行，部分标签呈现出接近竖版文字的视觉效果；
5. 第一列普通文本可能被统一使用标签字体；
6. Section 3 的 `CAS编号`、`含量%（w/w）`表头没有统一使用表头/标签字体角色；
7. Section 13、Section 15 的单列值被包装成标签结构；
8. Section 16 的单列免责声明没有生成值角色；
9. 匹配表、识别表和模板编辑器尚未完全共享同一套结构角色模型。

## 二、用户要求与当前实现对照

| 用户要求 | 当前实现 | 审计结论 |
|---|---|---|
| 16 个 Section 的序号和标签首字严格对齐 | 序号和标签在同一 inline 文本流中，序号长度不同会改变标签首字位置 | 不满足 |
| 子级标签垂直居左对齐 | 使用统一 `padding-left: 2.2rem`，部分 Section 有效，但不同合并列和二级子列会产生不同基线 | 部分满足，未统一 |
| 标签换行后与第一行首字对齐 | 没有固定标签文本槽或 hanging indent，续行会回到单元格左边 | 不满足 |
| 标签格垂直居中 | CSS 强制第一列 `vertical-align: top !important` | 不满足 |
| 标签保持水平，不得严重竖向折行 | 窄标签列配合 `word-break: break-word`、`overflow-wrap: anywhere`，Section 8/11 出现逐字折行 | 不满足 |
| 标签和值使用各自字体角色 | 部分表头、单列值和第一列普通文本仍按列位置或默认值角色处理 | 不满足 |

## 三、序号和标签首字对齐审计

### 1. 当前实现方式

当前渲染器在 [render-utils.js](../web/src/render-utils.js) 中把序号和标签放在同一个段落文本流中：

```html
<span class="sequence-run">11.8  </span>
<span>特异性靶器官系统毒性（一次接触/反复接触）：</span>
```

CSS 对序号设置：

```css
.sequence-run {
  display: inline-block;
  white-space: pre;
  margin-right: 0.2rem;
}
```

这种实现没有固定的序号槽宽度。序号文本本身越长，后面的标签首字就越向右移动。

### 2. 浏览器实际测量结果

当前浏览器中对 16 个 Section 的标签首字进行测量，结果为：

| 序号类型 | 标签首字起始 X 坐标 |
|---|---:|
| Section 1～9，例如 `1.1`、`9.1` | 约 888 |
| Section 10～12，例如 `10.1`、`12.1` | 约 898 |
| Section 11.10 | 约 907 |
| 一级子标签 | 约 872 |
| Section 11 独立子标签列 | 约 1036 |

这证明标签首字没有位于同一条全局垂直线上。

### 3. 影响

- `1.1 产品名称`和`10.1 化学稳定性`的标签首字不在同一列；
- `11.10 附加信息`相较 `11.1`继续向右偏移；
- 父级标签和子级标签使用不同的左侧基线，但没有统一的槽位定义；
- 用户会看到序号、标签之间的空白宽度随序号位数变化。

### 4. 应有的结构

所有标签行应拆成两个固定槽位：

```text
| 固定序号槽 | 标签文本槽                              |
| 1.1        | 产品名称：                              |
| 10.1       | 化学稳定性：                            |
| 11.10      | 附加信息：                              |
```

推荐使用：

```css
.label-line {
  display: grid;
  grid-template-columns: var(--sequence-width) minmax(0, 1fr);
  align-items: center;
}

.sequence-slot {
  width: var(--sequence-width);
  white-space: pre;
}

.label-text-slot {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: normal;
}
```

`--sequence-width` 应按当前 Section 的最大序号宽度计算，不能让序号文本宽度直接推动标签文字。

## 四、子级标签左对齐审计

### 1. 当前实现

当前 CSS 使用：

```css
.label-child-row {
  padding-left: 2.2rem !important;
}
```

一级子标签在 Section 1、3、8、13 等区域通常从约 x=872 开始；父级标签从约 x=888 或 x=898 开始。

Section 11 的 `吸入`、`经皮`、`致畸形`、`体外遗传毒性`位于独立子标签列，首字约从 x=1036 开始。

### 2. 问题

当前系统同时混用了：

```text
父级序号 inline 流
全局 padding-left
Section 11 独立子标签列
合并单元格自身的列起点
```

因此虽然同一个简单表格中的子标签看起来有缩进，但跨 Section、跨合并列结构时并没有统一的层级基线。

### 3. 应有的 Profile 字段

模板 Profile 应为每个标签层级保存：

```text
parentLabelSlot
childLabelSlot
sequenceWidth
childIndentWidth
childValueStart
mergeGroupId
```

子级标签不应只依赖全局 `padding-left`。

## 五、多行标签续行审计

### 1. Section 11.8 实际测量

当前浏览器中，Section 11.8 长标签的首行和续行位置为：

```text
序号起点：约 x=837
首行标签文字起点：约 x=898
第二行标签文字起点：约 x=837
第三行标签文字起点：约 x=837
```

当前显示相当于：

```text
11.8  特异性靶器官系统毒性（一次接触/反复接触）：
特异性靶器官系统毒性（一次接触/反复接触）：
```

续行没有与第一行标签文本对齐。

### 2. 根因

- 序号和标签没有分成独立布局槽；
- 标签没有 hanging indent；
- `.label-parent-row` 只是 block 元素，没有为标签文字设置独立起始位置；
- 文本换行由普通浏览器 inline 流处理。

### 3. 修复目标

续行必须在标签文本槽内换行：

```text
| 11.8 | 特异性靶器官系统毒性（一次接触/反复 |
       | 接触）：                               |
```

不能回到整个单元格左边。

## 六、标签格垂直居中审计

### 1. 当前 CSS

当前样式包含：

```css
.structured-table td:first-child {
  text-align: left !important;
  vertical-align: top !important;
}
```

### 2. 实际结果

对 16 个 Section 的匹配表逐节读取 DOM 后，所有标签单元格的 computed `vertical-align` 均为 `top`。

即使源模板中的单元格设置了 center，当前 Web CSS 仍会把它强制为 top。

### 3. 影响

- 高行标签贴在顶部；
- 多行值和标签的垂直重心不一致；
- 合并行和子标签行无法保持模板原始的上下位置；
- Section 8 和 Section 11 的高行标签尤其明显。

标签格应使用模板 Profile 指定的垂直对齐方式，普通标签格默认应为 `middle`，只有标题、说明或源文件特别指定的行才使用 `top`。

## 七、禁止竖版标签审计

### 1. 当前 CSS 没有直接启用竖排

当前没有发现：

```css
writing-mode: vertical-rl;
writing-mode: vertical-lr;
```

但是没有直接设置 `writing-mode` 不等于用户不会看到竖版效果。

### 2. 当前 UI 仍然出现严重逐字折行

Section 8 标签列宽约 160px，且同时使用：

```css
word-break: break-word;
overflow-wrap: anywhere;
padding-left: 2.2rem;
```

Section 11 子标签列更窄，造成：

- 汉字逐个向下排列；
- 英文、单位和括号被拆开；
- 标签首行和续行位置不一致；
- 用户视觉上接近竖版文字。

### 3. 应有约束

标签格应设置最小可读宽度和水平文字策略：

```text
标签列最小宽度由模板 Profile 决定；
标签不能无限缩窄；
中文标签按词组/语义边界换行；
英文单位、标准号和括号表达不可任意拆分；
无法在当前宽度内水平呈现时，应扩展列或启用横向滚动；
不能通过逐字断开伪造“适配”。
```

## 八、标签和值字体角色审计

### 1. 第一列默认套用标签字体的风险

当前 `renderParagraph()` 中存在：

```javascript
const roleStyle = (isFirstColumn && !isSec15)
  ? effectiveRoleStyles.label
  : ...
```

这意味着第一列普通文本、无标签说明和单列值可能使用标签字体。第一列只是几何位置，不等于标签语义。

Section 13、Section 16 的单列值必须使用：

```text
role = value-only / source-note
fontRole = value
```

### 2. Section 3 表头字体

当前 GUI 中 Section 3 表头表现为：

```text
化学品名称：加粗、下划线
CAS编号：普通体、下划线
含量%（w/w）：普通体、下划线
```

三个单元格都承担表头职责，却使用了不同字体角色。应建立独立的：

```text
role = table-header
fontRole = label-header
bold = true
editable = false
```

### 3. Section 15 单列值字体和容器角色

Section 15 的法规文本当前以 `label-parent-row` 容器显示，文字虽然是普通体，但结构上被当成标签行。应改为 `value-only/source-note`，使用值字体和源文本换行。

## 九、全局问题和 Section 问题清单

### 全局问题

1. 标签格强制顶部对齐；
2. 序号和标签没有固定双槽位；
3. 多行标签续行没有悬挂缩进；
4. 子级标签只依赖固定 padding，没有模板层级 Profile；
5. 窄列允许任意断字，造成竖向视觉；
6. 第一列普通文本可能使用标签字体；
7. 表头没有独立 `table-header` 角色；
8. 匹配表、识别表和编辑器没有完全共享角色模型。

### Section 3

1. `CAS编号`、`含量%（w/w）`字体角色不一致；
2. `3.1 产品类型`源值在标准匹配表中为空；
3. 组分三列表格列位置已经基本正确，应保留为回归基线。

### Section 8

1. 手部防护标签仍带有呼吸防护残留文字；
2. 控制参数和 OEL 结构行仍需明确隐藏或写入策略；
3. 长标签和手套材料标签窄列折行严重；
4. 子级标签与父级序号的视觉基线不统一。

### Section 11

1. 急性毒性同级子标签和值格关系不完整；
2. Section 11.7 子标签保留但对应值格为空；
3. 长标签和子标签列存在严重换行；
4. 高行标签全部顶部对齐。

### Section 13、15、16

1. 无标签说明和法规文本被包装成标签结构；
2. 单列值没有独立值角色；
3. Section 16 免责声明未显示；
4. 单列文本没有统一值字体和换行策略。

## 十、实施优先级

### P0：先修结构模型

1. 为每个模板单元格建立 `role`、`fontRole`、`mergeGroupId`、`slotId`；
2. 增加 `table-header`、`value-only`、`source-note` 角色；
3. 序号和标签改为固定双槽位；
4. 统一匹配表和编辑器的角色来源。

### P1：修复全局渲染

1. 移除第一列强制 `vertical-align: top !important`；
2. 标签格默认垂直居中；
3. 加入多行标签 hanging indent；
4. 取消标签列无限逐字断开，建立最小可读宽度；
5. 统一标签、表头和值的字体角色。

### P2：修复 Section 特例

1. Section 3 表头角色和 3.1 值格；
2. Section 8 合并格、手部防护残留和 OEL 结构；
3. Section 11 同级子标签和值格；
4. Section 13/15/16 单列值角色；
5. Section 9 标签编号和多行标签。

## 十一、验收标准

1. 16 个 Section 的父级标签首字使用同一垂直基线；
2. 同级子标签使用同一缩进和同一左侧基线；
3. 长标签续行从标签文字槽起始位置继续；
4. 所有标签格垂直居中，除 Profile 明确标注的标题/说明行；
5. 标签不会出现逐字竖向折行；
6. Section 3 三个表头统一使用表头/标签字体；
7. Section 13、15、16 单列值使用值字体和 value-only/source-note 角色；
8. Section 8 和 Section 11 的合并格、子标签和值格全部通过结构审计；
9. 编辑器和匹配页对同一模板使用相同的角色、字体和几何模型；
10. 结构、字体或对齐审计失败时，禁止继续导入编辑器或导出 DOCX。
