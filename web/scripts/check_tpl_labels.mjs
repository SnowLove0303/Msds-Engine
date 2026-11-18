import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const tplPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_EN_冠志(1).docx';

async function test() {
  const data = fs.readFileSync(tplPath);
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml').async('text');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;
  
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  const s1 = tables[0];
  const r1 = s1.getElementsByTagName('w:tr')[1];
  const c0 = Array.from(r1.childNodes).filter(n => n.nodeName === 'w:tc')[0];
  const runs = Array.from(c0.getElementsByTagName('w:r'));
  console.log('PUBLIC TPL R1 C0 runs count:', runs.length);
  runs.forEach((r, idx) => {
    const ts = Array.from(r.getElementsByTagName('w:t')).map(t => `'${t.textContent}' (xml:space=${t.getAttribute('xml:space')})`);
    console.log(`Run ${idx}:`, ts.join(', '));
  });
}
test();
