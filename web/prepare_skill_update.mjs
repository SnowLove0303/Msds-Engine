import fs from 'node:fs/promises';

async function updateSkill(skillPath, outputPath) {
  let content = await fs.readFile(skillPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. 修正历史的 457 dxa 悬挂缩进与 459 制表位为母版事实 420 dxa
  content = content.replace(/统一 457 dxa 悬挂缩进，459 dxa 显式制表位/g, '严格按照母版模板事实（420 dxa 悬挂缩进，零制表位，行间距 300 dxa）');

  // 2. 在文档最后追加第十小节：模板文本格式强约束与二元归类法则
  const invariantSection = `
---

## 🔒 十、 模板文本格式强约束与二元归类法定不变量 (Template Formatting Invariant)

**最高准则：格式基于模板，只允许进行归类，严禁随意篡改。**

1. **二元语义归类机制 (Binary Classification Policy)**：
   - 任何写入操作必须先明确归类为 **标签 (Label)** 或 **值 (Value)**；
   - **归类为标签（Label）**：强制产出模板定义的标签文本格式。
     - 基础表格标签：\`Arial\`（或模板既定字体）12pt 加粗（\`w:sz="24"\` \`<w:b/>\`），行间距 300 dxa（\`w:line="300"\`）；
     - Section 9 复合序号标签：严格分为序号与标签双 Run 结构。序号必须为 Times New Roman（中文）/ Arial（英文）10.5pt 加粗（\`sz="21"\`）+ 尾随 1 个空格；标签必须为 \`Arial\` 12pt 加粗（\`sz="24"\`，**严禁私自使用黑体**）；段落严格注入 \`w:ind w:left="420" w:hanging="420"\` 与 \`w:line="300"\`，**彻底杜绝注入任何 \`<w:tabs>\` 制表位**。
   - **归类为值（Value）**：强制产出模板定义的值文本格式。
     - 必须为常规非加粗（彻底剔除 \`<w:b/>\` 和 \`<w:bCs/>\`）；
     - 字号保持小四 12pt（\`sz="24"\`），行间距 300 dxa；
     - 严禁残留悬挂缩进（\`no-ind\`）。
2. **严禁随意篡改排版参数**：
   - 严禁自动化脚本私自将模板中的 Arial 字体替换为黑体或宋体；
   - 严禁私自加大行距或篡改悬挂缩进；
   - 严禁在英文版覆写时将加粗标签退化为与值同级的未加粗纯文本。
`;

  if (!content.includes('🔒 十、 模板文本格式强约束与二元归类法定不变量')) {
    content = content.trimEnd() + '\n' + invariantSection;
  }

  await fs.writeFile(outputPath, content, 'utf8');
  console.log(`Updated skill to ${outputPath}`);
}

async function run() {
  await updateSkill(
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/.agents/skills/msds-studio/SKILL.md',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/SKILL.proposed_local.md'
  );
  await updateSkill(
    'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/SKILL.proposed_global.md'
  );
}
run();
