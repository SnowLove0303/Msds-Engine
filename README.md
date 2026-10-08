# MSDS-Engine (化学品安全技术说明书智能处理引擎)

[![Version](https://img.shields.io/badge/version-V1.0-emerald.svg)](https://github.com/SnowLove0303/Msds-Engine)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Browser%20%7C%20Node.js-green.svg)](#)

> **MSDS-Engine** 是专为化学品安全技术说明书（MSDS / SDS）打造的高保真纯本地结构化识别、智能语义匹配规约、模板安全覆写工作台与 AI Agent REST API 驱动中枢。

---

## 🌟 核心特性与设计哲学

- 🔒 **纯本地与零破坏原则**：所有文档处理、OOXML 解析与渲染均在浏览器及本地内存中完成，绝不向外部网络上传敏感工艺配方；受保护的基准模板受 SHA-256 哈希硬性约束，严禁原地篡改。
- 📊 **16 章节高精识别提取**：深入兼容 Microsoft Word `w:numPr` / `numbering.xml` 自动编号与多级嵌套，实现 16 大章节与两级子项标签、数值的角色级精确分离。
- 🎯 **148KB 深度智能匹配中枢**：内嵌全面的化工安全技术规约与插槽映射体系，支持 Section 3 三列组分、Section 8 PPE 等效归一、Section 9 测试条件解耦、无值智能物理剪枝与序号连贯自适应重编号。
- 📝 **Excel 风格低噪音排版**：采用统一白底与共享边线渲染管线，告别虚线、断线与三列畸变，支持双垂线父子标签对齐规范。
- 🤖 **Agent 机器友好 API 与审阅包**：
  - 提供标准的 HTTP REST API（挂载于 `/api/msds/*`），支持 AI 智能体一键驱动导入、识别、匹配与生成 Markdown 汇报；
  - 支持逐标签、逐值、逐位置的 6 维语义稳定锚点系统，以及 Agent 专属的 `msds-review-bundle/v1`（NDJSON）结构化审阅包导出。

---

## 🏗️ 系统架构

```text
┌─────────────────────────────────────────────────────────────┐
│                         MSDS-Engine                         │
├──────────────────────────────┬──────────────────────────────┤
│      Web 交互工作台 (Vite)    │    Agent REST API (无头服务)  │
│  - DOCX 结构化识别工作台     │  - POST /api/msds/import     │
│  - 智能匹配与无值剪枝工作台  │  - GET  /api/msds/recognition│
│  - 模板安全编辑器工作台      │  - POST /api/msds/match      │
│  - 逐项审阅抽屉与批注面板    │  - GET  /api/msds/match-result│
├──────────────────────────────┴──────────────────────────────┤
│                         核心引擎层                          │
│  - docx-engine.js        : 底层 OOXML ZIP/XML 解析与写入    │
│  - smart-matching.js     : 16 章节插槽路由与语义规约引擎    │
│  - annotation-engine.js  : 6 维稳定锚点、证据链与状态机     │
│  - msds-handoff.js       : 识别事实到编辑器的字段编排器     │
│  - render-utils.js       : 双垂线对齐与高保真表格渲染       │
├─────────────────────────────────────────────────────────────┤
│                      官方基准模板与资产                     │
│  - 正式模板_MSDS_CN_冠志.docx (SHA-256 保护)                │
│  - 正式模板_MSDS_EN_冠志.docx (SHA-256 保护)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```text
.
├─ web/                                  # 核心 Web 与 Node.js 服务工程
│  ├─ src/
│  │  ├─ docx-engine.js                  # 底层 DOCX 解析与安全写入引擎
│  │  ├─ smart-matching.js               # 智能匹配与无值剪枝中枢
│  │  ├─ annotation-engine.js            # 批注系统、稳定锚点与审阅包导出
│  │  ├─ msds-api-controller.js          # REST API 核心路由与控制器
│  │  ├─ api-server.mjs                  # Agent 独立无头 HTTP 服务入口
│  │  ├─ main.js                         # Web 端状态流转与三面板渲染
│  │  ├─ render-utils.js                 # 界面渲染与对齐管线
│  │  └─ styles.css                      # 工作台样式
│  ├─ public/templates/                  # 官方基准母版库 (只读保护)
│  └─ tests/                             # 自动化回归测试套件 (覆盖 21 组测试)
├─ openspec/                             # OpenSpec 规范驱动规约资产
├─ 识别模块/ & 覆写模块/                 # 历史 Python 算法参考与内嵌模板
└─ .agents/skills/msds-agent-api/        # Agent API 驱动 SOP Skill
```

---

## 🚀 快速启动

### 1. 启动 Web 工作台 (推荐)

```powershell
cd web
npm install
npm run dev -- --host 127.0.0.1
```

在浏览器中打开：[`http://127.0.0.1:5173/`](http://127.0.0.1:5173/)。
该模式下同时具备 Web 可视化交互界面与内置的 `/api/msds/*` REST API 中间件。

### 2. 启动独立无头 Agent API 服务

适用于后台服务、定时任务或批处理脚本：

```powershell
cd web
npm run api
```

独立服务监听地址：[`http://127.0.0.1:5174/api/msds`](http://127.0.0.1:5174/api/msds)。

---

## 📡 Agent REST API 规格

| 端点 | 方法 | 说明 |
| :--- | :---: | :--- |
| `/api/msds/health` | `GET` | 服务健康检查 |
| `/api/msds/import` | `POST` | 导入 MSDS 源文档（传入 `filePath` 与 `sessionId`） |
| `/api/msds/recognition` | `GET` | 获取 16 章节结构化抽取事实与组分列表 |
| `/api/msds/match` | `POST` | 发起智能匹配与自动剪枝（指定 `templateVariant`） |
| `/api/msds/match-result` | `GET` | 获取匹配结果（支持 `summary` 结构化对象或 `markdown` 汇报文本） |

---

## 🧪 自动化测试套件

MSDS-Engine 拥有端到端的全面测试矩阵：

```powershell
cd web
# 1. 基础冒烟与模板往返测试
npm run test:smoke

# 2. 真实样例 (PU-1001 ~ PU-1004) Parity 与导出重载测试
node tests/test_pu_series_standard_parity.mjs

# 3. 全量 42 项问题核查闭环测试
node tests/test_full_problem_inventory.mjs

# 4. 逐标签/值/位置批注与 Agent 审阅包 (NDJSON) 测试
node tests/test_annotation_anchor_system.mjs

# 5. 生产打包构建验证
npm run build
```

---

## 📄 许可声明

本项目遵循 MIT 开源协议。
