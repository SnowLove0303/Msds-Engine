# MSDS-Engine 系统发行说明 (Release Notes)

- **版本**: v1.6.0 (2026-10-18)
- **工程名称**: MSDS-Engine (MSDS 智能识别、规范匹配、模板覆写与 PDF/Word 双格式导出引擎)
- **Git 仓库**: [SnowLove0303/Msds-Engine](https://github.com/SnowLove0303/Msds-Engine)
- **主要分支**: `main` | **发布标签**: `v1.6.0`

---

## 一、版本核心升级摘要

MSDS-Engine v1.6.0 是面向跨平台容器化部署、Word/PDF 双格式一体化导出与生产级视觉体验的重大里程碑版本，重点完成了以下三大核心能力的系统级突破与闭环：

### 1. 容器内无头 LibreOffice PDF 高保真导出管道
- **Linux 容器环境全链路打通**：在 Docker 容器（Debian/Node）内集成 LibreOffice 无头导出组件与 fontconfig 字体配置，彻底消除跨平台字体缺失与排版变形问题；
- **能力自愈与预检接口**：后端新增 `/api/msds/health` 探针与多层级回退机制，前端导出弹窗根据服务能力动态呈现“PDF 导出”就绪态；
- **自动化字体同步机制**：提供 `scripts/sync-build-fonts.ps1` 与 `docker/fontconfig-local.conf`，保障 Windows/Linux 渲染效果像素级一致。

### 2. 预览视口 30px 深灰粗框彻底根除与自适应缩放修复
- **穿透覆盖第三方库硬编码样式**：针对 `docx-preview` 运行时动态往内联 `<style>` 注入 `background: gray !important` 与 30px 边框的底层行为，在 `web/src/styles.css` 中以最高优先级语义穿透强行覆盖为 `#ffffff !important` 与无缝背景；
- **三视图纯白无缝连续**：单页模式、连续分页模式与自适应缩放模式下均呈现纯白专业视口，消除突兀深灰粗边；
- **缩放引擎选择器对齐**：修复 `main.js` 中 `applyDocxFitToWidth` 对 `.docx-preview-wrapper` 与 `section.docx-preview` 的双层等比宽度计算，彻底解决缩放错位；
- **自动化质量断言套件**：引入运行时 DOM 计算样式测试（`tests/scratch_docx_dom.mjs`）与静态 CSS 规则契约测试（`tests/test_preview_background_contract.mjs`），杜绝样式回归。

### 3. OpenSpec 全量规范归档与工程体系升级
- **34 项历史变更安全归档**：历史所有功能设计、变更提案与任务清单完整归档至 `openspec/changes/archive/`，主规格契约完全同步更新；
- **规范体系就绪**：保持 OpenSpec 体系严谨运转，代码与规约 100% 对应。

---

## 二、关键变更文件清单

| 类别 | 文件路径 | 变更说明 |
| :--- | :--- | :--- |
| **版本元数据** | `web/package.json` | 版本升级为 `1.6.0` |
| **样式与视觉** | `web/src/styles.css` | 穿透覆盖 docx-preview 内联 gray，确保 `#ffffff` 纯白无缝背景 |
| **视图与控制器** | `web/src/main.js` | 修复 `applyDocxFitToWidth` 选择器，集成 PDF 预检能力 |
| **导出后端引擎** | `web/src/pdf-converter.js` | Linux LibreOffice 命令行调用与安全临时目录清理 |
| **API 服务层** | `web/src/msds-api-controller.js` | 注入 `/api/msds/health` 探针与 PDF 导出调度逻辑 |
| **字体与容器** | `docker/fonts/*`, `docker/fontconfig-local.conf` | Linux 容器环境标准中英文字体库与配置 |
| **运维脚本** | `scripts/sync-build-fonts.ps1` | 自动同步本机系统字体至 Docker 构建目录 |
| **自动化测试** | `web/tests/test_preview_background_contract.mjs`<br>`web/tests/scratch_docx_dom.mjs` | 背景计算样式与规则契约回归测试 |
| **工程文档** | `RELEASE_NOTES_v1.6.0.md`<br>`web/项目交接文档.md` | 本次发版说明与跨设备操作指南 |

---

## 三、快速启动与跨设备使用指南

### 1. 新设备极简一键运行（推荐：Docker 容器）

在另一台电脑上只需安装好 Git 与 Docker Desktop：

```bash
# 1. 克隆代码仓库
git clone https://github.com/SnowLove0303/Msds-Engine.git
cd Msds-Engine

# 2. 构建并后台启动容器
docker compose build
docker compose up -d

# 3. 访问工作台
# 浏览器打开: http://localhost:5173/
```

### 2. 本地 Node.js 源码开发模式

```powershell
cd web
npm install
npm run dev -- --host 127.0.0.1
# 浏览器打开: http://127.0.0.1:5173/
```

### 3. 运行质量门禁测试

```bash
docker exec msds-engine node tests/test_preview_background_contract.mjs
docker exec msds-engine node tests/scratch_docx_dom.mjs
```

---

## 四、后续工作建议（交接提示）

1. **模板多变体扩展**：可在 `web/data/msds_repo.db` 与 `web/public/templates/` 中持续注册新的企业专用模板；
2. **批量处理流水线**：可基于现有 Agent API 进一步拓展多任务并行批处理。
