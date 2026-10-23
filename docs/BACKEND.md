# Backend Engineering Guide

## Baseline & Runtime (运行时基线与工程管理)

- 语言与运行时: Node.js (>= 18.0.0 LTS，推荐 Node 20 LTS)，项目全面采用原生 ES Modules 规范（`"type": "module"`）。
- 核心依赖库:
  - `@xmldom/xmldom` (^0.8.10): DOMParser 与 XMLSerializer 引擎，负责底层 OOXML DOM 树高效遍历与精确修补。
  - `jszip` (^3.10.1): DOCX 容器解包与无损重新打包。
  - `jsdom` (^26.0.0): 提供无头环境下的 DOM 环境支撑与 HTML 规约解析。
  - `better-sqlite3` / SQLite3: 本地结构化元数据持久化。
- 服务形态:
  - Web 集成模式: 通过 Vite 开发服务器集成 Express 风格中间件路由（端口 5173）；
  - 独立无头模式: `web/src/api-server.mjs` 原生 HTTP 监听器（端口 5174），专供 AI Agent 与自动化脚本调用。
- 构建与脚本管理: 依赖管理统一收敛于 `web/package.json`，使用 `npm` 进行依赖安装与命令执行。

## Package & Layering Boundaries (包结构垂直分层与边界)

```text
web/src/
├── api-server.mjs             # 无头 Agent HTTP 服务主入口
├── msds-api-controller.js     # REST API 传输层适配与路由控制器
├── pipeline-engine.js         # 四阶段生成中枢、预设派生与批处理
├── smart-matching.js          # 16 章节插槽模式路由与无值剪枝中枢
├── docx-engine.js             # 底层 OOXML 解析、排版注入与样式控制
├── bilingual-mapping-set.js   # 中英专业词汇与 GHS 翻译词典
├── annotation-engine.js       # 6 维稳定审阅锚点与批注包生成器
├── render-utils.js            # 共享排版与表格对齐格式化工具
└── main.js                    # Web 端主控制器
```

分层协作准则:
1. 传输层 (`api-server.mjs`, `msds-api-controller.js`): 专注请求解析、参数校验、Header 处理与统一 JSON 响应封装，不掺杂 OOXML XML 节点操作。
2. 流水线层 (`pipeline-engine.js`): 专注多格式生命周期编排（识别 -> 智能匹配 -> 模板覆写 -> 导出 8 格式），并强制拦截源文件备份。
3. 核心计算与领域层 (`smart-matching.js`, `docx-engine.js`): 作为纯业务领域与底层核心，专注于 16 章节插槽规则、无值删行、字体注入（G-11）与行高压制。
4. 共享资产层 (`bilingual-mapping-set.js`, `public/templates/`): 保持只读与纯净字典映射，提供高确定性化工知识支撑。

## Configuration & Security Operations (配置管理与运行安全管控)

1. 源文件物理安全防篡改红线 (Source File Preservation):
   - 任何涉及目标 DOCX/PDF 写入的操作，必须由 `preserveOriginalFileBackup` 前置拦截；
   - 若检测到输入文件或同名已有文件，先安全克隆留存为 `<原文件名>_源文件留存.docx/pdf`；
   - 留存副本具备单向不可逆保护，后续任何流水线执行均严禁覆盖该留存文件。
2. 基准模板 SHA-256 锁定:
   - `web/public/templates/` 下的 4 份官方基准母版受哈希签名保护，代码中仅能以 Read-Only 方式读取并在内存解包，严禁将变更回写至母版物理路径。
3. 内存与文件流安全:
   - 文档解析与生成基于内存 Buffer 操作，临时文件在处理完毕后自动清理；
   - API 控制器必须在响应写入前完成序列化，并加入 `if (res.headersSent) return;` 防护，杜绝进程因异常崩溃。

## Persistence & Data Isolation (数据持久化、隔离与迁移设计)

1. 本地元数据持久化 (`web/data/msds_repo.db`):
   - 采用 SQLite 数据库轻量存储历史处理任务指纹、识别结果快照与批注锚点；
   - 仅持久化化工品名称、型号、CAS 号、语言与合规检查日志，严禁外传。
2. 产物目录物理隔离:
   - 批处理交付物与各型号生成的 8 格式产物严格收敛于各自专有输出目录（如 `output/` 或输入文件所在目录），保持文件命名的原子化和可追溯性。

## Concurrency (并发模型与线程安全规范)

1. 事件循环与异步 I/O:
   - Node.js 单线程基于非阻塞异步 I/O 处理网络请求与磁盘文件读写；
   - 针对计算密集型的多文档批量 ZIP 解压与大量 XML 节点遍历，采用分片或顺序队列（`queue`）逐个处理，防止瞬间 CPU 占满导致 HTTP 请求超时。
2. 任务状态互斥:
   - 单个文件正在执行覆写或导出时，建立任务锁状态标记（`isProcessing = true`），防止同一接口受到高频连击引发文件写入冲突。

## Backend Invariants & Verification (后端不变量与自动化验证)

1. 后端法定不变量:
   - 零中文残留门禁: 英文版交付物必须通过 `assertZeroChinese` 自动化断言；
   - 物理删行与重编号不变量: Section 2 无值行必须物理删行，剩余行序号必须连续（无断号）；
   - G-11 字体与排版不变量: 标签必须注入加粗与西文 Arial，数值必须注入常规体与西文 Times New Roman，压制 26pt 超大字号。
2. 验证执行准则:
   - 日常后端改动后，必须运行 `npm run test:smoke --prefix web` 确保核心 API 契约正常；
   - 必须运行 `npm run test:annotations --prefix web` 确保 20 维智能匹配与审阅包无破坏性衰退。
