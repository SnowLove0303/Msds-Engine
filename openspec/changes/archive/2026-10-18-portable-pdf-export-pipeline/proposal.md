# Proposal

## Why

PDF 导出目前是"看设备脸色"的能力：服务端只探测 Windows COM（WPS/Word）与系统安装的 LibreOffice，而 Docker 运行的是 `node:22-alpine`，既无 PowerShell 也无 `soffice`，`fc-list` 字体数为 0，导致 `isPdfConverterAvailable()` 恒为 false——`POST /api/msds/convert-pdf-batch` 直接返回 503，三条导出流程直接抛错，"仅 PDF"与"全部 (Word+PDF)"入口在容器内完全不可用。结果是每更换一次设备或部署环境，就重新失去一次 PDF 交付能力。

## What Changes

- 把 DOCX→PDF 转换做成**交付物自带的平台自适应能力**：新增统一的转换运行时解析层，按"环境变量显式指定 → Windows COM（仅 Windows 且本机组件可用）→ 交付物内置运行时 → 系统已安装转换器"顺序解析，并回报所选后端与缺失原因。Windows 保留 COM 优先以维持现有金标排版与客户交付一致性，内置运行时服务 Docker、macOS 与新设备。
- Docker 交付自带转换运行时：镜像内安装 LibreOffice 与 CJK 字体（含字体名替换映射），容器不再依赖宿主机安装任何组件。
- 仓库/交付包支持内置可移植转换运行时目录（约定为 `tools/libreoffice`），新设备拷贝交付物即可获得 PDF 能力，无需逐台安装。
- 能力自检与导出前预检：`GET /api/msds/health` 回报后端类型、版本、字体就绪状态与不可用原因；导出流程在动手前完成预检，UI 在能力缺失时直接禁用 PDF 选项并给出可操作指引，替代"点了才 503/抛错"。
- 转换参数与确定性统一：固定导出 filter、字体替换、临时目录与超时策略，使同一 DOCX 在同一运行时下可重复产出内容一致的 PDF。
- 建立**保真度回归基线**：以 `算法训练材料/PU-303C/PU-303C msds_CN 冠志 （手动）.docx` 与其同名 `.pdf` 为金标样本，校验页数、文本完整性与表格几何的高一致性，并纳入自动化测试。

本变更不引入自研渲染引擎：PDF 一律由**已产出的 DOCX** 经真实 DOCX 解析器转换，确保分页、行高与表格与 Word 产出同源；不改变"先做 Word 产出，再转 PDF"的既有功能主线。

接口兼容性：无破坏性变更。`GET /api/msds/health` 的 `pdfConverterAvailable` 布尔字段保留并新增详情字段；`POST /api/msds/convert-pdf-batch` 与 `/api/msds/export` 的请求与响应结构保持不变。

## Capabilities

### New Capabilities

- `portable-pdf-export`: 交付物自带的跨平台 DOCX→PDF 转换能力。覆盖转换运行时的解析顺序与回退、容器与可移植交付的内置方式、字体与确定性约定、能力自检与导出前预检契约，以及基于金标样本的保真度验收标准。

### Modified Capabilities

（无。现有 5 个能力共 23 条 Requirement 均未覆盖导出或 PDF 转换，故本变更为新增能力而非修改既有规约。）

## Impact

- 代码：`web/src/pdf-converter.js`（重写探测与解析层、统一转换参数）、`web/src/msds-api-controller.js`（health 载荷、4 处 PDF 出口的预检与错误语义）、`web/src/main.js`（导出弹窗按能力可用性呈现）
- 交付：`Dockerfile` 与 `docker-compose.yml` 增加转换运行时与字体安装（镜像体积预期由 285 MB 增至约 600–900 MB）
- 新增测试：`web/tests/test_pdf_export_fidelity.mjs`（金标保真度）、`web/tests/test_pdf_runtime_resolution.mjs`（解析顺序与缺失原因）
- 影响接口：`GET /api/msds/health`（新增字段，向后兼容）
- 外部依赖：LibreOffice 与 CJK 字体，均随交付物提供
- 跨平台范围：Docker（Linux）、Windows 宿主机直跑、可移植交付（新设备拷贝即用）、macOS 与其它 Linux 发行版
