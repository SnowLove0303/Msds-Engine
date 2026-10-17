import { JSDOM } from 'jsdom';
if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}
import fs from 'node:fs';
import path from 'node:path';
import { loadDocx } from '../src/docx-engine.js';

function extractTableRows(engine) {
  const records = engine.records?.filter(r => r.kind === 'table') || [];
  const map = new Map();
  for (const r of records) {
    const secNum = r.sectionNumber;
    if (!map.has(secNum)) {
      map.set(secNum, []);
    }
    const rowList = (r.rows || []).map(row => {
      return (row.cells || []).map(c => (c.text || '').trim());
    });
    map.get(secNum).push(...rowList);
  }
  return map;
}

async function analyzePair(name, autoPath, manualPath, sourcePath) {
  console.log(`\n================================================================================`);
  console.log(`=== 分析型号: ${name} ===`);
  console.log(`================================================================================`);
  
  const autoBuf = autoPath && fs.existsSync(autoPath) ? fs.readFileSync(autoPath).buffer : null;
  const manualBuf = manualPath && fs.existsSync(manualPath) ? fs.readFileSync(manualPath).buffer : null;
  const sourceBuf = sourcePath && fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath).buffer : null;

  const autoEngine = autoBuf ? await loadDocx(autoBuf, 'auto.docx') : null;
  const manualEngine = manualBuf ? await loadDocx(manualBuf, 'manual.docx') : null;
  const sourceEngine = sourceBuf ? await loadDocx(sourceBuf, 'source.docx') : null;

  const autoMap = autoEngine ? extractTableRows(autoEngine) : new Map();
  const manualMap = manualEngine ? extractTableRows(manualEngine) : new Map();
  const sourceMap = sourceEngine ? extractTableRows(sourceEngine) : new Map();

  for (let s = 1; s <= 16; s++) {
    const autoRows = autoMap.get(s) || [];
    const manualRows = manualMap.get(s) || [];
    const sourceRows = sourceMap.get(s) || [];

    const isDifferent = JSON.stringify(autoRows) !== JSON.stringify(manualRows);
    
    console.log(`\n--- Section ${s} (自动匹配行数: ${autoRows.length} | 手动产出行数: ${manualRows.length} | 源文件行数: ${sourceRows.length}) ---`);
    if (!autoBuf) {
      console.log(`  [提示: 无自动匹配文件，仅展示手动产出与源文件]`);
      manualRows.forEach((r, idx) => {
        console.log(`  Manual R${idx+1}: ${r.join('  |  ').replace(/\n/g, ' ↵ ')}`);
      });
      continue;
    }

    if (!isDifferent) {
      console.log(`  ✅ 完全一致 (行数与内容 100% 吻合)`);
      continue;
    }

    console.log(`  ⚠️ 存在差异:`);
    const maxLen = Math.max(autoRows.length, manualRows.length);
    for (let r = 0; r < maxLen; r++) {
      const a = autoRows[r] ? autoRows[r].join('  |  ').replace(/\n/g, ' ↵ ') : '<缺失>';
      const m = manualRows[r] ? manualRows[r].join('  |  ').replace(/\n/g, ' ↵ ') : '<缺失>';
      if (a === m) {
        console.log(`    R${r+1} [OK]: ${m}`);
      } else {
        console.log(`    R${r+1} [DIFF]:`);
        console.log(`      自动匹配: "${a}"`);
        console.log(`      手动产出: "${m}"`);
      }
    }
  }
}

async function main() {
  const baseDir = path.resolve('../算法训练材料');
  
  // 1. EP-1702
  await analyzePair(
    'EP-1702',
    path.join(baseDir, 'EP-1702', 'EP-1702 msds_CN 冠志 (自动匹配).docx'),
    path.join(baseDir, 'EP-1702', 'EP-1702 msds_CN 冠志 (手动调整）.docx'),
    path.join(baseDir, 'EP-1702', 'EP-1702 msds_CN 冠志（源文件）.docx')
  );

  // 2. PU-2702
  await analyzePair(
    'PU-2702',
    path.join(baseDir, 'PU-2702', 'PU-2702 msds_CN 冠志 (智能匹配).docx'),
    path.join(baseDir, 'PU-2702', '手动产出', 'PU-2702 msds_CN 冠志(2).docx'),
    path.join(baseDir, 'PU-2702', 'PU-2702 msds_CN 冠志(源文件）.docx')
  );

  // 3. EP-1704
  await analyzePair(
    'EP-1704',
    null,
    path.join(baseDir, 'EP-1704', 'EP-1740 msds_CN 冠志 （手动产出）.docx'),
    path.join(baseDir, 'EP-1704', 'EP-1740 msds_CN 冠志(源文件).docx')
  );
}

main().catch(console.error);
