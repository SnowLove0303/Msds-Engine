# 交接：修复模板编辑器预览标题行被覆盖（OpenSpec change 已就绪）

> 交接对象：接手实施的 Agent
> 交接时间：2026-10-18 01:45 (+08)
> 你的任务：实施并验收 `editor-preview-heading-overlap` 这个 change。**规划已完成，你只需要 apply。**

---

## 0. 一句话任务

把模板编辑器右侧 DOCX 预览的**标题行**从「固定高度」改为「自适应高度」，使窄宽度下换行的控件不再被下方预览容器覆盖。

---

## 1. 仓库与工作目录

| 项 | 值 |
|:--|:--|
| 项目仓库 | `F:\docker\projects\Msds-Engine` |
| OpenSpec 根 | 项目内 `openspec/`（**不是** store，命令行不要加 `--store`） |
| 应用 | MSDS Studio（Vue/原生 ESM + Node 服务端；`web/` 为工程目录） |
| 运行实例 | Docker 容器 `msds-engine`，宿主 `http://127.0.0.1:5173`（**注意见 §6.3**） |
| 最近提交 | `af2649f`（本次缺陷相关改动**尚未提交**） |

---

## 2. 规划已完成的 change（不要重做规划）

```
openspec/changes/editor-preview-heading-overlap/
├─ proposal.md    为什么 + 改什么 + 影响面
├─ specs/ui-layout-and-column-width-optimization/spec.md   新增 1 条要求 / 4 个 Scenario
├─ design.md      取证到行号 + 失效机制 + 6 项决策 + 风险 + 回滚
└─ tasks.md       10 个任务（取证 → 修复 → 守卫 + 核验 → 归档）
```

- 该 change 已通过 `openspec validate editor-preview-heading-overlap --strict`（4/4 artifact）。
- 它**修改既有能力** `ui-layout-and-column-width-optimization`（不是新建能力），归档时会把新要求并入 `openspec/specs/ui-layout-and-column-width-optimization/spec.md`。
- 开始前请先读这 4 个文件；它们是你的权威输入。

```bash
cd F:\docker\projects\Msds-Engine
openspec status --change "editor-preview-heading-overlap" --json
openspec instructions apply --change "editor-preview-heading-overlap" --json
```

---

## 3. 缺陷现象（用户可见）

模板编辑器（工作台第 3 页）右侧「DOCX 预览」区域：标题行的一条**深色粗边框压住上方一排按钮**，被压住的按钮看不清、也点不到；受影响的正是**预览模式切换**与**缩放控制**。

复现要点：把右侧预览面板宽度收窄（缩小窗口，或让左侧编辑表占更宽），直到标题行控件无法单行排列。

---

## 4. 根因（已取证到行，可直接采信；若实测不符请先改 `design.md`）

**不是"粗边框挡住按钮"，而是标题行换行后溢出、被紧随其后的预览层绘制覆盖。**

| 证据 | 位置 |
|:--|:--|
| 预览标题行 DOM：`.panel-heading.compact.preview-heading-flex[data-toolbar-scope="editor-preview-heading"]` | `web/src/main.js:2373` |
| 同行内联样式含 `flex-wrap: wrap` | `web/src/main.js:2373` |
| 该行控件：两个模式药丸 + `renderZoomBar('editor')`（徽标/自适应宽/100%/－/＋/缩放文本/⤢展宽/📂原件）+ 只读 | `web/src/main.js:2373-2380`、`3742-3765` |
| 作用域规则把该行锁死为 `min-height:38px; height:38px` | `web/src/styles.css:3088-3096` |
| 父容器 `.editor-layout .preview-panel { flex:1 1 55% }`，约 600px | `web/src/styles.css:499-501` |
| 紧随其后的 `.docx-preview-shell.editor-preview`，带底色 `#dbe2e8` 与页面阴影 | `web/src/styles.css:345-346`、`426`；`main.js:2381` |

机制：控件总宽（约 240 + 400 + 50px）超过面板宽度 → 换行到第二行 → 溢出被锁定的 38px 高度 → 该行是**静态（无定位）flex 子项**，溢出内容不占布局高度 → 后面的预览容器按 DOM 顺序绘制在其之上 → 按钮被覆盖。

**系统性事实（已审计，供你判断影响面）**：编辑器 5 个工具条作用域中 4 个固定了高度——
`editor-file-ribbon` 28px、`editor-section-heading` 38px、`editor-table-heading` 38px、`editor-preview-heading` 38px；
**只有预览标题行同时启用了 `flex-wrap: wrap`**，所以只有它会炸。

---

## 5. 要改成什么（最小因果集）

### 5.1 主修复（`web/src/styles.css`，`[data-toolbar-scope="editor-preview-heading"]`）

```css
[data-toolbar-scope="editor-preview-heading"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;      /* 保有原紧凑下限 */
  height: auto;          /* ← 关键：不再锁死高度，允许换行后增高 */
  flex-shrink: 0;        /* ← 关键：作为 flex 子项不被压缩 */
  padding: 0 12px;
  box-sizing: border-box;
}
```

保留 `flex-wrap: wrap`（窄屏换行优于隐藏/裁切控件）。若内联样式与作用域规则冲突，以作用域规则为准并保持既有 `!important` 使用习惯。

