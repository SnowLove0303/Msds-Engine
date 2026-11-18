import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { execSync } from 'node:child_process';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { W_NS } from '../src/docx-engine.js';

function setRunProps(doc, rNode, { fontSize = null, bold = null, color = null, fontFamily = null }) {
  if (!rNode) return;
  let rPr = rNode.getElementsByTagNameNS(W_NS, 'rPr')[0];
  if (!rPr) {
    rPr = doc.createElementNS(W_NS, 'w:rPr');
    rNode.insertBefore(rPr, rNode.firstChild);
  }
  if (fontSize !== null) {
    let sz = rPr.getElementsByTagNameNS(W_NS, 'sz')[0];
    if (!sz) {
      sz = doc.createElementNS(W_NS, 'w:sz');
      rPr.appendChild(sz);
    }
    sz.setAttributeNS(W_NS, 'w:val', String(fontSize));
    let szCs = rPr.getElementsByTagNameNS(W_NS, 'szCs')[0];
    if (!szCs) {
      szCs = doc.createElementNS(W_NS, 'w:szCs');
      rPr.appendChild(szCs);
    }
    szCs.setAttributeNS(W_NS, 'w:val', String(fontSize));
  }
  if (bold !== null) {
    let existingB = rPr.getElementsByTagNameNS(W_NS, 'b')[0];
    if (bold && !existingB) {
      const bNode = doc.createElementNS(W_NS, 'w:b');
      rPr.appendChild(bNode);
    } else if (!bold && existingB) {
      rPr.removeChild(existingB);
    }
  }
  if (color !== null) {
    let colorNode = rPr.getElementsByTagNameNS(W_NS, 'color')[0];
    if (!colorNode) {
      colorNode = doc.createElementNS(W_NS, 'w:color');
      rPr.appendChild(colorNode);
    }
    colorNode.setAttributeNS(W_NS, 'w:val', color);
  }
}

const tplDocx = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/dist/templates/custom/custom_mcp_template_v1_正式模板_MSDS_CN_冠志(1).docx';
const testDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/tests/test_footer_sim';

