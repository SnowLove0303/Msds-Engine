# PDF 导出能力建设 —— 目标与进展报告

- 报告时间：2026-10-18 01:1x (Asia/Shanghai)
- 关联 OpenSpec change：`portable-pdf-export-pipeline`（项目内根 `F:\docker\projects\Msds-Engine`）
- 目标仓库：`F:\docker\projects\Msds-Engine`（Docker 交付的构建源）
- 最近提交：af2649f ﻿feat(deploy): docker 构建源码对齐 v1.5.0-Complete (2026-10-17)
- 未提交改动：21 项（新增 13 / 修改 8 / 删除 0）

---

## 1. 目标

### 1.1 原始诉求

> 「我希望把 pdf 的导出功能完整融入系统，避免每次换设备就降级」

即：DOCX→PDF 不应依赖"目标设备恰好装了什么"，而应作为交付物自带能力，在换设备/换环境时保持可用。

### 1.2 目标演进（过程中被明确或修正的口径）

| 时点 | 你的决定 | 对方案的影响 |
|:--|:--|:--|
| 起 | 保真度口径：**先产 Word，再把 Word 转 PDF**，要求分页/行高/表格高一致 | 排除自研渲染引擎，必须用真实 DOCX 解析器 |
| 起 | 覆盖 Docker / Windows 直跑 / 可移植交付 / macOS 等 | 需要平台自适应解析 |
| 起 | Windows **保留 WPS COM 优先**（维持现有金标排版） | 解析顺序定为：环境变量 → COM → 内置 → 系统 |
| 起 | 体积可接受 | 初版按"镜像内装 LibreOffice"设计 |
| 中 | 基线口径：**先实测对比，拿到数据再定阈值** | 这一步直接抓出了分页不一致的严重问题（见 §3） |
| 中 | 「两头都不内嵌，完全用本地」 | 一度整体回退，回收 1,524 MB |
| **最新** | **「docker 的转换保留」+ 字体放构建目录、构建时 COPY** | **现行方案：镜像自带 LibreOffice + 原中文字体；不再做可移植目录** |

---

## 2. 一句话结论

**技术上完全可行，且已证明"分页与 Word 一致"在容器内可达成。** 唯一的硬条件是：容器必须装入文档实际使用的中文字体。当前卡点是**镜像重建被 Docker Hub 的 IPv6 元数据请求挡住**（与本变更无关的网络问题），不是方案本身的问题。

---

## 3. 关键实测发现（本次最有价值的产出）

同一镜像、同一份金标样本 `算法训练材料/PU-303C/PU-303C msds_CN 冠志 （手动）.docx`：

| 运行时 / 渲染字体 | 页数 | 标签结构 | 缺字替代字符 | 汉字覆盖率 |
|:--|--:|--:|--:|--:|
| 金标 PDF（WPS 产） | 7 | 69 | 0 | — |
| Windows WPS COM | **7** | 69 | 0 | 100%（归一化文本 0 差异） |
| Windows 便携 LibreOffice 26.8.1（用系统真字体） | **7** | 69 | 0 | 99.82% |
| 容器 LibreOffice 7.4.7 + **Noto 替代字体** | **12** ✗ | 69 | 0 | 99.78% |
| 容器 LibreOffice 7.4.7 + **真宋体/黑体/楷体** | **7** ✓ | — | — | —（该轮仅测页数） |

**根因结论：分页漂移来自字体度量差异，不是 LibreOffice、也不是容器化本身。**

- 结构（69 个标签/条款行）与缺字（0 个替代字符）在所有配置下都正确；
- 汉字数 +7.63% 恰好等于页脚文字多重复 5 次 —— 说明唯一失败项就是分页；
- 装入原字体后页数立刻回到 7（三组 fontconfig 变体均为 7 页）；
- 附带结论：Debian 自带较老的 LibreOffice **7.4.7 也足够**，无需升级。

**衍生限制**：宋体/黑体/楷体为微软专有字体，**不得随开源仓库或对外镜像分发**。因此字体走"构建目录 + 构建时 COPY"（`.gitignore` 排除），含字体的镜像仅限内部使用。

---

## 4. 已完成（代码层，均未提交）

