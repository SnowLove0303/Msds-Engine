import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA';
const dirs = fs.readdirSync(baseDir);

async function scanFile(p, model, filename) {
  const zip = await JSZip.loadAsync(fs.readFileSync(p));
  const xml = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const paras = Array.from(doc.getElementsByTagName('w:p')).map(p => p.textContent.trim()).filter(Boolean);
  const fullText = paras.join('\n');
  
  // Look for Section 2 keywords
  const hasH = /H\d{3}/i.test(fullText) || /H3\d{2}/.test(fullText);
  const hasP = /P\d{3}/i.test(fullText) || /P2\d{2}|P3\d{2}/.test(fullText);
  const hasGHS = fullText.includes('象形图') || fullText.includes('GHS') || fullText.includes('警示词') || fullText.includes('危险性类别');
  const hasPictogram = xml.includes('<w:drawing') || xml.includes('<v:imagedata') || xml.includes('<w:pict');
  const isDangerous = fullText.includes('危险') || fullText.includes('警告');
  
  // Section 11 toxicity data
  const hasLD50 = /LD50|LC50|\d+\s*mg\/kg/i.test(fullText);
  const hasToxDesc = fullText.includes('急性毒性') || fullText.includes('皮肤腐蚀') || fullText.includes('严重眼睛损伤');
  
  console.log(`\n================== [Model: ${model}] ${filename} ==================`);
  console.log(`Paras count: ${paras.length}, Text length: ${fullText.length}`);
  console.log(`Section 2 Flags: GHS=${hasGHS}, H=${hasH}, P=${hasP}, Pictogram=${hasPictogram}, Dangerous=${isDangerous}`);
  console.log(`Section 11 Flags: LD50/LC50=${hasLD50}, ToxDesc=${hasToxDesc}`);
  
  // Print some key excerpts
  const s2Idx = paras.findIndex(t => t.includes('危险') && (t.includes('概述') || t.includes('2')));
  if (s2Idx !== -1) {
    console.log(`--- Section 2 Excerpt (start at para ${s2Idx}): ---`);
    for (let i = s2Idx; i < Math.min(s2Idx + 12, paras.length); i++) {
      console.log(`  [P${i}] ${paras[i]}`);
    }
  }
  
  const s11Idx = paras.findIndex(t => t.includes('毒理学') && (t.includes('信息') || t.includes('资料') || t.includes('11')));
  if (s11Idx !== -1) {
    console.log(`--- Section 11 Excerpt (start at para ${s11Idx}): ---`);
    for (let i = s11Idx; i < Math.min(s11Idx + 10, paras.length); i++) {
      console.log(`  [P${i}] ${paras[i]}`);
    }
  }
}

async function main() {
  for (const d of dirs) {
    const fullSub = path.join(baseDir, d);
    if (!fs.statSync(fullSub).isDirectory()) continue;
    const files = fs.readdirSync(fullSub).filter(f => f.toLowerCase().includes('msds') && f.endsWith('.docx'));
    for (const f of files) {
      await scanFile(path.join(fullSub, f), d, f);
    }
  }
}

main().catch(console.error);
