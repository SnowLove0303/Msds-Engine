import assert from 'node:assert';
import { createWorkSession, clearTemplateValues } from '../src/template-editor.js';

console.log('=== Running test_template_wiping.mjs ===');

async function testWiping(templateKey) {
  console.log(`\nTesting wiping on ${templateKey}...`);
  const session = await createWorkSession(templateKey);
  const wipeResult = clearTemplateValues(session);

  assert.strictEqual(wipeResult.success, true, 'clearTemplateValues must succeed');
  console.log(`  Records in ${templateKey}:`, session.engine.records.map(r => `Sec${r.sectionNumber}`));
  assert(wipeResult.clearedSections.length >= 16, 'At least 16 sections must be cleared');

  let clearedValueCellsCount = 0;
  for (const record of session.engine.records) {
    const secNum = record.sectionNumber;
    for (let rIdx = 1; rIdx < (record.rows || []).length; rIdx++) {
      const row = record.rows[rIdx];
      for (let cIdx = 0; cIdx < (row.cells || []).length; cIdx++) {
        const cell = row.cells[cIdx];
        if (cell.editable) {
          clearedValueCellsCount++;
          assert.strictEqual((cell.text || '').trim(), '', `Editable cell in Sec ${secNum} R${rIdx}C${cIdx} must be empty!`);
        }
      }
    }
  }

  console.log(`  ✓ Successfully verified ${clearedValueCellsCount} editable value cells are 100% empty`);
  return clearedValueCellsCount;
}

async function main() {
  const s = await createWorkSession('CN_Guanzhi');
  const s3 = s.engine.records.find(r => r.sectionNumber === 3);
  console.log(`\nSection 3 rows (${s3.rows.length}):`);
  for (let i = 0; i < s3.rows.length; i++) {
    console.log(`  R${i} [cells=${s3.rows[i].cells.length}]: ${s3.rows[i].cells.map(c => `"${c.text}"`).join(' | ')}`);
  }
  const cnCleared = await testWiping('CN_Guanzhi');
  const enCleared = await testWiping('EN_Guanzhi');
  assert(cnCleared > 50, 'CN should have cleared >50 value cells');
  assert(enCleared > 50, 'EN should have cleared >50 value cells');
  console.log('\n✅ ALL TEMPLATE WIPING TESTS PASSED 100%!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
