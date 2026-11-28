import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const parser = new dom.window.DOMParser();
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/12 水性噁唑啉交联剂 OX/OS-8970';

async function inspectDoc(filename) {
  const filePath = path.join(baseDir, filename);
  console.log(`\n=================== Inspecting ${filename} ===================`);
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = parser.parseFromString(xml, 'application/xml');

  const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'));
  tbls.forEach((tbl, tIdx) => {
    const trs = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));
    const secTitle = trs[0]?.textContent?.trim().slice(0, 40);
    console.log(`\n--- Table ${tIdx + 1} (${secTitle}) [${trs.length} rows] ---`);

    trs.forEach((tr, rIdx) => {
      const tcs = Array.from(tr.getElementsByTagNameNS(W_NS, 'tc'));
      tcs.forEach((tc, cIdx) => {
        const runs = Array.from(tc.getElementsByTagNameNS(W_NS, 'r'));
        runs.forEach((r) => {
          const text = r.textContent?.trim();
          if (!text) return;
          const rPr = r.getElementsByTagNameNS(W_NS, 'rPr')[0];
          const sz = rPr?.getElementsByTagNameNS(W_NS, 'sz')[0]?.getAttribute('w:val') || 'none';
          const b = Boolean(rPr?.getElementsByTagNameNS(W_NS, 'b')[0]);
          const rFonts = rPr?.getElementsByTagNameNS(W_NS, 'rFonts')[0];
          const ascii = rFonts?.getAttribute('w:ascii') || 'none';
          const eastAsia = rFonts?.getAttribute('w:eastAsia') || 'none';

          // Report unusual:
          // In CN, row 0 is sz=24 (bold=true).
          // Col 0: Seq is sz=21 (or 19) bold=true; Label is sz=24 bold=true.
          // Col 1+: Value is sz=24, bold=false!
          const isSeq = /^(\d+\.\d+(?:\.\d+)?)\s*$/.test(text);
          if (rIdx === 0 && sz !== '24') {
            console.log(`  [HEADER VIOLATION] R${rIdx}C${cIdx}: "${text.slice(0, 30)}" -> sz=${sz}, b=${b}`);
          } else if (cIdx === 0 && rIdx > 0) {
            if (isSeq && (sz !== '21' && sz !== '19')) {
              console.log(`  [CN SEQ VIOLATION] R${rIdx}C${cIdx}: "${text}" -> sz=${sz}, b=${b}, font=${ascii}/${eastAsia}`);
            } else if (!isSeq && sz !== '24') {
              console.log(`  [CN LBL VIOLATION] R${rIdx}C${cIdx}: "${text.slice(0, 30)}" -> sz=${sz}, b=${b}, font=${ascii}/${eastAsia}`);
            }
          } else if (cIdx > 0 && rIdx > 0) {
            if (sz !== '24') {
              console.log(`  [CN VAL SZ VIOLATION] R${rIdx}C${cIdx}: "${text.slice(0, 30)}" -> sz=${sz}`);
            }
            if (b) {
              console.log(`  [CN VAL BOLD VIOLATION] R${rIdx}C${cIdx}: "${text.slice(0, 30)}" -> b=true`);
            }
          }
        });
      });
    });
  });
}

inspectDoc('OS-8970 msds_CN 冠志.docx').catch(console.error);
