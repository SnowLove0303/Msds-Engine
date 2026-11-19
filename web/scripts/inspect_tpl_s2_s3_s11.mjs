import { createWorkSession } from '../src/template-editor.js';

const session = await createWorkSession('CN_Guanzhi');
const s2Rec = session.engine.records.find(r => r.sectionNumber === 2);
console.log('--- CN_Guanzhi S2 ROWS ---');
s2Rec.rows.forEach((r, idx) => {
  const cTexts = r.cells.map(c => c.text);
  console.log(`Row ${idx}: [${cTexts.join(' | ')}]`);
});

const s3Rec = session.engine.records.find(r => r.sectionNumber === 3);
console.log('\n--- CN_Guanzhi S3 ROWS ---');
s3Rec.rows.forEach((r, idx) => {
  const cTexts = r.cells.map(c => c.text);
  console.log(`Row ${idx}: [${cTexts.join(' | ')}]`);
});

const s11Rec = session.engine.records.find(r => r.sectionNumber === 11);
console.log('\n--- CN_Guanzhi S11 ROWS ---');
if (s11Rec) {
  s11Rec.rows.forEach((r, idx) => {
    const cTexts = r.cells.map(c => c.text);
    console.log(`Row ${idx}: [${cTexts.join(' | ')}]`);
  });
}
