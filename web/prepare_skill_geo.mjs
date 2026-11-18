import fs from 'node:fs/promises';

async function updateSkill(skillPath, outputPath) {
  let content = await fs.readFile(skillPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const ruleText = `3. **表格网格几何守恒与纵向合并闭环 (Table Geometry Conservation)**：
   - 严禁任何粗暴删列（如仅移除单元格节点而不补齐剩余单元格宽度与跨列属性）；
   - 当多列复合行（如 Section 11 原生包含“生育力/致畸形”子列的三列行）被算法收敛为单行双列时，必须强制调用 \`normalizeRowGeometry\`；
   - 必须确保末列值单元格宽度自动补齐为标准宽度（Section 11 为 \`w:w="6262"\`），并显式注入 \`<w:gridSpan w:val="3"/>\`，使整行宽度（3519 + 6262 = 9781 dxa）与全表完全对称，右边框 100% 垂直齐平；
   - 必须彻底清除收敛单行单元格上残留的 \`<w:vMerge>\` 标记（无论是 restart 还是 continue），杜绝排版引擎产生悬空跨行解析异常。`;

  if (!content.includes('表格网格几何守恒与纵向合并闭环')) {
    content = content.replace(
      '2. **严禁随意篡改排版参数**：',
      `${ruleText}\n\n2. **严禁随意篡改排版参数**：`
    );
  }

  await fs.writeFile(outputPath, content, 'utf8');
  console.log(`Updated skill to ${outputPath}`);
}

async function run() {
  await updateSkill(
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/.agents/skills/msds-studio/SKILL.md',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/SKILL.proposed_geo_local.md'
  );
  await updateSkill(
    'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/SKILL.proposed_geo_global.md'
  );
}
run();
