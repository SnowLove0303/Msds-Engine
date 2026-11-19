import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const {
  buildBaseChineseEngine,
  buildBaseEnglishEngine
} = await import('../src/pipeline-engine.js');

async function testMatch() {
  const modelCode = 'PA-3654';
  const cnGroundTruthPath = '算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';

  const baseCn = await buildBaseChineseEngine({ modelCode, cnGroundTruthPath });
  const baseEn = await buildBaseEnglishEngine({ modelCode, baseCnEngine: baseCn });

  const xmlDoc = baseEn.documentXml;
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tables = Array.from(xmlDoc.getElementsByTagNameNS(W_NS, 'tbl'));
  const s15Tbl = tables[14];
  const rows = Array.from(s15Tbl.getElementsByTagNameNS(W_NS, 'tr'));

  rows.forEach((r, i) => {
    const cells = Array.from(r.getElementsByTagNameNS(W_NS, 'tc'));
    cells.forEach((c, ci) => {
      const ps = Array.from(c.getElementsByTagNameNS(W_NS, 'p'));
      ps.forEach(p => {
        const pText = (p.textContent || '').trim();
        const s15Match = pText.match(/^(\s*(?:其它的规定|其它规定|其他规定|Other provisions|Other regulations|符合下列法规要求|Complies with the following regulations))[:：]\s*(.*)$/i);
        console.log(`Row ${i} Cell ${ci}: pText="${pText}" match=${!!s15Match}`);
        if (s15Match) {
          console.log(`   match[1]="${s15Match[1]}" match[2]="${s15Match[2]}"`);
        }
      });
    });
  });
}

testMatch().catch(e => console.error(e));
