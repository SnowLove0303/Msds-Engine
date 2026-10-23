# ARCHITECTURE.md

## System Topology & Overview (系统全局拓扑与职责边界)

MSDS-Engine 采用双模态协同架构，支持“可视化三面板工作台”与“独立无头 Agent REST API 服务”两种运行模式：

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        用户交互层 / Agent 编排层                        │
│   Web Browser (原生 ES Modules + Vite)    │     AI Agent (CLI / HTTP)   │
└───────────────────┬────────────────────┴───────────────────┬────────────┘
                    │                                        │
                    ▼                                        ▼
    ┌───────────────────────────────┐        ┌───────────────────────────┐
    │  Web 交互工作台 (Port 5173)   │        │ Headless API (Port 5174)  │
    │  - 结构化识别工作台           │        │ - POST /api/msds/import   │
    │  - 智能匹配与无值剪枝工作台   │        │ - GET  /api/msds/recognit │
    │  - 模板安全编辑器工作台       │        │ - POST /api/msds/match    │
    │  - 审阅批注面板 & NDJSON 导出 │        │ - POST /api/msds/export   │
    └───────────────┬───────────────┘        └───────────────┬───────────┘
                    │                                        │
                    └───────────────────┬────────────────────┘
                                        ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │                            核心引擎层                              │
    │  - docx-engine.js        : OOXML 读写、样式/字体注入、超大行高压制 │
    │  - smart-matching.js     : 16 章节插槽规约、无值剪枝、双语模板自适应│
    │  - pipeline-engine.js    : 四阶段流水线编排、8 格式交付与安全留存  │
    │  - render-utils.js       : 双垂线对齐、Excel 风格白底渲染管线      │
    └───────────────────────────────────┬────────────────────────────────┘
                                        ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │                         受保护资产与数据持久层                     │
    │  - web/public/templates/ : 官方基准母版 (SHA-256 哈希校验锁定)     │
    │  - web/data/msds_repo.db : SQLite 本地元数据与识别记录持久化       │
    │  - output/ & 留存副本    : *_源文件留存.docx/pdf (只读防覆盖母本)  │
    └────────────────────────────────────────────────────────────────────┘
