import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const { loadDocx } = await import('../src/docx-engine.js');
const { SECTION_SLOT_REGISTRY, resolveSlotBySemantics, safeColonSplit, sanitizeTypographyAndSymbols } = await import('../src/smart-matching.js');

async function main() {
  const buf = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3653/PA-3653 MSDS（冠志）.docx');
  const engine = await loadDocx(buf, 'PA-3653 MSDS（冠志）.docx');
  const records = (engine.inspectorRecords || engine.records || []).filter(r => r.sectionNumber);

  for (let s = 1; s <= 16; s++) {
    const sRecords = records.filter(r => r.sectionNumber === s);
    const tableRec = sRecords.find(r => r.kind === 'table');
    const textRecs = sRecords.filter(r => r.kind === 'text');
    const pairs = [];

    if (tableRec && tableRec.rows) {
      for (const row of tableRec.rows) {
        if (row.index === 0) {
          const c0Text = (row.cells?.[0]?.text || '').trim();
          const c1Text = (row.cells?.[1]?.text || '').trim();
          const isRealHeader = /^(?:项目|内容|指标|参数|特性|结果|名称|描述|Item|Content|Property|Value|Parameter)$/i.test(c0Text) ||
                               /^(?:内容|数值|指标|描述|说明|Value|Description|Specification)$/i.test(c1Text) ||
                               (row.cells?.length >= 3 && /CAS|含量|成分|组成|Chemical/i.test(c0Text));
          if (isRealHeader) continue;
        }
        if (row.cells && row.cells.length >= 2) {
          pairs.push({ label: row.cells[0]?.text?.trim(), value: row.cells[1]?.text?.trim() });
        }
      }
    }

    for (const tr of textRecs) {
      const text = (tr.text || '').trim();
      if (!text) continue;
      if (new RegExp(`^${s}\\s*[\\.、\\s]`).test(text) && text.length < 30 && !text.includes('\n') && !/[:：]/.test(text)) {
        continue;
      }
      if (s === 16 && !/[:：]/.test(text)) {
        pairs.push({ label: '免责声明：', value: text });
        continue;
      }
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (new RegExp(`^${s}\\s*[\\.、\\s]`).test(line) && line.length < 30 && !/[:：]/.test(line)) continue;
        const cs = safeColonSplit(line);
        if (cs.hasColon && cs.label) {
          pairs.push({ label: cs.label, value: cs.value });
        } else if (line) {
          if (pairs.length > 0) pairs[pairs.length - 1].value += '\n' + line;
          else pairs.push({ label: '', value: line });
        }
      }
    }

    console.log(`=== Sec ${s} has ${pairs.length} pairs ===`);
    for (const p of pairs.slice(0, 4)) {
      const resolved = resolveSlotBySemantics(p.label, s);
      console.log(`  [${p.label}] => slot: ${resolved?.slot?.key || 'NONE'} | val: ${p.value?.slice(0, 30)}`);
    }
  }
}

main().catch(console.error);
