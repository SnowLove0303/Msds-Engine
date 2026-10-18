# Design

## Context

动机见 `proposal.md`。以下是塑造本方案所需的现状与约束。

- 转换实现集中在 `web/src/pdf-converter.js` 单一模块：后端为 Windows COM（经 `powershell.exe` 调 WPS/Word）与 `soffice`（硬编码 Windows 路径 + PATH 兜底）。可用性由 `isPdfConverterAvailable()` 单布尔表达。
- 该布尔串起 4 个出口：`POST /api/msds/convert-pdf-batch`（不可用 503）、`/api/msds/export` 的三处 PDF 分支（不可用直接 `throw`）。前端的"仅 PDF"与"全部 (Word+PDF)"入口默认启用（`formatPdf: true`）。
- Docker 镜像基于 `node:22-alpine`。实测容器内既无 `soffice`，也无 PowerShell，且 `fc-list` 计数为 0、`/usr/share/fonts` 不存在——即使补上转换器，中文内容仍会渲染为缺字方块。
- 导出主线是"先产出 DOCX 缓冲，再按格式需求转换 PDF"。当前 `format === 'both'` 在 PDF 不可用时整体抛错，**已生成的 DOCX 也一并丢失**。
- 仓库内存在金标样本对：`算法训练材料/PU-303C/PU-303C msds_CN 冠志 （手动）.docx` 与同名 `.pdf`（266 KB，WPS 产）。
- 交付链路已由 `openspec/specs/deployment-source-parity` 约束：本仓库是容器镜像的构建源，改动用"重建 + 客观验收 + 回滚 tag"流程推进。

## Goals / Non-Goals

**Goals:**

- 四层后端解析（环境变量 → Windows COM → 内置运行时 → 系统安装），并把"当前用的是哪个后端、为什么不可用"变成可观测事实。
- 容器自足：不在宿主机装任何东西，容器内即可完成中文 DOCX→PDF 转换。
- 可移植交付：发行包携带运行时目录，新设备拷贝后开箱即用。
- 能力预检 + 优雅降级：能力缺失在导出动作之前暴露，`both` 模式不再连带丢失 Word 产物。
- 同一运行时内可重复，并以金标样本建立可执行的保真度回归。

**Non-Goals:**

- 不自研 OOXML→PDF 渲染引擎。现有"锁定模板 / 高保真排版"契约要求分页与表格与 Word 同源，自研渲染无法满足。
- 不保证与 WPS COM 输出字节级一致，也不以"跨平台逐字节一致"为验收项。
- 不改变 DOCX 生成逻辑、模板锁定、批注体系与既有导出命名契约。
- 不把转换器二进制纳入 git 版本库。

## Decisions

### D1 后端解析顺序与平台策略

顺序：环境变量显式指定 → Windows COM（仅 Windows 且本机组件可用）→ 交付物内置运行时 → 系统已安装转换器。

理由：Windows 上现有的 WPS COM 路径是当前金标排版的来源，保留其优先可确保日常产出与客户交付不发生观感变化；其它平台与容器改由内置运行时兜底，从而消除"换设备即降级"。

替代方案：(a) 全平台统一内置运行时——可重复性最强，但会改变 Windows 现有成品观感；(b) 维持只探测系统安装——无法解决换设备降级，已被本次目标否决；(c) 独立转换微服务——不覆盖 Windows/macOS 裸机场景，留作后续压缩主镜像的可选项。

### D2 基础镜像由 alpine 换为 Debian slim

理由：LibreOffice 与 fontconfig 在 Debian 的打包成熟、行为可预测，字体替换可通过 `fontconfig` 配置精确控制。alpine 侧 LibreOffice 属社区包，体积与行为都更不可控，而本方案对"确定性"的要求高于体积诉求。

替代方案：`apk add libreoffice`（放弃，确定性不足）；多阶段把 LibreOffice 从官方镜像拷入（可减小体积，但跨发行版 libc 与依赖链风险高，留作优化）。

### D3 中文字体与替换映射

交付物内提供 Noto Sans/Serif CJK SC，并通过 fontconfig 为文档引用的常见字体名声明确定性替换（如 宋体/SimSun → Noto Serif CJK SC，黑体/SimHei、微软雅黑/Microsoft YaHei → Noto Sans CJK SC，Times New Roman → Liberation Serif）。

理由：不声明映射时由 fontconfig 自行挑选替换字体，不同机器/版本会挑到不同字体，直接导致换行与分页漂移——这正是要消除的"换设备降级"。

