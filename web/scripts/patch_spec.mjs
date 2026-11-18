import fs from 'node:fs';

let content = fs.readFileSync('../MSDS中英文覆写排版与数据装配全景统一工业级规范.md', 'utf8');

// Update Gate 10
content = content.replace(
  '或 **10 个半角空格**（英文版对齐 `Toxicity: `），使测试端点形成严整的垂直列对齐；',
  '或 **14 个半角空格**（英文版在 Arial 9.5pt 下精准对齐 `Toxicity: ` 的 3945 em 几何宽度），使测试端点形成严整的垂直列对齐；'
);

// Add Gate 13
const gate13 = `

### 5.13 Gate 13: Section 2 英文版换行首字对齐与层级对齐公理 (G-30 首字换行对齐与层级公理)
- **规则**：
  1. **标题与标题对齐 (Titles Align with Each Other)**：防范说明四大子标题（\`Prevention:\`、\`Response:\`、\`Storage:\`、\`Disposal:\`）统一左缩进 \`<w:ind w:left="480"/>\`，实现同级标题垂直完全对齐；
  2. **内容与内容对齐 (Content Items Align with Each Other)**：四大防范说明下的具体规程与条目（如 \`Wear protective...\`、\`Inhalation...\`、\`Store in a cool...\`、\`Empty containers...\` 等），统一左缩进 \`<w:ind w:left="960"/>\`，实现同级内容条目垂直完全对齐；
  3. **换行首字对齐 (First-Letter Alignment on Line Wrap)**：严禁使用 \`hanging\` 悬挂缩进；段落整体使用 \`left="480"\` 或 \`left="960"\`。当条目内部自然换行时（例如成盐声明第 2 行 \`concentration limit >= 5%\`），续行起始坐标与首行首字（\`N,N-...\` 的首字母 \`N\`）完全垂直对齐，彻底消除左侧悬挂突出或参差不齐现象。
- **一票否决**：检测到子标题未对齐（非 480）、内容条目未对齐（非 960）或存在悬挂缩进导致换行首字错位，立即阻断交付。`;

const oldGate12 = `### 5.12 Gate 12: 强制双极双层全景深度审计门禁 (Mandatory Deep Audit Mandate)
- **规则**：在生成 8 项交付物后，系统必须自动触发 \`audit_bipolar_bilayer.mjs\`，执行涵盖全局 5 大公理与 16 章节专属局部规范的全量 AST 断言。
- **一票否决**：必须获得实测真实退出码 0。存在任何 1 项失败（Failures > 0），流水线严禁放行。`;

content = content.replace(oldGate12, oldGate12 + gate13);

// Update appendix table
const oldRow = `| **Section 2.5 紧凑重排** | \`web/src/pipeline-engine.js\` | \`formatPrecautionaryValueCell()\` |`;
const newRows = `| **Section 2.5 紧凑重排** | \`web/src/pipeline-engine.js\` | \`formatPrecautionaryValueCell()\` |\n| **Section 2 英文层级对齐与换行首字对齐** | \`web/src/docx-engine.js\` | \`renderFullWidthRow()\` |`;

content = content.replace(oldRow, newRows);

fs.writeFileSync('scripts/proposed_panoramic_spec.md', content);
console.log('Successfully wrote proposed_panoramic_spec.md');
