import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import { getBenchmarkSpecsByCategory } from '../src/msds-db.js';

async function main() {
  const srcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
  const buf = fs.readFileSync(srcPath);
  const srcEngine = await loadDocx(buf, 'src.docx');

  console.log('--- 2. Testing S11 All Records ---');
  const s11Recs = srcEngine.records.filter(r => r.sectionNumber === 11);
  for (const r of s11Recs) {
    console.log(`Sec 11 rec: title="${r.title}", kind=${r.kind}, text="${r.text?.slice(0, 80)}"`);
  }

  const s11FullText = s11Recs.map(r => r.text || '').join('\n');
  const lines = s11FullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const endpoints = [];
  for (const line of lines) {
    if (/^\d+\.?\s*毒理/.test(line)) continue;
    const m = line.match(/^([^：:\s]+)[：:]\s*(.*)$/);
    if (m) {
      endpoints.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  console.log('Parsed S11 endpoints:', endpoints);

  console.log('--- 3. Testing S14 All Records ---');
  const s14Recs = srcEngine.records.filter(r => r.sectionNumber === 14);
  const s14FullText = s14Recs.map(r => r.text || '').join('\n');
  const s14Lines = s14FullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transportItems = [];
  for (const line of s14Lines) {
    if (/^\d+\.?\s*运输/.test(line)) continue;
    const m = line.match(/^([^：:\s]+)[：:]\s*(.*)$/);
    if (m) {
      transportItems.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  console.log('Parsed S14 transport items:', transportItems);
}

main().catch(console.error);
