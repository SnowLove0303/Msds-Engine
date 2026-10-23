# Frontend Engineering Guide

## Baseline & Tech Stack (技术栈基线与严格模式)

- 核心语言与模块化: 原生 JavaScript (ES2022+ / 原生 ES Modules)，遵循现代浏览器标准的模块加载规范。
- 构建与开发工具链: Vite 7.x (`web/vite.config.js`)，提供本地极速热重载与静态资产分发。
- 文档渲染引擎: `docx-preview` (^0.3.7)，负责在浏览器前端实现 DOCX 高保真轻量化预览。
- 样式与视觉体系: 原生 CSS3，采用 Excel 风格白底低噪音排版与 CSS 自定义属性（Variables）管理网格槽位与对齐标尺。

## Source Structure & Ownership (源码分层与所有权边界)

```text
web/
├── index.html                 # 单页面应用主 HTML 外壳
├── src/
│   ├── main.js                # 工作台状态机、事件监听器与三面板生命周期编排
│   ├── render-utils.js        # 双垂线对齐、HTML 表格渲染与高亮管道
│   ├── annotation-engine.js   # 稳定审阅锚点计算与批注抽屉交互
│   └── styles.css             # 全局排版、网格槽位与表格视觉样式
└── public/                    # 静态资产与基准模板库
```

所有权与协作准则:
- `styles.css`: 拥有所有全局样式、布局网格、状态颜色（红黄绿状态胶囊）与字体排版规则的唯一定义权；
- `render-utils.js`: 拥有将 16 章节结构化数据渲染为高保真 HTML 表格的唯一编排权，提供双槽位对齐与悬挂缩进；
- `main.js`: 拥有前端业务状态转移（文件选择 -> 识别 -> 匹配 -> 编辑器覆写 -> 导出）与事件订阅的唯一调度权。

## UI System & Styling Ownership (组件库与样式所有权分工)

| 视觉元素 / 模块 | 负责文件 | 核心实现与规范 |
| :--- | :--- | :--- |
| **工作台三面板容器** | `styles.css`, `index.html` | `.workspace-container` 弹性三栏布局（识别视图、匹配中枢、模板编辑器） |
| **表格边框与单元格基线** | `styles.css` (`.structured-table`) | 统一白底、实线细边框（`#d0d7de`），消除虚线、断线与列畸变 |
| **双槽位序号与标签** | `render-utils.js`, `styles.css` | `.label-line-grid` 容器，固定宽度 `--sequence-width: 2.8rem`，保障中文首字绝对垂直对齐 |
| **多行标签悬挂缩进** | `styles.css` (`.label-text-slot`) | 标签正文多行自动换行时悬挂对齐首字，禁止跌入序号区 |
| **状态胶囊与操作按钮** | `styles.css` | 中性平整化控件，语义化状态色彩（匹配成功绿色、空值灰色、警示黄色） |

## State Classification & Data Fetching (状态分层与数据获取规范)

1. 前端状态分类:
   - 文档会话状态 (`sessionState`): 记录当前载入的源文件名、文件指纹、选定模板及语言类型；
   - 识别数据状态 (`recognitionData`): 缓存从 `/api/msds/recognition` 获取到的 16 章节原始节点树；
   - 匹配规约状态 (`matchingResult`): 缓存从 `/api/msds/match` 返回的插槽映射、置信度分数与无值标记；
   - 编辑器实时状态 (`editorModel`): 模板表格中用户双击微调后的动态 DOM 数据。
2. 数据获取与通信:
   - 统一采用原生 `fetch` API 与服务端 `/api/msds/*` 通信；
   - 网络请求前置设置统一超时与加载 Loading 遮罩，网络失败时通过顶部 Toast 弹出明确错误原因。

## Routing & Data Lifecycle (路由架构与数据生命周期)

1. 工作台单页视图生命周期:
   - 阶段 1: 拖拽或选择源 DOCX 文件，触发 `/api/msds/import` 并点亮左侧【识别面板】；
   - 阶段 2: 确认识别事实，触发 `/api/msds/match`，中间【智能匹配面板】计算槽位覆盖率；
   - 阶段 3: 点击“应用至编辑器”，执行 `applyMatchResultToEditor`，右侧【模板编辑器】自底向上物理删行并重构编号；
   - 阶段 4: 用户手动微调或批注后，点击“导出交付物”，触发 `/api/msds/export` 下载生成物。

## Interactive States & Feedback (交互状态与用户反馈规范)

- 单元格即时编辑: 在模板编辑器中双击单元格触发行内无缝编辑，聚焦文本框限制在 `.label-text-slot` 或值槽内，失焦或回车立即同步回内存模型。
- 操作防抖与互斥: 导出与匹配按钮在异步请求发起后立即呈现 `disabled` 与转圈动画，避免用户重复点击。
- 批注抽屉动画: 批注侧边栏采用平滑滑动动画，点击表格具体行时通过 6 维锚点精确高亮对应记录。

## Frontend Invariants & Verification (前端不变量与自动化验证)

1. 渲染不变量:
   - 列数严格锁定: Section 2 表格必须严格呈现为 2 列（比例 `35.926%` : `64.074%`），严禁产生第 3 列列挤出；
   - 标签垂直对齐: 全 16 章节所有有序号/无序号标签的中文第一字，在同一垂线上绝对共线（误差 0px）；
   - 垂直居中默认: 结构化表格标签单元格的 computed `vertical-align` 必须为 `middle`，严禁强制覆盖为 `top`。
2. 前端验证方式:
   - 每次前端代码修改后，在真实浏览器中启动 `npm run dev --prefix web`，抽检 Section 2、Section 3、Section 8 及 Section 11 的视觉对齐与编辑交互。