| 能力 | 落点 | 验证证据 |
|:--|:--|:--|
| 单一 PDF 能力描述（可用性/后端/版本/字体就绪/原因/补救/逐层否决） | `web/src/pdf-converter.js` | 本机实测 `backend=com`；容器实测 `backend=bundled` `version=LibreOffice 7.4.7.2` |
| 四层后端解析（环境变量 → Windows COM → 内置 → 系统） | 同上 | `web/tests/test_pdf_runtime_resolution.mjs` **17 项断言通过** |
| 运维开关 | 同上 | `MSDS_PDF_SOFFICE` / `MSDS_PDF_FORCE_COM` / `MSDS_PDF_DISABLE` / `MSDS_PDF_BUNDLED_DIR` / `MSDS_PDF_PROFILE_DIR` |
| health 能力详情（保留旧布尔字段） | `web/src/msds-api-controller.js` | `web/tests/test_pdf_preflight_and_degradation.mjs` **18 项断言通过** |
| 4 个 PDF 出口导出前预检 | 同上 | 同上 |
| **优雅降级**：`both` 模式 PDF 缺失仍交付 Word 并标注原因；仅 PDF 快速失败、零半成品；二进制响应带 `X-PDF-Omitted` | 同上 | 同上 |
| 前端能力呈现（禁用「仅 PDF」+ 原因与补救；both 标注 PDF 将缺失；导出前拦截） | `web/src/main.js` + `styles.css` | 已接线；**浏览器内视觉确认待人工执行** |
| 确定性转换（固定 `pdf:writer_pdf_Export`、固定 profile 目录） | `pdf-converter.js` | 见任务 2.3（容器内复测待做） |
| 保真度回归 + 基线（先测量后固化容差） | `web/tests/test_pdf_export_fidelity.mjs`、`pdf_export_fidelity_baseline.json` | 正/负向均按预期（收紧覆盖率为 1.0 时正确失败） |
| 既有导出契约回归 | — | `test_full_batch_export_scenario.mjs`、`test_multibaseline_export_system.mjs` 通过 |

**既有导出契约的 1 个例外（已定性）**：`test_export_filename.mjs` 无法运行 —— 它硬读 `E:\冠志\...\OS-1030 msds_CN 冠志.docx`，该文件不存在。其导入图仅含 `docx-engine.js`，**不触及本次改动模块**，故为环境性缺失而非回归。

---

## 5. 当前状态（含必须知道的中间态）

### 5.1 运行环境

- 容器 `msds-engine`：healthy，镜像是**旧版 1.1GB（含 Noto 字体）**；
- **注意**：该容器内现在有我做实验时**手工 `docker cp` 进去的真宋体**（临时层）—— 所以**此刻容器里 PDF 可用且是 7 页**，但这**无法从当前 Dockerfile 复现**，重建容器即失效。

### 5.2 仓库文件（现行方案已落盘，待重建验证）

| 项 | 状态 |
|:--|:--|
| `Dockerfile` | 已改为**路线 1**：Debian slim + `libreoffice-writer` + `docker/fonts` 原字体 + fontconfig 映射 + poppler-utils，含构建期预热 |
| `docker/fonts/` | 已放 **5 个原字体（66.9 MB）**：simsun/simhei/simkai/simfang/msyh；`.gitkeep` 与 `README.md` 入库，字体本体被 git 忽略 |
| `docker/fontconfig-local.conf` | 已按原字体重写（字体名归一 + 西文 Liberation 替代 + 中文兜底） |
| `scripts/sync-build-fonts.ps1` | 已加：一键从 `C:\Windows\Fonts` 同步字体到构建目录 |
| `.gitignore` / `.dockerignore` | 已修正（字体排除、README 可跟踪、清理失效条目） |
| 已删除并回收 | `tools/libreoffice`（**1,524 MB**）、`scripts/fetch-pdf-runtime.ps1/.sh`、`tools/README.md` |

### 5.3 规格状态

- 本 change（`portable-pdf-export-pipeline`，19 个任务）：见 §6，其中**任务 4.x 的勾选已因范围变更而过时**（"可移植交付 + 获取脚本"这条路已被取消）；
- 另一个 change 已归档：`2026-10-17-docker-deployment-source-sync`（含当时的事故与恢复取证）。

---

