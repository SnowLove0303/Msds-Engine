# Design

## Context

在 Docker 容器内直接调用 `docx-preview` 渲染后得到的真实结构如下：

```html
<div class="docx-preview-shell ...">
  <div class="docx-preview-wrapper-holder">
    <style>
      .docx-preview-wrapper { background: gray; padding: 30px; padding-bottom: 0px; display: flex; flex-flow: column; align-items: center; }
      .docx-preview-wrapper > section.docx-preview { background: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); margin-bottom: 30px; }
    </style>
    <div class="docx-preview-wrapper">
      <section class="docx-preview">…</section>
      …
    </div>
  </div>
</div>
```

关键事实：

1. 三方库注入的 `<style>` 在 `.docx-preview-wrapper` 上产生 `background: gray`（`#808080`）与 `padding: 30px` —— 这是 30px 深灰粗框的唯一来源；同一条样式还给页面节施加 `box-shadow: 0 0 10px rgba(0,0,0,0.5)`（50% 黑），是白页周围另一条深色轮廓来源。
2. 既有 CSS 只写了 `.docx-preview .docx-wrapper` 与 `.docx-preview section.docx`，因 `className: 'docx-preview'` 使库产出的类名为 `.docx-preview-wrapper` / `section.docx-preview`，且**没有任何祖先带 `.docx-preview` 类**，覆盖规则全部落空。
3. `web/src/main.js:3771` 的 `applyDocxFitToWidth` 查询同一批不存在的选择器，取到 `null` 后静默 `return`，缩放从未生效。

锚点：`web/src/main.js:3925`（`wrapper.className = 'docx-preview-wrapper-holder'`）、`:3929`（`renderAsync` 调用）、`:3771-3784`（缩放计算，实际留白为 `containerWidth - 12`）。

**已复核项（已通过容器测试确认）**：容器内真实运行输出 `Subchild 0: tag=SECTION, class="docx-preview", nodeName=SECTION`。即 HTML 节点为 `<section class="docx-preview">`，其在 CSS 中精确对应的类选择器即为 `section.docx-preview`（或通用类名 `.docx-preview`），两者完全一致。选择器清单同时保留 `section.docx-preview` 与 `section.docx` 双版本。

## Goals / Non-Goals

**Goals:**

- 让三方库默认注入的深灰底与 30px 内边距失效，三视图页面四周纯白连续。
- 把页面投影统一为轻微轮廓，替换库注入的 50% 黑重投影。
- 修复 `applyDocxFitToWidth` 的选择器，使自适应缩放作用于库实际生成的结构。
- 验收判据建立在渲染后计算样式之上。

**Non-Goals:**

- 不改变 `docx-preview` 的引入方式、版本与底层实现。
- 不引入按视图区分的背景色配置项。
- 不重构缩放控件的交互形态。

## Decisions

### D1 以真实类名新增覆盖规则，并保留双选择器

在 `web/src/styles.css` 新增：

```css
.docx-preview-shell,
.docx-preview-wrapper-holder,
.docx-preview-wrapper,
.docx-wrapper,
.docx-preview,
.docx-preview .docx-wrapper {
  background: #ffffff !important;
}

.docx-preview-wrapper,
.docx-preview .docx-wrapper {
  background: #ffffff !important;
  padding: 12px 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  transform-origin: top center;
  transition: transform 0.12s ease-out;
}

.docx-preview-wrapper > section.docx-preview,
.docx-preview-wrapper section.docx-preview,
.docx-preview section.docx,
section.docx-preview,
section.docx {
  margin: 0 auto 14px !important;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12) !important;
  background: #ffffff !important;
  box-sizing: border-box !important;
}
```

同时保留 `.docx-wrapper` / `section.docx` 变体：**双选择器是本次防止"类名猜错"复发的唯一手段**。库注入样式不含 `!important`，因此我方规则无论注入时序先后均可胜出。

替代方案：(a) 只写真实类名（更干净，但一旦库版本变化或页面节类名如 §Context 所记不一致就会再次落空）；(b) 改库的引入参数（如 `inWrapper: false`，改动面更大且需重验渲染结果）。选择"真实类名 + 双选择器"以兼顾精准与鲁棒。

### D2 扩展 `applyDocxFitToWidth` 选择器

```javascript
const wrapper = target.querySelector('.docx-wrapper, .docx-preview-wrapper');
const section = target.querySelector('section.docx, section.docx-preview');
if (!wrapper || !section) return;
```

保持"取不到就返回"的既有防御式写法，但让选择器覆盖库实际生成的两套命名。

### D3 验收判据改为运行时计算样式

把 `web/tests/scratch_docx_dom.mjs`（已在容器内验证可渲染真实 DOM）由"临时取证脚本"改造为**计算样式断言测试**：

- `getComputedStyle(wrapper).backgroundColor === 'rgb(255, 255, 255)'`
- 包装层 `paddingTop` / `paddingBottom` 不再等于库默认的 `30px`
- 页面节 `boxShadow` 不含 `rgba(0, 0, 0, 0.5)`

理由：库在**运行时**注入 `<style>`，因此"样式表里存在某条规则"无法证明覆盖生效 —— 上一轮的失败正是这种"静态检查通过、屏幕毫无变化"。静态契约测试（`test_preview_background_contract.mjs`）保留为补充防回归。

### D4 死规则取舍：重构到真实类名

`.docx-preview .docx-wrapper` / `.docx-preview section.docx`（含 401-405 组与 345-346）永不可能匹配。本变更将其**重构为真实类名**，使样式表只保留一套权威规则，避免后来者（已发生过两次）据此误判。若实施中判断风险高于收益，可改为保留现状并在本节记录取舍与理由。

### D5 页面投影保留但降为轻微

页面轮廓仍需可辨识，故保留投影，但取值从库的 50% 黑降为约 12%（`0 4px 18px rgba(0,0,0,0.12)`）。这同时消除了用户看到的白页外侧深色轮廓。

## Risks / Trade-offs

- [静态断言无法证明运行时覆盖] → 由 D3 的计算样式断言承担主要判据（这正是上一轮暴露的风险）。
- [库版本升级后类名再次变化] → 双选择器 + 计算样式断言会在同一变更内暴露问题。
- [页面节类名记载不一致导致选择器再次落空] → §Context 的待复核项要求动工前在容器内确认；选择器同时覆盖两种写法。
- [三视图共用同一包装层，改动影响面广] → 一致化本身是目标；交付时三视图均列入人工核验。
- [重构死规则触碰既有样式] → 重构范围限于预览包装层相关的选择器，不触及其它组件的样式。

## Migration Plan

单文件样式改动 + 一处选择器修复。前端构建产物更新后即生效；回滚为 revert 对应提交。

## Open Questions

- 页面节最终类名以复核结论为准（`section.docx-preview` 还是 `section.docx`），选择器按 D1 同时覆盖两种。
