# 交接：根除 DOCX 预览灰底粗框（三方库注入样式覆盖 + 缩放选择器修复）

> 交接对象：接手实施的 Agent
> 交接时间：2026-10-18 02:55 (+08)
> 状态：规划 4/4 完成；根因取证 3/17 已完成，**待实施 14 项**
> ⚠️ **本文件已按真实 DOM 取证重写。此前的版本基于错误假设，见 §7，不要按它排查。**

---

## 0. 一句话任务

`docx-preview` 库在容器内**动态注入** `.docx-preview-wrapper { background: gray; padding: 30px }`，而项目所有覆盖规则用的是**不存在的** `.docx-wrapper` / `section.docx` —— 于是 30px 深灰粗框毫发无损。修正选择器覆盖它，并顺带修复同因失效的 Fit-to-Width 缩放。

---

## 1. 仓库与 change

| 项 | 值 |
|:--|:--|
| 仓库 | `F:\docker\projects\Msds-Engine` |
| OpenSpec 根 | 项目内 `openspec/`（**不要**加 `--store`） |
| change | `openspec/changes/preview-gray-frame-removal/`（4/4 artifact；3/13 任务） |
| 受影响能力 | `ui-layout-and-column-width-optimization`（既有能力） |
| 运行实例 | 容器 `msds-engine` → `http://127.0.0.1:5173` |

```bash
cd F:\docker\projects\Msds-Engine
openspec status --change "preview-gray-frame-removal" --json
openspec instructions apply --change "preview-gray-frame-removal" --json
```

---

## 2. 根因（已取证，权威）

真实 DOM（容器内渲染后）：

```html
<div class="docx-preview-shell">
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

三条因果链：

1. **灰框来源**：库注入的 `background: gray`（CSS 标准色 `#808080`）+ **`padding: 30px`** → 包住白页的 30px 深灰粗框。与 `#eef2f5` / `#dbe2e8` / `#fff` 这些改动**无关**。
2. **覆盖为何全失效**：`web/src/main.js:3929` 以 `{ className: 'docx-preview' }` 调用 `renderAsync`，库因此产出 `.docx-preview-wrapper` 与 `section.docx-preview`，且**没有任何祖先带 `.docx-preview` 类**。`web/src/styles.css` 中的 `.docx-preview .docx-wrapper`、`.docx-preview section.docx`（含 401-405 的 `#ffffff !important` 组）**从未匹配任何元素**。
3. **连带功能 bug**：`web/src/main.js:3771` 的 `applyDocxFitToWidth` 查询 `.docx-wrapper` / `section.docx`，取到 `null` 后**静默 `return`** → 自适应缩放在该结构下从未生效。既有规格「DOCX 原版式预览视口智能宽度自适应缩放」因此实际处于失效状态。

相关锚点：`main.js:3925`（`wrapper.className = 'docx-preview-wrapper-holder'`）、`main.js:3929`（`renderAsync` 调用）、`main.js:3771-3784`（缩放函数）。

---

## 3. 必须改动（对应 tasks 2.x / 3.x）

### 3.1 `web/src/styles.css`

