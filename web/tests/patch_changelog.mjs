import fs from 'fs';

const changelogPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/CHANGELOG.md';
let changelog = fs.readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n');

const entry = `## [2026-11-16 通用拓扑解耦、动态预设治理与自适应交付矩阵全面落盘 (v9.0-ENTERPRISE)] - 严格遵循 OrbitStack (Ps-openspec) 与用户四大企业级要求，彻底落实“三层正交解耦”哲学（模板=排版拓扑/源文件=化学事实/预设=主体元数据），终结代码中写死“冠志/国彩”与死板“8格式”的陈旧假设：
- **REQ-01: 企业预设管理中心 (CRUD + 设为默认)**：
  - 扩展 \`web/src/msds-db.js\`，支持中英文全称、简称、社会信用代码、注册地址、应急/技术电话、传真、邮编及 \`is_default\` 状态机；
  - \`web/src/main.js\` 新增预设可视化编辑表单，支持直接在 Web UI 上新增、编辑、删除预设与一键设为系统默认；
  - 后端打通 \`POST /api/msds/presets/:id/default\`、\`GET /api/msds/presets/default\` 等 REST API 路由。
- **REQ-02: 模板手动更换与 16 章节拓扑自省可视化**：
  - \`web/src/main.js\` 新增“模板拓扑自省”弹窗与上传通道，打通 \`POST /api/msds/templates/inspect\`；
  - 实时透视模板 16 章节大纲树、表格数、行数、列宽标尺及关键字段插槽完备性，自动校验 16 章节合法性。
- **REQ-03: Agent 动态感知与 Gate 1 交互意图对齐**：
  - 升级 \`C:\\Users\\Administrator\\.gemini\\config\\skills\\msds-studio\\SKILL.md\` 至 v9.0-ENTERPRISE；
  - Phase 0 动态探测当前模板库与企业预设清单；Gate 1 必须向用户呈现模板与预设选择选项、推荐默认并由用户确认交付范围，彻底废止主观硬编码假设。
- **REQ-04: 自适应多格式交付矩阵 ($N_{\\text{presets}} \\times N_{\\text{languages}} \\times N_{\\text{formats}}$)**：
  - \`web/src/pipeline-engine.js\` 新增 \`executeAdaptiveDeliverablesPipeline\`，按需产出任意笛卡尔积组合（支持单主体英文 Word 1 份、单主体双语双格式 4 份、双主体双语双格式 8 份或多主体扩展）；
  - \`web/scripts/audit_bipolar_bilayer.mjs\` 升级支持 \`expectedDeliverables\` 动态矩阵审计；
  - Web UI 导出中心支持格式 (Word/PDF)、语言 (中/英) 与企业预设自适应多选，实时渲染动态清单预览。
- **核心遇到问题与解法沉淀**：
  1. *PU-202A 毒理学第 11 节源文件混杂英文标签与中文值*：源文件写有 \`Species: 兔子\`、\`半数致死浓度.../Rat 雌性:\`、\`＜\`，导致原正则跳过。解法：在 \`pipeline-engine.js\` 中扩充双语标签匹配与标点容差，达成英文交付物 0 中文残留；
  2. *Section 2 审计脚本旧逻辑漏检多行拓扑*：PU-202A 为 6 行结构（Row 4 为防范说明、Row 5 为其他危险）。解法：升级为全表格扫描 \`tblsCn[1]\` 并兼容 840/960 动态标尺；
  3. *Section 3 组分表英文翻译漏网*：因全角破折号与 \`(DMAC)\` 别名未入词典。解法：在 \`context-governor.js\` 中扩充别名映射与模糊匹配。
- **实测验证凭据**：\`run_full_regression.mjs\` 全流程 5 大核心模块 100% 通过（ExitCode 0），OpenSpec \`universal-topology-and-dynamic-presets\` 严格校验通过。

`;

const targetHeader = '# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n';
if (!changelog.includes(targetHeader)) {
  throw new Error('targetHeader not found in CHANGELOG.md');
}

const updatedChangelog = changelog.replace(targetHeader, targetHeader + entry);

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/proposed_changelog.md', updatedChangelog, 'utf8');
console.log('proposed_changelog.md generated!');
