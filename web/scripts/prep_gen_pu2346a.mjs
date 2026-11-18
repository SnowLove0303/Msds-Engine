import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/generate_pu2346a_deliverables.mjs';
  let content = await fs.readFile(filePath, 'utf8');

  const oldTarget = `      toxicologyTableRows: [
        { cells: ['该产品无可用的毒理学研究。'] },
        { cells: ['下面是这些成分的毒理学数据。'] },
        { cells: ['11.1  急性毒性：', '经口：', '聚氨酯分散体\\n半数致死剂量(LD50) 大鼠: > 2,000 mg/kg\\n方法：OECD化学品测试指南423\\n对类似产品的毒理学研究\\n乙醇\\nLD50 经口 - 大鼠 - 雄性和雌性 - 10,470 mg/kg\\n(OECD测试导则401)'] },
        { cells: ['吸入：', '聚氨酯分散体\\n试验环境：粉尘/烟雾\\n评估：此物质或混合物无急性呼吸毒性\\n方法：OECD化学品测试指南403\\n对类似产品的研究\\n乙醇\\nLC50 吸入 - 大鼠 - 雄性和雌性 - 4 h - 124.7 mg/l\\n(OECD测试导则403)'] },
        { cells: ['经皮：', '聚氨酯分散体\\n评估：此物质或混合物无急性皮肤毒性\\n对类似产品的研究'] },
        { cells: ['11.2  主要皮肤刺激性：', '聚氨酯分散体\\n物种：家兔\\n结果：轻微刺激\\n分类：无皮肤刺激\\n方法：OECD化学品测试指南404\\n对类似产品的研究'] },
        { cells: ['11.3  主要粘膜刺激性：', '聚氨酯分散体\\n物种：家兔\\n结果：轻微刺激\\n分类：无眼睛刺激\\n方法：OECD化学品测试指南405\\n对类似产品研究'] },
        { cells: ['11.4  致敏性：', '聚氨酯分散体\\n根据Buehler（经皮试验）皮肤致敏性：\\n物种：豚鼠\\n结果：阴性\\n分类：不引起皮肤过敏\\n方法：OECD化学品测试指南406\\n对类似产品研究\\n皮肤致敏性（局部淋巴结试验（LLNA））\\n物种：小鼠\\n结果：阴性\\n分类：不引起皮肤过敏\\n方法：OECD化学品测试指南429\\n对类似产品研究'] },
        { cells: ['11.5  致突变性：', '聚氨酯分散体\\n测试种类：沙门氏菌/微粒体试验（Ames试验）\\n代谢活化：有/无\\n结果：阴性\\n方法：OECD化学品测试指南471\\n对类似产品研究\\n测试种类：体外染色体畸变试验\\n代谢活化：有/无\\n结果：阴性\\n方法：OECD化学品测试指南473\\n对类似产品研究'] },
        { cells: ['11.6  生殖毒性：', '聚氨酯分散体\\n无数据资料'] },
        { cells: ['11.7  吸入危险：', '聚氨酯分散体\\n无数据资料'] }
      ]`;

  const newTarget = `      section11Overrides: {
        '经口': '聚氨酯分散体\\n半数致死剂量(LD50) 大鼠: > 2,000 mg/kg\\n方法：OECD化学品测试指南423\\n对类似产品的毒理学研究\\n乙醇\\nLD50 经口 - 大鼠 - 雄性和雌性 - 10,470 mg/kg\\n(OECD测试导则401)',
        '吸入': '聚氨酯分散体\\n试验环境：粉尘/烟雾\\n评估：此物质或混合物无急性呼吸毒性\\n方法：OECD化学品测试指南403\\n对类似产品的研究\\n乙醇\\nLC50 吸入 - 大鼠 - 雄性和雌性 - 4 h - 124.7 mg/l\\n(OECD测试导则403)',
        '经皮': '聚氨酯分散体\\n评估：此物质或混合物无急性皮肤毒性\\n对类似产品的研究'
      }`;

  const normalizedContent = content.replace(/\\r\\n/g, '\\n');
  const normalizedOld = oldTarget.replace(/\\r\\n/g, '\\n');
  const normalizedNew = newTarget.replace(/\\r\\n/g, '\\n');

  if (!normalizedContent.includes(normalizedOld)) {
    console.error('Target not found in generate_pu2346a_deliverables.mjs!');
    process.exit(1);
  }

  const updated = normalizedContent.replace(normalizedOld, normalizedNew);
  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/generate_pu2346a_proposed.mjs', updated);
  console.log('Successfully generated generate_pu2346a_proposed.mjs');
}
main();