代价：替代字体与 Windows 字体的字宽/字距不完全相同，跨平台页数存在残余偏差，由 D6 的金标回归度量并固化。

### D4 转换确定性

- 运行时版本随交付物固定，不依赖运行时自更新。
- 使用固定的导出 filter 与固定临时目录策略，批量转换在同一次调用内完成。
- 容器内预置固定的 HOME/profile 目录并预热一次转换，避免首次运行生成用户 profile 带来的差异。

理由：同一输入应可重复产出内容一致的 PDF；profile 首次生成与非固定 filter 是常见的非确定性来源。

### D5 能力描述、预检与降级语义

引入单一"PDF 能力描述"结构，包含：可用性布尔、后端类型、后端版本、字体就绪状态、不可用原因。`GET /api/msds/health` 在其既有 `pdfConverterAvailable` 布尔字段之外追加该描述的字段（保留原字段以兼容既有消费者）。

导出侧：任何需要 PDF 的请求在生成文件之前完成预检。

- `both` 模式且 PDF 不可用 → 交付全部 DOCX，并在响应中标注 PDF 未生成及原因（**行为变更**：此前是整体失败，连 DOCX 都拿不到）。
- 仅 PDF 模式且 PDF 不可用 → 快速失败，不返回半成品，错误信息给出缺失组件与补救方式。

### D6 保真度验证工具

在运行时内使用 `poppler-utils`（`pdfinfo` 取页数、`pdftotext` 抽文本）做度量，不新增 npm 依赖，且测的就是真实运行时。

替代方案：引入 `pdfjs-dist` / `pdf-lib`——增加依赖，且度量对象与生产路径不一致。

基线口径（用户已定）：先分别用 Windows COM 与内置运行时转换金标样本，量出相对仓库金标 PDF 的页数与文本差异，再把容差固化进回归测试；页数"必须完全一致"不作为硬指标。

### D7 可移植交付形态

- 约定运行时目录 `tools/libreoffice/`，并在 `.gitignore` 中排除，避免二进制进版本库。
- 提供获取脚本 `scripts/fetch-pdf-runtime.ps1`（Windows）与 `.sh`（Linux/macOS），从官方归档下载并解包到该目录。
- **发行 ZIP 可把 `tools/libreoffice/` 一并打包**，从而满足"拷贝交付物到新设备即可用"；仅持有 git 检出时，先跑一次获取脚本（一次性准备，而非逐台安装组件）。

### D8 与交付链路规约的衔接

本次修改 `Dockerfile` 属交付链路变更，实施时必须遵循 `deployment-source-parity`：先记录回滚 tag 与变更前状态，重建后以"容器内源码哈希对齐 + 产物可验证 + 接口可用"验收；任何带 purge 语义的目录操作前先完整归档待保护目录。

## Risks / Trade-offs

- [内置运行时与 WPS 分页不一致] → 先测量后固化容差，金标回归纳入自动化测试；不设"页数完全一致"硬指标。
- [CJK 字体度量差异引起换行/行高漂移] → 显式字体替换映射 + 金标回归；若偏差集中在特定字号，补充按字号/字体的映射规则。
- [镜像由 285 MB 增至约 600–900 MB] → 用户已接受；后续可用多阶段拷贝或独立转换容器压缩。
- [首次转换因 profile 初始化而变慢或产出不稳] → 容器构建期预热一次转换并固定 HOME。
- [poppler-utils 只服务测试] → 若在意体积，可仅在测试镜像阶段安装，生产阶段不含。
- [Windows 与 Linux 产出存在差异] → 明确列为非目标；契约只要求"同一运行时内可重复"。
- [`both` 降级语义属行为变更] → 在 proposal 与本设计中显式标注，并在测试中固定该语义，避免被误判为回归。

## Migration Plan

1. 先落能力描述与预检（对现有可用环境不改变行为）。
2. 改造容器：换基础镜像、装运行时与字体、加替换映射，按 `deployment-source-parity` 流程重建并验收。
3. 落实可移植目录约定与获取脚本，并更新交付打包说明。
4. 用金标样本实测两种后端差异，固化容差并落回归测试。
5. 前端按能力呈现导出选项。
6. 回滚：镜像可回到 `rollback-oct11`；`Dockerfile` 与源码变更可单独 revert，源码解析层变更与原后端路径保持兼容以便分步回退。

## Open Questions

- 金标容差的具体数值：由 D6 的实测结果决定，属可延后项，不影响规约与任务分解。
- 是否把运行时从主镜像拆为独立转换容器以压缩体积：属后续优化，不影响本变更的规约与任务。
