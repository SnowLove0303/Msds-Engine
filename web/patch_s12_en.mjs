import fs from 'fs';
let content = fs.readFileSync('./web/src/pipeline-engine.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

const targetS12 = `  // Section 12 (标准 4 行)
  let s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12) {
    if (s12.rows.length > 5) {
      // 检查 Row 2 是否为旧组分参考数据引导行，仅删除旧组分参考行，保护 Row 1 英文产品级说明行
      const r2Text = (s12.rows[2]?.cells?.map(c => c.text || '').join('') || '');
      if (/The following|reference|Diethylene|CAS/i.test(r2Text) || s12.rows[2]?.cells?.length === 1) {
        s12 = deleteRow(engine, s12, 2);
      } else {
        s12 = deleteRow(engine, s12, 1);
      }
    }
    for (const row of s12.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Ecotoxicity/i.test(lbl)) safeWrite(c1, enValues['sec12.ecotoxicity']);
      else if (/Persistence/i.test(lbl)) safeWrite(c1, enValues['sec12.persistence']);
      else if (/Other adverse/i.test(lbl)) safeWrite(c1, enValues['sec12.other_effects']);
    }
  }`;

const newS12 = `  // Section 12 (标准 4 行)
  let s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12) {
    // 保护 Row 1 英文产品级说明行并英译
    if (s12.rows[1]?.cells?.[0] && (s12.rows[1].cells.length === 1 || /生态毒理学|ecotoxicological/i.test(s12.rows[1].cells[0].text))) {
      safeWrite(s12.rows[1].cells[0], 'No ecotoxicological studies are available for this product.');
    }
    if (s12.rows.length > 5) {
      // 检查 Row 2 是否为旧组分参考数据引导行，仅删除旧组分参考行，保护 Row 1 英文产品级说明行
      const r2Text = (s12.rows[2]?.cells?.map(c => c.text || '').join('') || '');
      if (/The following|reference|Diethylene|CAS|以下为|参考数据/i.test(r2Text) || s12.rows[2]?.cells?.length === 1) {
        s12 = deleteRow(engine, s12, 2);
      } else {
        s12 = deleteRow(engine, s12, 1);
      }
    }
    for (const row of s12.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Ecotoxicity/i.test(lbl)) safeWrite(c1, enValues['sec12.ecotoxicity']);
      else if (/Persistence/i.test(lbl)) safeWrite(c1, enValues['sec12.persistence']);
      else if (/Other adverse/i.test(lbl)) safeWrite(c1, enValues['sec12.other_effects']);
    }
  }`;

if (!content.includes(targetS12)) {
  console.log('targetS12 not found!');
  process.exit(1);
}

content = content.replace(targetS12, newS12);
if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('./scratch/pipeline-engine.proposed.js', content, 'utf8');
console.log('Successfully created ./scratch/pipeline-engine.proposed.js');
