import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

async function analyze() {
  const tmplBuf = fs.readFileSync('public/templates/正式模板_MSDS_EN_冠志(1).docx');
  const cnBuf = fs.readFileSync('../算法训练材料/PU-608/PU-608 msds_CN 冠志 手动导出.docx');

  for (const [docLabel, buf] of [['EN Template', tmplBuf], ['CN Benchmark', cnBuf]]) {
    console.log(`\n======================================================`);
    console.log(`            DOCUMENT: ${docLabel}`);
    console.log(`======================================================`);
    const zip = await JSZip.loadAsync(buf);
    const docXml = await zip.file('word/document.xml').async('text');
    const doc = new DOMParser().parseFromString(docXml, 'text/xml');
    const tables = Array.from(doc.getElementsByTagName('w:tbl'));

    tables.forEach((tbl, idx) => {
      const rows = Array.from(tbl.getElementsByTagName('w:tr'));
      const r0 = rows[0]?.textContent.trim().replace(/\s+/g, ' ') || '';
      console.log(`\n--- [Section Table ${idx + 1}] Header: "${r0}" (${rows.length} rows) ---`);
      rows.forEach((r, rIdx) => {
        const cells = Array.from(r.getElementsByTagName('w:tc'));
        const c0 = cells[0];
        const p0 = c0?.getElementsByTagName('w:p')[0];
        const ind = p0?.getElementsByTagName('w:ind')[0];
        const left = ind?.getAttribute('w:left');
        const hanging = ind?.getAttribute('w:hanging');
        const c0Text = (c0?.textContent || '').trim().replace(/\s+/g, ' ');
        const c1Text = (cells[1]?.textContent || '').trim().replace(/\s+/g, ' ');
        
        // Match sequence number if any
        const seqMatch = c0Text.match(/^(\d+(?:\.\d+)*)\s*(.*)$/);
        const hasSeq = !!seqMatch;
        const seqStr = seqMatch ? seqMatch[1] : '';
        const labelText = seqMatch ? seqMatch[2] : c0Text;

        console.log(`  Row ${rIdx} (${cells.length} cells): hasSeq=${hasSeq ? seqStr : 'NO'} | ind=${left}/${hanging} | Col0: "${c0Text}" | Col1: "${c1Text.slice(0, 30)}"`);
      });
    });
  }
}

analyze().catch(console.error);
