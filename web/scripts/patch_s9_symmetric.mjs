import fs from 'fs';

const pPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/proposed_pipeline_engine.js';
let content = fs.readFileSync(pPath, 'utf8');

const targetStr = `    // 2. 若有 baseCnEngine，提取中文 Section 9 包含的物理量关键词白名单
    if (baseCnEngine) {
      const cnS9 = baseCnEngine.records.find(r => r.sectionNumber === 9);`;

const replaceStr = `    // 2. 若有 baseCnEngine，提取中文 Section 9 包含的物理量关键词白名单
    if (baseCnEngine) {
      const cnS9 = baseCnEngine.records.find(r => r.sectionNumber === 9);
      // 若中文母版包含 NCO，英文模板缺失则对称补齐，实现 1:1 绝对同构
      const cnNcoRow = cnS9?.rows?.find(r => /NCO/i.test(r.cells[0]?.text || ''));
      if (cnNcoRow && !s9.rows.some(r => /NCO/i.test(r.cells[0]?.text || ''))) {
        const viscIdx = s9.rows.findIndex(r => /Dynamic viscosity/i.test(r.cells[0]?.text || ''));
        const insertIdx = viscIdx !== -1 ? viscIdx : s9.rows.length - 2;
        s9 = addRowAfter(engine, s9, insertIdx);
        const ncoVal = (cnNcoRow.cells[cnNcoRow.cells.length - 1]?.text || '17.8±0.5%').trim();
        writeCellLabel(s9.rows[insertIdx + 1].cells[0], '9.11 NCO content:', true);
        safeWrite(s9.rows[insertIdx + 1].cells[1], ncoVal);
      }`;

if (!content.includes(targetStr)) {
  console.error('targetStr not found!');
  process.exit(1);
}

content = content.replace(targetStr, replaceStr);

// Also ensure formatSection9LabelCell is called on all EN Section 9 labels after renumberRecord:
const targetRenumber = `    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号
    renumberRecord(s9, '9');`;

const replaceRenumber = `    // 3. 动态重新生成标准 9.1 ~ 9.N 小节编号并激光对齐
    renumberRecord(s9, '9');
    for (let rIdx = 1; rIdx < s9.rows.length; rIdx++) {
      const c0 = s9.rows[rIdx]?.cells[0];
      if (c0) formatSection9LabelCell(c0, true);
    }`;

if (!content.includes(targetRenumber)) {
  console.error('targetRenumber not found!');
  process.exit(1);
}

content = content.replace(targetRenumber, replaceRenumber);

fs.writeFileSync(pPath, content, 'utf8');
console.log('Successfully updated proposed_pipeline_engine.js with symmetric NCO insertion!');
