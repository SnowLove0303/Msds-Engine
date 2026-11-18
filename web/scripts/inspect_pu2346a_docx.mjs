import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
import path from 'path';

const dir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx') && f.includes('msds'));

console.log('Inspecting MSDS DOCX files in:', dir);

async function run() {
  for (const f of files) {
    const filePath = path.join(dir, f);
    const buf = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buf);
    const docEntry = zip.file('word/document.xml');
    if (!docEntry) continue;
    const xmlStr = await docEntry.async('text');
    const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    
    const tables = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
    console.log(`\n=== File: ${f} (Total tables: ${tables.length}) ===`);

    // Table 3 (Section 3)
    if (tables[2]) {
      const t3 = tables[2];
      const numPrs = Array.from(t3.getElementsByTagNameNS(W_NS, 'numPr'));
      console.log(`Table 3 numPr count: ${numPrs.length}`);
      const rows = Array.from(t3.getElementsByTagNameNS(W_NS, 'tr'));
      rows.forEach((r, idx) => {
        const text = r.textContent?.replace(/\s+/g, ' ').trim() || '';
        console.log(`  Row ${idx}: ${text}`);
        const rNumPrs = Array.from(r.getElementsByTagNameNS(W_NS, 'numPr'));
        if (rNumPrs.length > 0) {
          console.log(`    WARNING: Row ${idx} has ${rNumPrs.length} numPr elements!`);
          for (const np of rNumPrs) {
            console.log(`      numPr XML: ${np.toString()}`);
          }
        }
      });
    }

    const allNumPrs = Array.from(doc.getElementsByTagNameNS(W_NS, 'numPr'));
    console.log(`Total numPr in entire document: ${allNumPrs.length}`);
    if (allNumPrs.length > 0) {
      console.log(`Sample numPr in doc: ${allNumPrs.slice(0, 3).map(np => np.toString()).join(' | ')}`);
    }
  }
}

run().catch(console.error);