async function run() {
  const zip = await JSZip.loadAsync(fs.readFileSync(tplDocx));
  const xmlText = await zip.file('word/footer1.xml').async('text');
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const tbl = doc.getElementsByTagNameNS(W_NS, 'tbl')[0];
  const rows = Array.from(tbl.getElementsByTagNameNS(W_NS, 'tr'));

  // 1. Row 0 Cell 0 (Company)
  const cell0 = rows[0].getElementsByTagNameNS(W_NS, 'tc')[0];
  const p0 = cell0.getElementsByTagNameNS(W_NS, 'p')[0];
  const run0 = p0.getElementsByTagNameNS(W_NS, 'r')[0];
  run0.getElementsByTagNameNS(W_NS, 't')[0].textContent = '广州冠志新材料科技有限公司 PU-6013BIO-MSDS';
  const otherRuns0 = Array.from(p0.getElementsByTagNameNS(W_NS, 'r')).slice(1);
  for (const r of otherRuns0) p0.removeChild(r);

  // 2. Row 0 Cell 1 (Revision Date)
  const cell1 = rows[0].getElementsByTagNameNS(W_NS, 'tc')[1];
  let tcPr1 = cell1.getElementsByTagNameNS(W_NS, 'tcPr')[0];
  if (!tcPr1) {
    tcPr1 = doc.createElementNS(W_NS, 'w:tcPr');
    cell1.insertBefore(tcPr1, cell1.firstChild);
  }
  let vAlign1 = tcPr1.getElementsByTagNameNS(W_NS, 'vAlign')[0];
  if (!vAlign1) {
    vAlign1 = doc.createElementNS(W_NS, 'w:vAlign');
    tcPr1.appendChild(vAlign1);
  }
  vAlign1.setAttributeNS(W_NS, 'w:val', 'center');

  const p1 = cell1.getElementsByTagNameNS(W_NS, 'p')[0];
  let pPr1 = p1.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (!pPr1) {
    pPr1 = doc.createElementNS(W_NS, 'w:pPr');
    p1.insertBefore(pPr1, p1.firstChild);
  }
  const oldInd = pPr1.getElementsByTagNameNS(W_NS, 'ind')[0];
  if (oldInd) pPr1.removeChild(oldInd);

  let spacing1 = pPr1.getElementsByTagNameNS(W_NS, 'spacing')[0];
  if (!spacing1) {
    spacing1 = doc.createElementNS(W_NS, 'w:spacing');
    pPr1.appendChild(spacing1);
  }
  spacing1.setAttributeNS(W_NS, 'w:line', '0');
  spacing1.setAttributeNS(W_NS, 'w:lineRule', 'atLeast');
  spacing1.removeAttributeNS(W_NS, 'before');
  spacing1.removeAttributeNS(W_NS, 'after');

  const run1 = p1.getElementsByTagNameNS(W_NS, 'r')[0];
  run1.getElementsByTagNameNS(W_NS, 't')[0].textContent = '修订日期：2026/11/17';
  setRunProps(doc, run1, { fontSize: 18, bold: false, color: '7F7F7F', fontFamily: '楷体_GB2312' });

  // 3. Row 1 Cell 1 (Page Number)
  const cellPage = rows[1].getElementsByTagNameNS(W_NS, 'tc')[1];
  const pPage = cellPage.getElementsByTagNameNS(W_NS, 'p')[0];
  const pPrPage = pPage.getElementsByTagNameNS(W_NS, 'pPr')[0];
  if (pPrPage) {
    const rPrPage = pPrPage.getElementsByTagNameNS(W_NS, 'rPr')[0];
    if (rPrPage) {
      const sz = rPrPage.getElementsByTagNameNS(W_NS, 'sz')[0];
      if (sz) sz.setAttributeNS(W_NS, 'w:val', '18');
      const szCs = rPrPage.getElementsByTagNameNS(W_NS, 'szCs')[0];
      if (szCs) szCs.setAttributeNS(W_NS, 'w:val', '18');
    }
  }
  const runsPage = Array.from(pPage.getElementsByTagNameNS(W_NS, 'r'));
  for (const r of runsPage) {
    setRunProps(doc, r, { fontSize: 18, bold: false, fontFamily: '楷体_GB2312' });
  }

  const modifiedXml = serializer.serializeToString(doc);
  zip.file('word/footer1.xml', modifiedXml);

  const outDocx = path.join(testDir, 'test_aligned.docx');
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(outDocx, buf);

  console.log('Converting test_aligned.docx to PDF...');
  execSync(`soffice --headless --convert-to pdf "${outDocx}" --outdir "${testDir}"`, { stdio: 'inherit' });

  const pyScript = `
import pymupdf
import sys

doc = pymupdf.open(sys.argv[1])
p0 = doc[0]
rect = p0.rect
words = p0.get_text('words')
print('--- PDF Footer Words ---')
companyBox = None
dateBox = None
pageBox = None
for w in words:
    if w[1] > rect.height - 150:
        print(f"Word: {w[4]:<35} Box: ({w[0]:.1f}, {w[1]:.1f}, {w[2]:.1f}, {w[3]:.1f})")
        if '冠志' in w[4] or 'PU-6013BIO' in w[4]:
            companyBox = w
        if '修订日期' in w[4] or '2026' in w[4]:
            dateBox = w
        if w[4] == '1':
            pageBox = w

if companyBox and dateBox:
    deltaY = abs(companyBox[3] - dateBox[3])
    print(f"Measured Delta Y (bottom baseline): {deltaY:.2f} pt")
if pageBox:
    pageH = pageBox[3] - pageBox[1]
    print(f"Measured Page Number Box Height: {pageH:.2f} pt")
`;
  fs.writeFileSync(path.join(testDir, 'extract.py'), pyScript, 'utf8');
  const outPdf = path.join(testDir, 'test_aligned.pdf');
  execSync(`python "${path.join(testDir, 'extract.py')}" "${outPdf}"`, { stdio: 'inherit' });
}

run().catch(console.error);
