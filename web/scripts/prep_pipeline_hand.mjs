import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(filePath, 'utf8');

  // 1. In buildBaseChineseEngine, preserve 手部防护 row
  const oldCnHand = `      if (/手部/i.test(lbl)) {
        if (!srcHandVal) {
          // REQ-03: 无通用手部防护陈述时执行 deleteRow 剪枝，根除开天窗 (DEF-15A)
          s8 = deleteRow(engine, s8, rIdx);
          continue;
        }
        // 保留加粗标签，彻底清洗单元格脏数据`;

  const newCnHand = `      if (/手部/i.test(lbl)) {
        // 保留加粗标签，彻底清洗单元格脏数据 (手部防护父级题头存活律)`;

  // 2. In buildBaseEnglishEngine, preserve Hand protection row
  const oldEnHand = `    // 如果中文母版因无通用陈述剪枝删除了手部防护行，英文版必须同步物理删除 Hand protection 行 (REQ-03, DEF-15A)
    const hasCnHand = cnS8?.rows?.some(r => /手部/i.test(r.cells[0]?.text || ''));
    if (!hasCnHand) {
      const enHandIdx = s8.rows.findIndex(r => /Hand protection/i.test(r.cells[0]?.text || ''));
      if (enHandIdx !== -1) {
        s8 = deleteRow(engine, s8, enHandIdx);
      }
    }`;

  const newEnHand = `    // 英文版严格保留唯一父级分类题头 Hand protection:，与中文母版同构存活`;

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOldCn = oldCnHand.replace(/\r\n/g, '\n');
  const normalizedNewCn = newCnHand.replace(/\r\n/g, '\n');
  const normalizedOldEn = oldEnHand.replace(/\r\n/g, '\n');
  const normalizedNewEn = newEnHand.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOldCn)) {
    console.error('oldCnHand block not found!');
    process.exit(1);
  }
  if (!normalizedContent.includes(normalizedOldEn)) {
    console.error('oldEnHand block not found!');
    process.exit(1);
  }

  let updated = normalizedContent.replace(normalizedOldCn, normalizedNewCn);
  updated = updated.replace(normalizedOldEn, normalizedNewEn);

  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/pipeline-engine-proposed.js', updated);
  console.log('Successfully generated pipeline-engine-proposed.js');
}
main();
