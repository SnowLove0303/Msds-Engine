import fs from 'node:fs/promises';

async function updateChangelog() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/CHANGELOG.md';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const entry = `## [2026-10-22] - MSDS Engine 编辑器与 Skill 全局强约束：格式基于模板对齐与严格二元归类 (标签/值不可篡改)

### 核心交付 (Delivered)
1. **OpenSpec 规格提案闭环**：
   - 确立 \`strict-template-formatting-fidelity\` 规格，确立“二元语义归类”与“模板事实基准”RFC 2119 规范；
   - 校验全绿合规并通过 VS Code 检阅。
2. **PU-202A 八格式全套基于新规权威重新产出**：
   - 经 MSDS Studio Agent API 生产，4 DOCX + 4 PDF 交付物已落地；
   - 底层 XML 证据证实：悬挂缩进严格为 420 dxa，零制表位，行距 300 dxa，标签 Arial 12pt 加粗，值 Arial 12pt 常规非加粗。

### 引擎重构与强约束法则 (Engine Refactoring & Invariants)
1. **二元语义分类中枢 (\`applySemanticCellFormat\`)**：
   - 任何写入操作必须先归类为 \`label\` 或 \`value\`，严禁自由发挥或手写样式；
   - 归类为 \`label\`：强制确保加粗（\`<w:b/>\`）、行间距 300 dxa、字号 12pt；
   - 归类为 \`value\`：强制确保常规非加粗（彻底剔除 \`<w:b/>\` 与 \`<w:bCs/>\`）、行间距 300 dxa、字号 12pt、无悬挂缩进；
   - Section 9 复合标签：序号严格为 Times New Roman/Arial 10.5pt 加粗 + 尾随 1 个空格；标签严格为 Arial 12pt 加粗（与母版 100% 对齐，杜绝黑体）；悬挂缩进严格为 420 dxa，零制表位（彻底消除破坏排版的 \`<w:tabs>\`）。
2. **Skill 全局规范强约束**：
   - 本地与全局 \`msds-studio/SKILL.md\` 同步追加第十小节“模板文本格式强约束与二元归类法定不变量”，修正历史遗留的 457 dxa 描述。

### 遇到问题与解法 (Problems & Solutions)
- **问题 1（Section 9 标签与值混淆，视觉无法区分标签与文本）**：
  - **根因**：原代码在执行覆写时，缺少严格的二元分类中枢，部分单元格的值被错误继承了加粗属性；且标签中的悬挂缩进被手写为 457 dxa 甚至私自注入了 \`<w:tabs>\` 制表位，导致在 Word 界面中制表符异常跳格、标签字体与模板 Arial 脱节。
  - **解法**：全面以官方母版模板（\`正式模板_MSDS_CN_冠志(1).docx\` 与 \`正式模板_MSDS_EN_冠志(1).docx\`）的底层 XML 为唯一客观事实来源，将所有手写格式收敛为 \`applySemanticCellFormat\` 与 \`formatSection9LabelCell\`。悬挂缩进归一为 420 dxa，彻底剔除 \`<w:tabs>\`，标签统一为 Arial 12pt 加粗，值统一为 Arial 12pt 常规非加粗。

---
`;

  content = content.replace('# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n', '# MSDS Engine 变更与演进日志 (CHANGELOG)\n\n' + entry + '\n');
  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/CHANGELOG.proposed_semantic.md', content, 'utf8');
  console.log('Prepared scratch/CHANGELOG.proposed_semantic.md');
}
updateChangelog();