```

职责边界划分:
- 前端 (Browser): 负责结构化识别展示、匹配插槽微调、模板表格可视化审阅与批注交互；严禁直接对磁盘源文件原地修改，所有写操作基于内存中虚拟 DOM 与 OOXML 抽象数据。
- 后端与核心引擎 (Engine / Headless Service): 拥有 OOXML 解析、16 章节槽位映射、物理行剪枝、GHS 危险要素翻译、排版规范注入（G-11 字体）、PDF 转换驱动以及源文件备份（`preserveOriginalFileBackup`）的绝对执行权。

## Repository Boundaries (顶层资产与仓库边界)

```text
MSDS-Engine/
├─ AGENTS.md             # 全仓 Agent 行为总入口、操作不变量与交付门禁
├─ ARCHITECTURE.md       # 系统全局拓扑、模块单向依赖与跨端契约
├─ docs/                 # 跨领域端侧规范 (FRONTEND.md, BACKEND.md)
├─ openspec/             # OpenSpec 规范驱动资产 (specs/ 与 changes/)
├─ web/                  # 核心 Web 工作台与 Node.js 服务工程
│  ├─ src/               # 核心引擎源码 (docx-engine, smart-matching, pipeline-engine)
│  ├─ public/templates/  # 官方基准母版库 (只读锁定)
│  ├─ data/              # 本地数据库 (msds_repo.db) 与缓存
│  └─ tests/             # 自动化回归与冒烟测试集
├─ scripts/              # 跨平台维护与部署更新脚本
├─ docker/ & Dockerfile  # 容器化部署编排与运行环境配置
├─ .agents/skills/       # Agent 驱动专用 Skill 规约 (msds-studio 等)
└─ CHANGELOG.md          # 历史攻坚、问题根因与解法闭环沉淀记录
```

### Backend Structure
- `web/src/api-server.mjs` — 独立无头 Node.js HTTP 监听器服务入口（默认端口 5174）
- `web/src/msds-api-controller.js` — 提供 REST API 路由分发、请求参数解析与统一响应封装
- `web/src/docx-engine.js` — 基于 jszip 与 xmldom 的底模解包、段落与表格遍历、样式层级修改与打包序列化
- `web/src/smart-matching.js` — 包含 16 章节插槽模式库、置信度算法、无值剪枝与双语模板适配
- `web/src/pipeline-engine.js` — 负责单品到 4 预设多派生编排、8 格式物理导出与源文件无损留存拦截
- `web/src/bilingual-mapping-set.js` — 维护中英化工词汇、危化品 GHS 语句与防范说明的映射字典

#### Dependency Boundaries
- 传输与控制器层: `web/src/api-server.mjs` 与 `web/src/msds-api-controller.js` 作为网络入口，仅单向调用核心引擎服务，不包含任何 OOXML 节点级底层处理；
- 流水线编排层: `web/src/pipeline-engine.js` 编排四阶段生成流程并负责安全拦截，单向调用 `web/src/smart-matching.js` 与 `web/src/docx-engine.js`；
- 核心引擎计算层: `web/src/docx-engine.js` 与 `web/src/smart-matching.js` 保持纯领域逻辑纯粹性，仅依赖底层基础设施 `@xmldom/xmldom`、`jszip` 及 `web/src/bilingual-mapping-set.js`，绝不反向依赖网络或外层 UI；
- 资产访问防腐: `web/public/templates/` 模板资产受 SHA-256 签名只读防腐保护，严禁任何写通道原地覆写母版。

## Dependency Flow & Architecture Invariants (单向依赖流向与架构铁律)

全局单向依赖流向:
`底层工具库 (@xmldom, jszip) → 核心解析与匹配引擎 (docx-engine, smart-matching) → 流水线编排 (pipeline-engine) → 传输与服务层 (msds-api-controller, api-server) → 顶层工作台 (main.js, render-utils)`

架构级不变量清单:
1. 依赖单向严禁逆向: `docx-engine.js` 与 `smart-matching.js` 作为核心纯计算/解析层，绝对禁止反向导入外部 UI 视图层代码或 `main.js`；
2. 零破坏纯本地原则: 文档解析、提取与重新打包全程在本地执行，绝不上载至任何外部云服务；
3. 基准底模锁定: `web/public/templates/` 目录下的官方母版受 SHA-256 签名保护，代码中任何覆写逻辑严禁修改源模板文件，必须在内存副本中修改后另存导出；
4. 源文件绝对防篡改 (Source Preservation Invariant): 执行导出写入前，必须检查同名目标是否存在，首要执行安全克隆留存 `*_源文件留存.docx/pdf`，留存文件严禁二次覆盖；
5. 排版 G-11 字体分立: 导出的 DOCX 必须显式区分标签（加粗、Arial/黑体）与数值（常规体、Times New Roman/宋体），并压制非标题行中遗留的 26pt 超大行高。

## Cross-Boundary Contracts (跨端通信契约与协议规范)

Web 客户端与无头 Agent 服务统一遵循标准 REST 协议与 JSON 数据信封：

统一响应信封规范:
```json
{
  "code": 200,
  "success": true,
  "data": { ... },
  "message": "success",
  "timestamp": 1729584000000
}
```

核心 API 路由清单:
- `POST /api/msds/import`：接收源文件 Buffer 或路径，返回文档解析元数据；
- `GET  /api/msds/recognition`：获取源文件结构化 16 章节解析树（含 Section、Slot、Raw Text）；
- `POST /api/msds/match`：执行 16 章节智能语义匹配与插槽映射；
- `GET  /api/msds/match-result`：获取匹配结果、置信度分布与剪枝建议；
- `POST /api/msds/export`：触发 8 格式全套生成，返回各交付物物理路径与质检摘要。

错误与异常防护原则:
- 控制器层严格实施 `sendJson` 统一序列化，在写入响应头前完成序列化以防 `ERR_HTTP_HEADERS_SENT` 异常；
- 遇到文件缺失、XML 损坏或校验不通过时，返回明确的 400/500 业务错误信封，并由后端安全日志记录完整堆栈。

## Shared Data Architecture (全局数据模型与多租户隔离原则)

1. 核心领域数据模型:
   - `MSDSDocument`: 顶层文档实体，包含文件名、哈希指纹、语言标识（CN/EN）、企业主体（冠志/国彩）；
   - `SectionNode`: 16 大章节节点（Section 1 至 Section 16），包含章节标题、编号与包含的所有表格/段落；
   - `SlotRecord`: 语义插槽原子记录，包含 `key`、`label`、`value`、`role`（title/header/label/value/value-only）、`status`（MATCHED/EMPTY/NOT_APPLICABLE）；
   - `AnnotationAnchor`: 6 维稳定审阅锚点，记录章节索引、行号、列号、历史值与变更建议。
2. 数据隔离与持久化:
   - 单品作业以物理目录与文件名隔离，多派生输出严格隔离在各自型号目录中；
   - 本地数据库（`web/data/msds_repo.db`）采用 SQLite，仅存储文档指纹、识别缓存与质检历史，不硬编码外部敏感配方。

## Architectural Decisions & Evolution (核心架构决策与演进指引)

1. **ADR-001: 采用纯本地 Node.js + OOXML 直接操作替代 Office COM 自动化**
   - 决策: 基于 `jszip` 与 `@xmldom/xmldom` 直接解包和修补 `word/document.xml`，摒弃对 Windows Office COM / Word 进程的强依赖。
   - 理由: 消除 Word 弹窗、卡顿与并发崩溃，支持跨平台（Docker/Linux）部署，提升处理吞吐量 10 倍以上。
2. **ADR-002: 落地 OpenSpec 规格驱动与双语插槽动态剪枝**
   - 决策: Section 2/3/8/11/12 等复杂章节实行无值智能自底向上物理删行，而非保留空行；支持中英底模语种嗅探。
   - 理由: 彻底根治英文模板中文污染，确保导出的交付物篇幅紧凑（7 页标品），满足国际安全规范。
3. **ADR-003: 建立源文件留存保护与 8 格式多预设派生管线**
   - 决策: 在流水线中确立 `preserveOriginalFileBackup` 安全铁律，构建单次执行派生 4 DOCX + 4 PDF 的标准交付流水线。
   - 理由: 杜绝历史操作中原地覆盖母本的不可逆风险，实现企业级标准交付物一键闭环。

## MSDS Overwrite & Typography Invariants (中英文覆写与排版法定不变量)

系统严格遵照根目录《MSDS 中英文覆写排版与数据装配全景统一工业级规范 (v5.0.0)》执行，确立以下不可被后续任何变更篡改的法定不变量：

1. **唯一真理源（SOT）双通道统一公理**：Web 工作台编辑器交互导出与 Headless Agent API 自动化流水线，在字段映射、排版几何、模板剪枝与断言门禁上保持 100% 相同表现；
2. **值格 100% 纯左对齐与自然词距公理 (Flush Left Mandate)**：全篇所有章节表格的值格（Col 1+ 数据列）强制应用 `w:jc val="left"`，彻底消除 Word 两端对齐/分散对齐导致的词距与字距异常拉大；缩进彻底清零；
3. **第一列“文字对文字”垂线对齐公理**：
   - 常规章节统一采用 `420 dxa` 悬挂缩进；
   - Section 11（含 5 字符的 `11.10`，宽度约 452 dxa）专属放宽至 `565 dxa` 悬挂缩进（底模原生规范），彻底杜绝制表符溢出跳步弹飞；
   - 无序号标签（如 `Chemical category:` / `GHS Pictograms:`）强制右缩进（`420|565 dxa`）对齐文字首字母；
   - Section 8 `Recommendation:` 参照中文版规范取消缩进，顶格纯左对齐加粗；
4. **重点章节结构拓扑公理**：
   - Section 2：非危 4 行 / 危化 8 行动态切换；规整双列行免复合解耦，核心分类事实防误删保护；2.5 防范说明剔除重复总标题、取消大类间空行、小标题加粗、P 规程常规体；
   - Section 3：具体化学成分名称绝对严禁加粗，严禁追加多余冒号；
   - Section 9：所有数值与未测状态彻底废除居中，全部强制左对齐；
   - Section 11：15 行标准拓扑；11.7 生殖毒性跨列合并保护（`gridSpan="3"`, `w="6262"`）；
   - Section 13：严格重构为 4 行结构（2 行独立单列通栏说明行 + Disposal methods 双居中加粗 + 处置正文纯左对齐）；
5. **页脚法定规范**：Cell 0 公司全称型号强制绝对左对齐，Cell 1 `Revision Date:` 首字母大写强制绝对右对齐且同步当前最新时间；
6. **全流程 8 大自动化质量断言门禁 (Gate 1 ~ 8)**：所有发布前必须通过自动化断言（包含 Gate 8 值格常规体与字体纯净度断言，数值严禁加粗、中文严禁 Calibri 污染），任何一项失败立即抛出异常熔断。