## 6. 未完成与阻塞

### 6.1 任务状态

| 任务 | 记录状态 | 实际 |
|:--|:--|:--|
| 1.1 / 1.2 / 1.3 | 已完成 | ✅ 已验证 |
| 2.1 / 2.2 | 已完成 | ✅ 已验证 |
| 2.3 确定性转换复测 | 未勾选 | 待容器内复测 |
| 3.1 / 3.2 / 3.3 容器自足化与验收 | 未勾选 | **曾以 Noto 配置验证通过；字体策略已改，需按新配置复验** |
| 4.1 / 4.2 / 4.3 可移植交付 | 记录为已完成 | ⚠️ **已被最新决定取消**，其产物已删除；tasks 条目需改写 |
| 5.1 / 5.2 前端与回归 | 已完成 | ✅（5.1 浏览器视觉待人工） |
| 6.1 保真度基线 | 未勾选 | 基线文件已产出；需补记"原字体 = 7 页"这一组 |
| 6.2 保真度回归 | 未勾选 | 测试可用；**在 Noto 配置下会正确失败（12≠7）**，新配置下应通过，待复验 |
| 6.3 无缺字与结构断言 | 未勾选 | ✅ 已验证（0 替代字符、标签 69=69） |
| 7.1 文档更新 / 7.2 归档 | 未开始 | 待做 |

### 6.2 阻塞项

1. **镜像重建失败（网络，非方案问题）**：BuildKit 解析 `node:22-bookworm-slim` 元数据时走 **IPv6**（`2a03:2880:...:443`）而该网络无 IPv6 路由，连续两次同一处超时。可行绕法：关闭 BuildKit 走经典构建器直接复用本地基础镜像，或恢复网络/Docker Desktop 的 IPv4 出口。
2. 重建成功后需复跑：容器内保真度回归（期望 **7 页通过**）+ 健康检查（期望 `backend=bundled`）+ 转换耗时（暖态）。
3. 归档前需把 §6.1 的过时条目改写，使规约与最终范围一致（字体策略、取消可移植交付）。

---

## 7. 体积与速度账（供决策）

| 指标 | 数值 |
|:--|:--|
| 镜像（含 LibreOffice + Noto） | 285 MB → **1.1 GB** |
| 本次优化 | 去掉 `fonts-noto-cjk`（约 200 MB），改带原字体（66.9 MB）→ 预计净减 |
| 单次转换 · Windows WPS COM | **7.7 s** |
| 单次转换 · Windows 便携 LibreOffice（首次，profile 冷） | 51.8 s |
| 一次性开销 | apt 安装 262 s；镜像导出层 20 s |
| 已回收 | 1,524 MB（删除便携运行时） |

---

## 8. 建议的下一步（按性价比排序）

1. **恢复网络后重建镜像**（或用经典构建器绕过），随后复跑三项复验：保真度（7 页）、能力标签（`backend=bundled`）、暖态转换耗时。这一步做完，"Docker 里 Word→PDF 做得好不好"就有确定答案：**好，且与 Word 分页一致**。
2. **改写 tasks 4.x 与 design 的字体决策**（取消可移植交付、字体改为原字体），使规约与实现一致；补记 6.1 的新增测量组。
3. **提交**：本次约 21 项改动一次性提交（含字体目录的 README/.gitkeep 与同步脚本，字体本体不入库）。
4. 可选：人工在浏览器确认导出弹窗的能力缺失呈现（项目"UI 真实核验原则"）。

---

## 9. 附：关键文件清单

- 能力与转换：`web/src/pdf-converter.js`
- 接口与预检：`web/src/msds-api-controller.js`
- 前端呈现：`web/src/main.js`、`web/src/styles.css`
- 测试：`web/tests/test_pdf_runtime_resolution.mjs`、`test_pdf_preflight_and_degradation.mjs`、`test_pdf_export_fidelity.mjs`、`pdf_export_fidelity_baseline.json`
- 交付：`Dockerfile`、`docker/fontconfig-local.conf`、`docker/fonts/`（README + .gitkeep；字体本体 git 忽略）、`scripts/sync-build-fonts.ps1`
- 规格：`openspec/changes/portable-pdf-export-pipeline/`（proposal / specs / design / tasks）