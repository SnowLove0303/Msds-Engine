import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const rootDir = 'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本';

async function findFiles(dir, max = 50) {
  const result = [];
  async function recurse(d) {
    if (result.length >= max) return;
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (result.length >= max) break;
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        await recurse(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith('.docx') && e.name.toLowerCase().includes('msds')) {
        result.push(full);
      }
    }
  }
  await recurse(dir);
  return result;
}

const sampleFiles = [
  'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本\\1-1 单组份水性聚氨酯树脂 PU\\PU-1007 msds_CN 冠志.docx',
  'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本\\1-1 单组份水性聚氨酯树脂 PU\\PU-1036 msds_CN 冠志.docx',
  'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本\\1-1 单组份水性聚氨酯树脂 PU\\PU-1036 msds_EN Guanzhi.docx',
  'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本\\1-1 单组份水性聚氨酯树脂 PU\\PU-202A msds_CN 冠志.docx',
  'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本\\2-1 单组份水性丙烯酸乳液 PA\\PA-3617 MSDS-CN 国彩.docx',
  'F:\\MSDS覆写\\MSDS\\TDS MSDS (2)\\TDS MSDS\\产品 TDS MSDS -- WORD版本\\2-1 单组份水性丙烯酸乳液 PA\\PA-3615 MSDS（冠志）.docx',
];

// Load embedded CN template
const templateDir = 'F:\\Skill\\MSDS\\web\\public\\templates';
const cnTplSource = await fs.readFile(path.join(templateDir, '正式模板_MSDS_CN_冠志(1).docx'));

for (const filePath of sampleFiles) {
  const fileName = path.basename(filePath);
  console.log(`\n========================================`);
  console.log(`TESTING FILE: ${fileName}`);
  console.log(`Path: ${filePath}`);
  
  let sourceBuffer;
  try {
    sourceBuffer = await fs.readFile(filePath);
  } catch (e) {
    console.error(`Read error: ${e.message}`);
    continue;
  }
  
  const inspectEngine = await loadDocx(sourceBuffer, fileName);
  console.log(`Records total: ${inspectEngine.records.length}, tables: ${inspectEngine.records.filter(r => r.kind === 'table').length}`);
  const tableSecNums = inspectEngine.records.filter(r => r.kind === 'table').map(r => r.sectionNumber);
  console.log(`Detected table sections: ${tableSecNums.filter(Boolean).join(', ')}`);

  const matchResult = runSmartMatching(inspectEngine.records);
  console.log(`Smart matching summary:`, matchResult.summary);
  
  // Show section by section status
  for (const sec of matchResult.matchedSections) {
    const matchedCount = sec.matchedRows.filter(r => r.status === 'MATCHED').length;
    const prunedCount = sec.matchedRows.filter(r => r.status === 'PRUNED').length;
    const emptyCount = sec.matchedRows.filter(r => r.status === 'EMPTY').length;
    const unmatchedCount = sec.matchedRows.filter(r => r.status === 'UNMATCHED').length;
    const ambiguousCount = sec.matchedRows.filter(r => r.status === 'REVIEW_AMBIGUOUS').length;
    const notAppCount = sec.matchedRows.filter(r => r.status === 'NOT_APPLICABLE').length;

    console.log(` Sec ${sec.sectionNumber} (${sec.title}): ` + 
      `MATCH=${matchedCount}, PRUNE=${prunedCount}, EMPTY=${emptyCount}, ` +
      `UNMATCH=${unmatchedCount}, AMBIGUOUS=${ambiguousCount}, N/A=${notAppCount}`
    );

    // If there are unmatched rows, show them
    const unmatched = sec.matchedRows.filter(r => r.status === 'UNMATCHED');
    if (unmatched.length > 0) {
      console.log(`   [!] UNMATCHED in Sec ${sec.sectionNumber}:`);
      for (const u of unmatched) {
        console.log(`       - "${u.standardLabel}": "${u.value?.slice(0, 40)}"`);
      }
    }

    // If there are empty rows where sourceRecord exists, show which slots are empty
    if (sec.sourceRecord && emptyCount > 0) {
      const empties = sec.matchedRows.filter(r => r.status === 'EMPTY');
      console.log(`   [?] EMPTY slots in Sec ${sec.sectionNumber} (source table had rows): ${empties.map(e => e.key).join(', ')}`);
    }
  }

  // Test applyMatchResultToEditor
  const editorEngine = await loadDocx(cnTplSource, '正式模板_MSDS_CN_冠志(1).docx');
  const handoff = applyMatchResultToEditor(matchResult, editorEngine);
  console.log(`Handoff to editor: injected=${handoff.injectedCount}, pruned=${handoff.prunedCount}`);
}
