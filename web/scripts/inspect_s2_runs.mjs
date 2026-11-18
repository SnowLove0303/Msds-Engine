import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const enPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_EN Guanzhi.docx';

async function test() {
  const data = fs.readFileSync(enPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;
  
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  const s2 = tables[1];
  const rows = Array.from(s2.getElementsByTagName('w:tr'));
  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const tr = rows[rIdx];
    const ps = Array.from(tr.getElementsByTagName('w:p'));
    console.log(`=== ROW ${rIdx} (paragraphs: ${ps.length}) ===`);
    ps.forEach((p, pIdx) => {
      const runs = Array.from(p.getElementsByTagName('w:r'));
      const runTexts = runs.map(r => {
        const b = r.getElementsByTagName('w:b').length > 0;
        const ts = Array.from(r.getElementsByTagName('w:t')).map(t => t.textContent).join('');
        return `[Run(bold=${b}): '${ts}']`;
      });
      console.log(`  P${pIdx}: ${runTexts.join(' ')}`);
    });
  }
}
test();
