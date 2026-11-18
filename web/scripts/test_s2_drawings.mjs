import { DocxEngine } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

async function test() {
  const cnPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1848/EC-1848 msds_CN 冠志.docx';
  const eng = await DocxEngine.fromFile(cnPath);
  const cnS2 = eng.records.find(r => r.sectionNumber === 2);
  console.log('cnS2 found:', !!cnS2);
  console.log('cnS2 rows:', cnS2?.rows?.length);

  const tblDrawings = cnS2.node ? Array.from(cnS2.node.getElementsByTagNameNS('*', 'drawing') || []) : [];
  console.log('tblDrawings length:', tblDrawings.length);

  let cellDrawings = [];
  for (const r of cnS2.rows) {
    for (const c of r.cells) {
      if (c.node) {
        const d = Array.from(c.node.getElementsByTagNameNS('*', 'drawing') || []);
        cellDrawings.push(...d);
      }
    }
  }
  console.log('cellDrawings length:', cellDrawings.length);
}

test().catch(console.error);
