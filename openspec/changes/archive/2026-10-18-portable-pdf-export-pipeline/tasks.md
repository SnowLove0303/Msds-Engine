# Tasks

## 1. 能力描述与导出预检

- [x] 1.1 在 `web/src/pdf-converter.js` 引入单一 PDF 能力描述对象（可用性、后端类型、后端版本、字体就绪、不可用原因），并为现有 Windows COM 与系统 `soffice` 两条路径填充分支；验证：本机实测 `backend=com`、`available=true`、`fontsReady=true`，且 `isPdfConverterAvailable()` 旧布尔语义保持同源
- [x] 1.2 扩展 `GET /api/msds/health`，在保留 `pdfConverterAvailable` 的同时追加能力描述字段；验证：`test_pdf_preflight_and_degradation.mjs` 断言旧布尔字段保留为 false、新详情含可用性/后端/字体状态/原因/补救方式，18 项断言通过
- [x] 1.3 在 4 个 PDF 出口（`/api/msds/convert-pdf-batch` 与两处 `/api/msds/export` 实现中的三个 PDF 分支）插入导出前预检，并把 `both` 模式改为交付 DOCX 并标注 PDF 缺失、仅 PDF 模式改为快速失败；验证：`test_pdf_preflight_and_degradation.mjs` 断言仅 PDF 返回 503 且零半成品、both 返回全部 DOCX 且带 `pdfOmitted.reason`、二进制响应带 `X-PDF-Omitted` 头，全部通过
  - 实施发现：`/api/msds/export` 存在两份实现，第二份（原 1015 行起）因条件完全相同而永远不可达；本次按任务范围对 4 处全部改造，**死代码去留未动**，建议另行开 change 处理

## 2. 后端解析层

- [x] 2.1 实现四层解析顺序（环境变量 → Windows COM → 交付物内置 `tools/libreoffice` → 系统安装转换器），记录最终选用后端与逐层否决原因；验证：能力描述含 `attempts`（四层齐全，未评估层标记 `skipped`），本机实测选中 COM，`test_pdf_runtime_resolution.mjs` 逐层断言通过
- [x] 2.2 新增 `web/tests/test_pdf_runtime_resolution.mjs`，断言：Windows 上有 COM 时优先 COM（即使内置可用）、环境变量覆盖全部来源、非 Windows 平台优先内置、内置优先于系统安装、仅系统可用时选中系统层、四层全缺时可用性为 false 且原因可读；验证：该测试 17 项断言全部通过
- [x] 2.3 统一转换调用使用解析结果，固定导出 filter 与临时目录策略；验证：同一份 DOCX 连续转换两次，页数相同且提取文本逐字相同

## 3. 容器自足化构建

- [x] 3.1 基于 `node:22-bookworm-slim`，在 `Dockerfile` 构建阶段二安装 LibreOffice、fonts-liberation、fontconfig 与 poppler-utils
- [x] 3.2 在镜像中装入 `docker/fonts/` 核心原中文字体并生效 `docker/fontconfig-local.conf` 映射，设置 `/opt/msds-pdf-profile` 固定 profile，并在构建期执行真实转换预热自检
- [x] 3.3 执行 Docker 镜像构建（`msds-engine-msds-engine:latest`），重启 `msds-engine` 容器并验证健康状态（HTTP 200 就绪）

## 4. 构建期原中文字体管线与映射（取代原可移植交付方案）

- [x] 4.1 约定构建期原字体目录 `docker/fonts/` 并加入 `.gitignore`（避免版权字体进版本库），保留 `README.md` 与 `.gitkeep`
- [x] 4.2 落地 `scripts/sync-build-fonts.ps1`，支持从宿主机 `C:\Windows\Fonts` 自动同步宋体/黑体/楷体/仿宋/雅黑（共 66.9MB）到构建目录
- [x] 4.3 落地 `docker/fontconfig-local.conf` 确定性映射：统一宋体/黑体/楷体/仿宋/雅黑中英文名称与 _GB2312 别名，西文映射到度量兼容的 Liberation，设置中文字体兜底

## 5. 前端能力呈现

- [x] 5.1 导出弹窗按能力描述呈现：能力缺失时禁用"仅 PDF"并显示原因与补救指引，"全部 (Word+PDF)"保留但标注 PDF 将缺失；验证：已实现并接线（`bootstrap` 拉取 `/api/msds/health` 能力、弹窗禁用态与警示块、导出前预检拦截仅 PDF 并放行 both 降级）
- [x] 5.2 确认既有导出命名与交互契约不回归；验证：`test_full_batch_export_scenario.mjs` 与 `test_multibaseline_export_system.mjs` 通过

## 6. 容器内保真度基线与回归验收（核心目标：Word 转 PDF 7 页无伤无漂移）

- [x] 6.1 在新构建的原字体容器内转换金标样本 `算法训练材料/PU-303C/PU-303C msds_CN 冠志 （手动）.docx`，固化 7 页保真度基线至 `web/tests/pdf_export_fidelity_baseline.json`
- [x] 6.2 容器内运行 `web/tests/test_pdf_export_fidelity.mjs`，验证页数与金标 Word 严格一致（7 页 vs 7 页，彻底告别 Noto 替代字体的 12 页漂移），断言 0 替代缺字字符与 100% 汉字标签结构覆盖
- [x] 6.3 运行全量回归套件：验证 `test_pdf_runtime_resolution.mjs`、`test_pdf_preflight_and_degradation.mjs` 全部通过，且 `GET /api/msds/health` 正确报告 `backend=bundled`、`available=true`、`fontsReady=true`

## 7. 文档同步与变更归档

- [x] 7.1 更新 `README.md` 与 `web/项目交接文档.md`，记录原字体构建说明与 PDF 转换无伤运行机制
- [x] 7.2 运行 OpenSpec 归档流程，将 delta specs 同步至主规约

