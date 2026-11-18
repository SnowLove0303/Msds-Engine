import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function checkDoc(p) {
  const data = fs.readFileSync(p);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('text');
  const d = new JSDOM(xml, { contentType: 'text/xml' }).window.document;
  const tbls = d.getElementsByTagName('w:tbl');
  const s2 = tbls[1];
  console.log('--- S2 Paragraphs XML ---');
  const ps = Array.from(s2.getElementsByTagName('w:p'));
  for (let i = 0; i < ps.length; i++) {
    const pNode = ps[i];
    console.log(`P${i} XML:`, pNode.textContent);
    const runs = Array.from(pNode.getElementsByTagName('w:r'));
    for (let j = 0; j < runs.length; j++) {
      const ts = Array.from(runs[j].getElementsByTagName('w:t')).map(t => t.textContent).join('');
      console.log(`  Run ${j}: '${ts}'`);
    }
  }
}

checkDoc('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx');
