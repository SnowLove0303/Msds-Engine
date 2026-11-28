import fs from 'node:fs/promises';

async function updateSkill(skillPath, outputPath) {
  let content = await fs.readFile(skillPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const gatesSection = `
4. **Section 12 说明行自适应保真法定不变量 (Section 12 Preamble Parity)**：
   - 必须动态提取源文件 Section 12 中的前置说明行（0行、1行或2行）；
   - 源文件有几行说明行，产出文档必须 100% 对应几行说明行，绝不硬编码裁剪或丢失组分引言行；
   - 中文版完整保留，英文版动态翻译（Row 1: 产品级声明；Row 2: 组分生态毒理引言行）；
   - 生态毒理实测指标（鱼类、水蚤、藻类毒性数据）必须完整专业英译，严禁粗暴退化为默认无数据占位。

5. **全自动交付质量断言门禁 (Mandatory Pipeline Quality Assertion Gates)**：
   - 在交付成果导出前，流水线必须自动化执行 5 大硬性断言门禁：
     - **Gate 1 (Section 9 模板保真门禁)**: 悬挂缩进严格为 420 dxa，零 \`<w:tabs>\`，Arial 12pt Bold 标签，常规非加粗值；
     - **Gate 2 (Section 11 网格拓扑门禁)**: 全行总宽严格为 9781 dxa，11.7 单元格宽度必须为 6262 dxa 且带有 \`gridSpan="3"\`，零悬空 \`<w:vMerge>\`；
     - **Gate 3 (Section 12 说明行保真门禁)**: 说明行行数与源文件 100% 匹配；
     - **Gate 4 (自适应真实页脚时间门禁)**: 页脚日期必须为源文件提取的真实日期，严禁静态假数据；
     - **Gate 5 (英文版零中文门禁)**: 英文交付物中文字符数严格为 0。
   - 任何门禁未通过，流水线必须立即中断报错，严禁半成品流出。
`;

  if (!content.includes('Section 12 说明行自适应保真法定不变量')) {
    content = content.replace(
      '2. **严禁随意篡改排版参数**：',
      `${gatesSection}\n2. **严禁随意篡改排版参数**：`
    );
  }

  await fs.writeFile(outputPath, content, 'utf8');
  console.log(`Updated skill to ${outputPath}`);
}

async function run() {
  await updateSkill(
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/.agents/skills/msds-studio/SKILL.md',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/SKILL.proposed_gates_local.md'
  );
  await updateSkill(
    'C:/Users/Administrator/.gemini/config/skills/msds-studio/SKILL.md',
    'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/SKILL.proposed_gates_global.md'
  );
}
run();
