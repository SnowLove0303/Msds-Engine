import fs from 'node:fs/promises';

async function main() {
  const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let content = await fs.readFile(filePath, 'utf8');

  const oldTarget = `      // 3. 急性毒性三项必齐硬保全 (经口、吸入、经皮) (G-34 公理) - 严格保留源事实，仅格式化排版
      let oralRow = s11.rows.find(r => /经口/i.test(r.cells.map(c => c.text).join(' ')));
      if (oralRow) {
        const vCell = oralRow.cells[oralRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      let inhRow = s11.rows.find(r => /吸入/i.test(r.cells.map(c => c.text).join(' ')) && !/危险|危害/i.test(r.cells.map(c => c.text).join(' ')));
      if (inhRow) {
        const vCell = inhRow.cells[inhRow.cells.length - 1];
        const val = vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      let dermRow = s11.rows.find(r => /经皮/i.test(r.cells.map(c => c.text).join(' ')));
      if (!dermRow && inhRow) {
        const inhIdx = s11.rows.indexOf(inhRow);
        s11 = addRowAfter(engine, s11, inhIdx);
        dermRow = s11.rows[inhIdx + 1];
        if (dermRow && dermRow.cells.length >= 2) {
          writeCellLabel(dermRow.cells[0], '经皮：', true);
          applyStandardHangingIndent(dermRow.cells[0], '420', '420');
        }
      }
      if (dermRow) {
        const vCell = dermRow.cells[dermRow.cells.length - 1];
        let val = vCell?.text?.trim() || '';
        if (!val && srcS11) {
          const srcDerm = srcS11.rows.find(r => r.cells.length > 1 && /经皮/i.test(r.cells[0]?.text || ''));
          if (srcDerm) val = (srcDerm.cells[srcDerm.cells.length - 1]?.text || '').trim();
        }
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }`;

  const newTarget = `      // 3. 急性毒性三项必齐硬保全 (经口、吸入、经皮) (G-34 公理) - 严格保留源事实，仅格式化排版
      let oralRow = s11.rows.find(r => /经口/i.test(r.cells.map(c => c.text).join(' ')));
      if (oralRow) {
        const vCell = oralRow.cells[oralRow.cells.length - 1];
        const val = facts.section11Overrides?.['经口'] || vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      let inhRow = s11.rows.find(r => /吸入/i.test(r.cells.map(c => c.text).join(' ')) && !/危险|危害/i.test(r.cells.map(c => c.text).join(' ')));
      let dermRow = s11.rows.find(r => /经皮/i.test(r.cells.map(c => c.text).join(' ')));

      if (!inhRow && oralRow && dermRow) {
        const clone = dermRow.node.cloneNode(true);
        oralRow.node.parentNode.insertBefore(clone, oralRow.node.nextSibling);
        engine.refresh();
        s11 = engine.records.find(r => r.sectionNumber === 11);
        const oralIdx = s11.rows.findIndex(r => /经口/i.test(r.cells.map(c => c.text).join(' ')));
        inhRow = s11.rows[oralIdx + 1];
        if (inhRow && inhRow.cells.length >= 2) {
          writeCellLabel(inhRow.cells[0], '吸入：', true);
          applyStandardHangingIndent(inhRow.cells[0], '420', '420');
        }
      }

      if (inhRow) {
        const vCell = inhRow.cells[inhRow.cells.length - 1];
        const val = facts.section11Overrides?.['吸入'] || vCell?.text?.trim() || '';
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }

      if (!dermRow && inhRow) {
        const inhIdx = s11.rows.indexOf(inhRow);
        s11 = addRowAfter(engine, s11, inhIdx);
        dermRow = s11.rows[inhIdx + 1];
        if (dermRow && dermRow.cells.length >= 2) {
          writeCellLabel(dermRow.cells[0], '经皮：', true);
          applyStandardHangingIndent(dermRow.cells[0], '420', '420');
        }
      }
      if (dermRow) {
        const vCell = dermRow.cells[dermRow.cells.length - 1];
        let val = facts.section11Overrides?.['经皮'] || vCell?.text?.trim() || '';
        if (!val && srcS11) {
          const srcDerm = srcS11.rows.find(r => r.cells.length > 1 && /经皮/i.test(r.cells[0]?.text || ''));
          if (srcDerm) val = (srcDerm.cells[srcDerm.cells.length - 1]?.text || '').trim();
        }
        if (val) writeStructuredToxicologyCellValue(vCell, val, { isEnglish: false });
      }`;

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedOld = oldTarget.replace(/\r\n/g, '\n');
  const normalizedNew = newTarget.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedOld)) {
    console.error('Target not found in pipeline-engine.js!');
    process.exit(1);
  }

  const updated = normalizedContent.replace(normalizedOld, normalizedNew);
  await fs.writeFile('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/pipeline-engine-proposed.js', updated);
  console.log('Successfully generated pipeline-engine-proposed.js');
}
main();