新增**真实类名**的高优先级覆盖（背景白 + 去掉 30px 内边距 + 轻微页投影）：

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
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12) !important;   /* 替换库里 50% 黑的重投影 */
  background: #ffffff !important;
  box-sizing: border-box !important;
}
```

**保留双选择器**（`.docx-preview-wrapper` 与 `.docx-wrapper`、`section.docx-preview` 与 `section.docx`），不要只留一种 —— 这是本 change 唯一防重复踩坑的手段。

### 3.2 `web/src/main.js:3771`

```javascript
const wrapper = target.querySelector('.docx-wrapper, .docx-preview-wrapper');
const section = target.querySelector('section.docx, section.docx-preview');
if (!wrapper || !section) return;
```

---

## 4. ⚠️ 动工前必须先确认的一件事

artifact 内部对"页面节类名"的记载**自相矛盾**：

- `design.md` 的 DOM 树写 `<section class="docx-preview">`
- 库注入的 CSS 与 `proposal.md` 写 `section.docx-preview`

本 change 的失败模式就是"类名猜错"，所以**先复核存活 DOM 的实际 class 再落选择器**：复用 `web/tests/scratch_docx_dom.mjs`（在容器内跑）确认三层真实类名（shell / wrapper / 页面节），并把结论写回 `design.md`。选择器列表按 §3.1 同时覆盖两种写法，不依赖这次结论。

---

## 5. 验收（含必须补强项）

### 5.1 计算样式是唯一真判据（重要）

库是**运行时**注入 `<style>`，因此"我们的样式表里写了这条规则"**不能证明灰框被覆盖**。必须断言**计算样式**：

- `getComputedStyle(('.docx-preview-wrapper')).backgroundColor` === `rgb(255, 255, 255)`
- 同元素的 `paddingTop/paddingBottom` 不再来自库的 `30px`
- 页面节的 `boxShadow` 为轻微值（不是库的 `rgba(0,0,0,0.5)`）

落地方式：把 `web/tests/scratch_docx_dom.mjs` 由"临时取证"**改造为计算样式断言测试**（它能渲染真实 DOM）—— 即 `tasks.md` 的 4.1，并配 4.2 的负向验证；静态契约测试（`test_preview_background_contract.mjs`）按 4.3 保留为**补充**防回归，不作为唯一判据。

### 5.2 其余验收

| 项 | 判据 |
|:--|:--|
| 灰框消失 | 三视图（识别页 / 匹配页 / 模板编辑器）白页四周无 30px 灰带 |
| 缩放恢复 | 切自适应宽 / 100% / ＋ / － / 展宽，页面随容器缩放并居中 |
| 负向验证 | 移除 §3.1 的覆盖规则后，5.1 的计算样式断言**必须失败** |
| 流程 | `tasks.md` 勾选 → `openspec validate preview-gray-frame-removal --strict` → `openspec archive … -y` |

### 5.3 人工核验（UI 归口人工）

按用户全局准则的「人工验收归口」：三视图观感由**用户手动核验**，交付时给出复现步骤与改动前后对照，任务在人工结论到达前保持未勾选。

---

## 6. 部署与验证环境（已踩过的坑）

1. **必须重建镜像**才能看到效果（容器跑的是镜像内产物）：
   `docker compose build; docker compose up -d`
2. **Docker Hub IPv6 元数据超时**（`failed to resolve source metadata … [2a03:…]:443`，本机无 IPv6 路由）会间歇性阻断构建。绕法：
   `$env:DOCKER_BUILDKIT='0'; $env:COMPOSE_DOCKER_CLI_BUILD='0'; docker compose build`
   （该镜像在 02:38 成功构建过一次，说明网络是间歇性的，重试亦有效。）
3. **CSS 文件名带 hash**（如 `index-z1dYIkY.css`）→ 验收前必须**硬刷新** `Ctrl+F5`。
4. **别用 `git diff` 当验收凭证**：当前已部署的包里，`styles.css` 确实被改成 `#ffffff !important`，但改的是**死选择器**，屏幕毫无变化 —— "有 diff" ≠ "有生效"。

---

## 7. 历史包袱警告（防重复走错路）

- **本文件旧版（02:33）的判断是错的**：它认定生效灰底是 `#eef2f5`、要改 `styles.css:401-405`。事实是那些规则**从未匹配任何元素**。不要再按 `#eef2f5` / `#dbe2e8` 排查。
- 我（上一个接手方）曾从静态 CSS 推断出"页面投影造成灰边"的结论，同样是**缺少真实 DOM 的误判**。方法教训：**UI 渲染问题以容器内真实 DOM/计算样式取证为准**，静态源码只能提供候选。
- `styles.css` 中 `.docx-preview .docx-wrapper` / `.docx-preview section.docx`（含 401-405 组与 345-346）目前是**死规则**。实施时二选一并记录取舍：**(a)** 重构为真实类名（只留一套权威规则，推荐）；**(b)** 保留现状（最小改动，但继续误导后来者）。

---

## 8. 建议实施顺序

1. 复核存活 DOM 三层真实类名，写回 `design.md`（§4）。
2. 改 `styles.css`（§3.1）。
3. 改 `main.js:3771` 选择器（§3.2）。
4. 把取证脚本改造为计算样式断言 + **负向验证**（§5.1）。
5. 清理临时产物（按 §5.1 的处置决定）。
6. 重建镜像 → 硬刷新 → 三视图人工核验（§5.3）。
7. 勾 `tasks.md` → `openspec validate --strict` → `openspec archive preview-gray-frame-removal -y`。
8. 只提交本次相关文件：`web/src/styles.css`、`web/src/main.js`、`web/tests/*`、`openspec/changes/preview-gray-frame-removal/`。提交说明含：根因（库注入 + 死选择器）、改法、验收证据（含负向验证）。

---

## 9. 工作区警告

- 工作区有**逾 360 项未提交改动**（含其它在途工作）。**不要** revert / stash / 顺手清理；提交只含 §8.8 列出的文件。
- 两条**不要误判为回归**的既有现象：
  1. `web/tests/test_export_filename.mjs` 必然失败 —— 硬读 `E:\冠志\...\OS-1030 msds_CN 冠志.docx`，该文件本机不存在。
  2. `web/src/msds-api-controller.js` 中 `/api/msds/export` 有**两份实现**，第二份永远不可达（死代码），另行处理。

---

## 10. 关键文件速查

| 用途 | 路径 |
|:--|:--|
| 待改样式 | `web/src/styles.css`（新增真实类名覆盖；401-405 组为死规则） |
| 待改逻辑 | `web/src/main.js:3771`（缩放选择器）、`:3925`、`:3929`（库调用与 holder） |
| 取证脚本（改造成断言用） | `web/tests/scratch_docx_dom.mjs` |
| 静态契约测试（补充） | `web/tests/test_preview_background_contract.mjs` |
| 规划 artifact | `openspec/changes/preview-gray-frame-removal/` |
| 将被同步的主规格 | `openspec/specs/ui-layout-and-column-width-optimization/spec.md` |
