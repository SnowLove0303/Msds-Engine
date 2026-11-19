import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';

async function dumpDocx(filePath, outJson) {
  const buf = fs.readFileSync(filePath);
  const doc = await loadDocx(buf, path.basename(filePath));
  const data = {
    title: doc.title,
    sections: (doc.records || []).map(r => ({
      sectionNumber: r.sectionNumber,
      title: r.rows && r.rows[0]?.cells ? r.rows[0].cells.map(c => c.text).join(' ').trim() : `Section ${r.sectionNumber}`,
      rows: (r.rows || []).map(row => (row.cells || []).map(c => (c.text || '').trim()))
    }))
  };
  fs.writeFileSync(outJson, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved ${data.sections.length} sections to ${outJson}`);
}

const sourceDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志_源文件留存.docx';
const deliveredCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 冠志.docx';
const deliveredEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_EN Guanzhi.docx';
const deliveredGcCn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_CN 国彩.docx';
const deliveredGcEn = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4914/PA-4914 msds_EN Guocai.docx';

async function main() {
  await dumpDocx(sourceDocx, 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/source_dump.json');
  await dumpDocx(deliveredCn, 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/delivered_cn_dump.json');
  await dumpDocx(deliveredEn, 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/delivered_en_dump.json');
  await dumpDocx(deliveredGcCn, 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/delivered_gc_cn_dump.json');
  await dumpDocx(deliveredGcEn, 'C:/Users/Administrator/.gemini/antigravity/brain/f13d417c-b307-46d9-b5ab-f94d4cc0b83c/scratch/delivered_gc_en_dump.json');
}

main().catch(console.error);
