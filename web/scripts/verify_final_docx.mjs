import JSZip from 'jszip';
import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
const parser = new dom.window.DOMParser();
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

async function verifyDocx(path, isEn = false) {
  console.log(`\n================ Checking: ${path} ================`);
  const buf = await fs.readFile(path);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  const doc = parser.parseFromString(xml, 'application/xml');

  const tbls = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl')).concat(Array.from(doc.getElementsByTagName('w:tbl')));
  const s11Tbl = tbls.find(t => t.textContent.includes('11.1'));
  if (!s11Tbl) {
    console.error('Section 11 table NOT found');
    return;
  }

  const trs = Array.from(s11Tbl.getElementsByTagNameNS(W_NS, 'tr')).concat(Array.from(s11Tbl.getElementsByTagName('w:tr')));
  console.log('Section 11 total rows:', trs.length);

  // Check Row 11.1 (tr[3]) and Row 11.3 (tr[5])
  const row11_1 = trs[3];
  const row11_3 = trs[5];
  const row11_6 = trs[8];

  const checkRow = (row, label) => {
    const tcs = Array.from(row.getElementsByTagNameNS(W_NS, 'tc')).concat(Array.from(row.getElementsByTagName('w:tc')));
    const valTc = tcs[tcs.length - 1];
    const ps = Array.from(valTc.getElementsByTagNameNS(W_NS, 'p')).concat(Array.from(valTc.getElementsByTagName('w:p')));
    console.log(`\n--- ${label} (paragraphs count: ${ps.length}) ---`);
    ps.forEach((p, i) => {
      const spacing = p.getElementsByTagNameNS(W_NS, 'spacing')[0] || p.getElementsByTagName('w:spacing')[0];
      const line = spacing ? spacing.getAttribute('w:line') : null;
      const lineRule = spacing ? spacing.getAttribute('w:lineRule') : null;
      const before = spacing ? spacing.getAttribute('w:before') : null;
      const after = spacing ? spacing.getAttribute('w:after') : null;
      const text = p.textContent.trim();
      console.log(`  P${i}: [${text}] -> line=${line}, rule=${lineRule}, before=${before}, after=${after}`);
    });
  };

  checkRow(row11_1, 'Row 11.1 Oral');
  checkRow(row11_3, 'Row 11.3 Inhalation');
  checkRow(row11_6, 'Row 11.6 Sensitization');
}

async function run() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/01-1 单组份水性聚氨酯树脂 PU/PU-2346A';
  await verifyDocx(`${dir}/PU-2346A msds_CN 冠志.docx`, false);
  await verifyDocx(`${dir}/PU-2346A msds_EN Guanzhi.docx`, true);

  const userDir = 'E:/冠志/TDS MSDS (2)/待处理文件/PU-2346A';
  console.log('\n--- Checking user directory sync ---');
  const userFiles = await fs.readdir(userDir);
  console.log('User directory files count:', userFiles.length);
  userFiles.forEach(f => console.log('  -', f));
}

run().catch(console.error);
