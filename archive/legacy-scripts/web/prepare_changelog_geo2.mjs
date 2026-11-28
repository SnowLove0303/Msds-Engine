import fs from 'node:fs/promises';

async function updateChangelog() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/CHANGELOG.md';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const entry = `## [2026-10-22] - 表格网格几何拓扑自愈中枢与纵向合并闭环治理 (根治11.7缩水缺角与悬空vMerge)

### 核心交付 (Delivered)
1. **OpenSpec 规格提案闭环**：
   - 确立 \`table-geometry-and-vmerge-normalization\` 规格，确立“表格行几何拓扑自愈与网格守恒”RFC 2119 规范；
   - 校验全绿合规并通过 VS Code 检阅。
2. **PU-202A 八格式全套基于自愈引擎重新产出**：
   - 经 MSDS Studio Agent API 生产，4 DOCX + 4 PDF 交付物已落地；
   - 底层 XML 证据证实：11.7 生殖毒性行单元格宽度严格补齐为 \`6262 dxa\`，显式注入 \`<w:gridSpan w:val="3"/>\`，彻底清除悬空的 \`<w:vMerge>\`，全行宽度严格达到 \`9781 dxa\`，右边框 100% 垂直齐平。

### 引擎重构与强约束法则 (Engine Refactoring & Invariants)
1. **表格几何拓扑自愈中枢 (\`normalizeRowGeometry\`)**：
   - 在 \`docx-engine.js\` 中构建通用几何自愈器，在 \`removeCellFromRow\` 内部自动挂载触发；
   - 无论何时删列或收敛复合行（如 Section 11 原生带“生育力/致畸形”的三列行），自动剥除单行上残留的 \`<w:vMerge>\` 标记；
   - 自动检测并补齐末列值单元格的宽度（6262 dxa）与跨列属性（\`gridSpan="3"\`），确保任何删列操作后整行总宽度与表格基准网格绝对守恒。
2. **Skill 全局规范强约束**：
   - 本地与全局 \`msds-studio/SKILL.md\` 同步追加第十小节第 3 条“表格网格几何守恒与纵向合并闭环法定不变量”，禁止任何未经几何补全的单元格删除行为。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1（11.7 生殖毒性表格右侧大幅缩水凹陷、右边框断裂且存在排版紊乱隐患）**：
  - **根因**：模板中 11.7 原型为 3 列多行复合行，包含了“生育力”等子项，Cell 0 带有跨 3 行的 \`<w:vMerge w:val="restart"/>\`，右侧值单元格宽度仅为 4316 dxa 且未设置跨列。此前在将其收敛为单行双列时，仅通过 \`removeCellFromRow\` 删除了中间的 Cell 1，未补齐剩余单元格的宽度（缺少 1946 dxa）与 \`gridSpan="3"\`，且遗漏了清除 Cell 0 上的悬空 \`vMerge\`。
  - **解法**：在底层构建 \`normalizeRowGeometry\`，在 \`removeCellFromRow\` 内部自愈机制闭环。删列后自动清理悬空 \`vMerge\`，自动将值单元格扩展为 6262 dxa 并注入 \`gridSpan="3"\`，实现操作自愈与全表总宽严格守恒。

---
`;

  content = content.replace('# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n', '# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n' + entry + '\n');
  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/CHANGELOG.proposed_geo2.md', content, 'utf8');
  console.log('Prepared scratch/CHANGELOG.proposed_geo2.md');
}
updateChangelog();
