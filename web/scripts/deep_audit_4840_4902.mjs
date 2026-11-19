import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { loadDocx } from '../src/docx-engine.js';

async function extractDocxText(docxPath) {
  if (!fs.existsSync(docxPath)) return null;
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const pMatches = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) || [];
  const paras = [];
  for (const p of pMatches) {
    const tMatches = p.match(/<w:t\b[^>]*>([^<]*)<\/w:t>/g) || [];
    const text = tMatches.map(m => m.replace(/<[^>]+>/g, '')).join('');
    if (text.trim()) paras.push(text.trim());
  }
  return { fullText: paras.join('\n'), paras };
}

async function run() {
  const p4840Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx';
  const p4902Src = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx';
  const p4840Out = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志.docx';
  const p4902Out = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902 msds_CN 冠志.docx';

  console.log('--- RECOGNITION RESULTS ---');
  const rec4840 = await recognizeSourceDocx(p4840Src);
  const rec4902 = await recognizeSourceDocx(p4902Src);

  console.log('4840 Rec GHS:', JSON.stringify(rec4840.ghs, null, 2));
  console.log('4840 Rec Comp:', JSON.stringify(rec4840.components, null, 2));
  console.log('4840 Rec pH:', rec4840.pH);

  console.log('4902 Rec GHS:', JSON.stringify(rec4902.ghs, null, 2));
  console.log('4902 Rec Comp:', JSON.stringify(rec4902.components, null, 2));
  console.log('4902 Rec CompNotes:', JSON.stringify(rec4902.componentsNotes, null, 2));
  console.log('4902 Rec pH:', rec4902.pH);

  const tSrc4840 = await extractDocxText(p4840Src);
  const tSrc4902 = await extractDocxText(p4902Src);
  const tOut4840 = await extractDocxText(p4840Out);
  const tOut4902 = await extractDocxText(p4902Out);

  fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/brain/7f4d4b46-78e6-435a-aa29-f0d6ec194caa/scratch/tri_dump_4840_4902.json', JSON.stringify({
    rec4840,
    rec4902,
    tSrc4840: tSrc4840.paras,
    tSrc4902: tSrc4902.paras,
    tOut4840: tOut4840.paras,
    tOut4902: tOut4902.paras
  }, null, 2), 'utf-8');

  console.log('DUMP WRITTEN SUCCESSFULLY');
}

run().catch(console.error);