### 5.2 回归守卫（新增测试，建议 `web/tests/test_toolbar_scope_height_contract.mjs`）

解析 `web/src/styles.css`，遍历全部 `data-toolbar-scope="..."` 作用域，断言**不存在**「固定高度（`height` 与 `min-height` 同为固定像素）+ 允许换行（`flex-wrap: wrap`）」的组合。

- 负向验证（必做）：把主修复临时改回 `height: 38px`，该测试**必须失败**；改回自适应后必须通过。

### 5.3 明确不要做（Non-Goals）

- **不要**用 `z-index` / `position` 去"盖回去"——那只是把覆盖方向反转（改为遮住预览内容），溢出根因仍在。
- **不要**改动其余三个固定高度作用域（它们未启用换行，无此缺陷）——只在任务 2.4 里登记审计结论。
- **不要**重构成把缩放控件收进「更多」菜单（属可延后优化，见 design 的 Open Questions）。
- **不要**顺手改 PDF 相关的在途改动（见 §7）。

---

## 6. 验收标准

### 6.1 行为验收（对应 spec 的 4 个 Scenario）

| 场景 | 通过判据 |
|:--|:--|
| 窄容器换行后控件全部可见 | 每个控件完整可见、可点击，无任何部分被遮挡 |
| 增高后不与预览重叠 | 标题行底边不超出预览容器顶边 |
| 宽度充足保持单行紧凑 | 高度仍为 38px，排布与改动前一致（视觉不回归） |
| 允许换行与固定高度不得同时存在 | 守卫断言通过 |

### 6.2 流程验收

- `tasks.md` 中每个任务在**行为真正达成后**才勾选（不要提前勾）。
- `openspec validate editor-preview-heading-overlap --strict` 通过。
- 归档：`openspec archive editor-preview-heading-overlap -y`，确认要求已并入 `openspec/specs/ui-layout-and-column-width-optimization/spec.md`。

### 6.3 如何真正看到效果（重要）

运行中的 `msds-engine` 容器跑的是**镜像内**的前端产物，改了源码**必须重建镜像**才可见：

```powershell
cd F:\docker\projects\Msds-Engine
docker compose build
docker compose up -d
```

⚠️ **已踩过的坑**：`docker compose build` 目前会因 Docker Hub 的**IPv6 元数据请求超时**失败
（`failed to resolve source metadata ... dial tcp [2a03:...]:443`，本机无 IPv6 路由）。
可尝试的绕法：

1. 关闭 BuildKit 走经典构建器（可直接复用本地基础镜像，免注册表元数据请求）：
   `$env:DOCKER_BUILDKIT='0'; $env:COMPOSE_DOCKER_CLI_BUILD='0'; docker compose build`
2. 或恢复网络 / Docker Desktop 的 IPv4 出口后重试。
3. 或**不重建镜像**，改在本机跑开发服务器验证（注意 5173 端口被容器占用，先 `docker stop msds-engine`）：
   `cd web; npm run dev`（或改用其他端口）。

---

## 7. 工作区现状警告（务必先看）

`git status` 显示约 **21 项未提交改动**，来自另一条在途工作（PDF 导出能力建设，change `portable-pdf-export-pipeline`）。它们**不属于你的任务**：

- **不要** revert、不要 stash、不要"顺手清理"这些改动。
- 你的提交应**只包含**你为本次缺陷改动的文件（`styles.css`、可选 `main.js`、新增测试、以及 `openspec/changes/editor-preview-heading-overlap/`）。
- 若必须提交共用文件，请在提交说明中写明只包含本次修复的 hunk。

另有两条已知的、**不要误判为回归**的现象：

1. `web/tests/test_export_filename.mjs` 会失败：它硬读 `E:\冠志\...\OS-1030 msds_CN 冠志.docx`，该文件在本机不存在。其导入图只含 `docx-engine.js`，与本缺陷无关。
2. `web/src/msds-api-controller.js` 中 `/api/msds/export` 存在**两份实现**，第二份因条件相同而永远不可达（死代码）。已登记待另行处理，**不要**在本 change 里删。

---

## 8. 建议实施顺序

1. 读 change 的 4 个 artifact（§2）。
2. 取证：按 §3 复现并截图（窄/宽各一张，标注面板宽度）。
3. 改 `styles.css`（§5.1）。
4. 新增守卫测试并做**负向验证**（§5.2）。
5. 按 §6.3 看到真实效果（重建镜像或本机 dev），完成窄/宽双宽度核验。
6. 勾选 `tasks.md`；`openspec validate --strict`。
7. `openspec archive editor-preview-heading-overlap -y`。
8. 只提交本次相关文件，提交说明含：缺陷、根因、修复、验收证据（含负向验证）。

---

## 9. 关键文件速查

| 用途 | 路径 |
|:--|:--|
| 待改样式 | `web/src/styles.css`（作用域规则 3088-3096） |
| 相关标记 | `web/src/main.js`（标题行 2373-2380；缩放条 3742-3765；预览容器 2381） |
| 规划 artifact | `openspec/changes/editor-preview-heading-overlap/` |
| 将被同步的主规格 | `openspec/specs/ui-layout-and-column-width-optimization/spec.md` |
| 既有测试目录 | `web/tests/` |
| 交付构建 | `Dockerfile`、`docker-compose.yml`（容器 `msds-engine`，端口 5173） |
