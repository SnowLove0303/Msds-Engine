import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import path from 'node:path';
import { loadDocx, writeCellValue } from './src/docx-engine.js';
import { renderEditorCell, renderEditorTable } from './src/render-utils.js';

async function run() {
  console.log('--- 1. Testing EN Template Section 1 Loading & Cell Editability ---');
  const enTemplateFiles = fs.readdirSync('./public/templates').filter(f => f.includes('EN'));
  if (enTemplateFiles.length === 0) {
    throw new Error('EN Template file not found!');
  }
  const enTplPath = path.join('./public/templates', enTemplateFiles[0]);
  const enBuf = fs.readFileSync(enTplPath);
  const engine = await loadDocx(enBuf.buffer, 'EN_Template.docx');
  
  const sec1 = engine.records.find(r => r.sectionNumber === 1);
  if (!sec1) throw new Error('Section 1 not found in EN template!');
  
  console.log('Section 1 title:', sec1.title);
  console.log('Section 1 rows count:', sec1.rows.length);
  
  // Row 1 Col 0: Product name
  const r1 = sec1.rows.find(r => r.index === 1);
  if (!r1) throw new Error('Row 1 not found in Section 1!');
  console.log('Row 1 cells:', r1.cells.map(c => ({ col: c.col, text: c.text, labelText: c.labelText, editable: c.editable })));
  
  const labelCell = r1.cells.find(c => c.col === 0);
  const valCell = r1.cells.find(c => c.col === 1);
  
  if (!valCell) throw new Error('Row 1 Col 1 cell not found!');
  console.log('Row 1 Col 1 editable:', valCell.editable);
  if (!valCell.editable) {
    throw new Error('FAIL: Row 1 Col 1 in EN template should be editable!');
  }

  // Test renderEditorCell without manageCellEditability
  const markupDefault = renderEditorCell(sec1, r1, valCell, 8000, false, null, true, {
    manageCellEditability: false,
    cellEditableOverrides: {}
  });
  
  if (!markupDefault.includes('excel-cell-editor')) {
    throw new Error('FAIL: Empty editable cell did not render excel-cell-editor!\n' + markupDefault);
  }
  if (!markupDefault.includes('点击输入值…')) {
    throw new Error('FAIL: Placeholder not found in rendered markup!\n' + markupDefault);
  }
  console.log('✓ Default render of empty EN cell contains excel-cell-editor and placeholder.');

  // Test renderEditorCell with manageCellEditability: true
  const markupWithConfig = renderEditorCell(sec1, r1, valCell, 8000, false, null, true, {
    manageCellEditability: true,
    cellEditableOverrides: {}
  });
  if (!markupWithConfig.includes('in-permission-config-mode')) {
    throw new Error('FAIL: td missing in-permission-config-mode class!');
  }
  if (!markupWithConfig.includes('cell-editability-toggle-badge') || !markupWithConfig.includes('🔓') || !markupWithConfig.includes('可填')) {
    throw new Error('FAIL: Unlock badge missing!\n' + markupWithConfig);
  }
  console.log('✓ Permission config mode renders [🔓 可填] badge for editable cell.');

  // Test cellEditableOverrides: lock valCell
  const cellKey = `${sec1.id}:${r1.index}:${valCell.col}`;
  const markupLocked = renderEditorCell(sec1, r1, valCell, 8000, false, null, true, {
    manageCellEditability: true,
    cellEditableOverrides: { [cellKey]: false }
  });
  if (!markupLocked.includes('🔒') || !markupLocked.includes('锁定')) {
    throw new Error('FAIL: Lock badge missing after override!\n' + markupLocked);
  }
  if (markupLocked.includes('excel-cell-editor')) {
    throw new Error('FAIL: Locked cell should not render excel-cell-editor!\n' + markupLocked);
  }
  console.log('✓ Overriding to locked successfully disables excel-cell-editor and shows [🔒 锁定] badge.');

  // Test cellEditableOverrides: unlock labelCell
  const labelKey = `${sec1.id}:${r1.index}:${labelCell.col}`;
  const markupUnlockedLabel = renderEditorCell(sec1, r1, labelCell, 8000, false, null, false, {
    manageCellEditability: true,
    cellEditableOverrides: { [labelKey]: true }
  });
  if (!markupUnlockedLabel.includes('🔓') || !markupUnlockedLabel.includes('可填')) {
    throw new Error('FAIL: Unlock badge missing on overridden label cell!\n' + markupUnlockedLabel);
  }
  if (!markupUnlockedLabel.includes('excel-cell-editor')) {
    throw new Error('FAIL: Overridden label cell did not render excel-cell-editor!\n' + markupUnlockedLabel);
  }
  console.log('✓ Overriding label cell to unlocked successfully renders excel-cell-editor and [🔓 可填] badge.');

  // Test writing to the cell and exporting DOCX
  console.log('--- 2. Testing writing value to empty cell and DOCX export ---');
  valCell.editable = true;
  writeCellValue(valCell, 'PU-2341E Waterborne Polyurethane');
  console.log('After write, valCell.valueText:', valCell.valueText);
  if (valCell.valueText !== 'PU-2341E Waterborne Polyurethane') {
    throw new Error('FAIL: Value text mismatch after writeCellValue!');
  }
  const exportedBuf = await engine.exportArrayBuffer();
  console.log('Exported DOCX buffer byte length:', exportedBuf.byteLength);
  if (exportedBuf.byteLength < 1000) {
    throw new Error('Exported DOCX is too small!');
  }

  // Re-parse exported DOCX to verify value persisted in XML
  const reloadedEngine = await loadDocx(exportedBuf, 'Exported.docx');
  const reloadedSec1 = reloadedEngine.records.find(r => r.sectionNumber === 1);
  const reloadedR1 = reloadedSec1.rows.find(r => r.index === 1);
  const reloadedValCell = reloadedR1.cells.find(c => c.col === 1);
  console.log('Reloaded cell text:', reloadedValCell.text);
  if (!reloadedValCell.text.includes('PU-2341E Waterborne Polyurethane')) {
    throw new Error('FAIL: Reloaded cell does not contain written value!\n' + reloadedValCell.text);
  }
  console.log('✓ Successfully wrote value into empty EN template cell and verified persistence in exported DOCX!');

  console.log('\nALL CELL EDITABILITY TESTS PASSED! 🎉');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
