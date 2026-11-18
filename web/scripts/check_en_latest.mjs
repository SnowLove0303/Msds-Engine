import JSZip from 'jszip';
import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const enDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-1 水分散型异氰酸酯固化剂 OS/OS-9547 PGDA80/OS-9547 PGDA80 msds_EN Guanzhi.docx';

async function checkDetails() {
  const zip = await JSZip.loadAsync(fs.readFileSync(enDocx));
  const doc = new DOMParser().parseFromString(await zip.file('word/document.xml').async('text'), 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));

  console.log('=== EN Section 9 Rows ===');
  const s9 = tbls.find(t => t.textContent.includes('Physical and chemical properties'));
  if (s9) {
    const trs = Array.from(s9.getElementsByTagName('w:tr'));
    for (const r of trs) {
      const tcs = Array.from(r.getElementsByTagName('w:tc'));
      console.log(`  ${tcs[0]?.textContent?.trim()} -> ${tcs[1]?.textContent?.trim()}`);
    }
  }

  console.log('\n=== EN Section 10 Rows ===');
  const s10 = tbls.find(t => t.textContent.includes('Stability and reactivity'));
  if (s10) {
    const trs = Array.from(s10.getElementsByTagName('w:tr'));
    for (const r of trs) {
      const tcs = Array.from(r.getElementsByTagName('w:tc'));
      console.log(`  ${tcs[0]?.textContent?.trim()} -> ${tcs[1]?.textContent?.trim()}`);
    }
  }

  console.log('\n=== EN Section 14 Rows ===');
  const s14 = tbls.find(t => t.textContent.includes('Transportation information'));
  if (s14) {
    const trs = Array.from(s14.getElementsByTagName('w:tr'));
    for (const r of trs) {
      const tcs = Array.from(r.getElementsByTagName('w:tc'));
      console.log(`  ${tcs[0]?.textContent?.trim()} -> ${tcs[1]?.textContent?.trim()}`);
    }
  }

  console.log('\n=== EN Media Files in Zip ===');
  for (const name of Object.keys(zip.files)) {
    if (name.includes('media')) {
      const entry = zip.files[name];
      console.log('  ', name, entry.dir ? 'dir' : 'file');
    }
  }
}

checkDetails().catch(console.error);
