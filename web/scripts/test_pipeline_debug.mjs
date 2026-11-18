import fs from 'fs';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

async function main() {
  const p = 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\算法训练材料\\源文件材料\\2-1 单组份水性丙烯酸乳液 PA\\PA-3653\\PA-3653 MSDS（冠志）.docx';
  const buf = fs.readFileSync(p);
  const srcEngine = await loadDocx(buf, 'source.docx');
  const matchResult = runSmartMatching(srcEngine.records);

  const cnTplPath = 'F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\web\\public\\templates\\正式模板_MSDS_CN_冠志(1).docx';
  const cnTplBuf = await fs.promises.readFile(cnTplPath);

  // Test sections 9 to 16
  for (const s of matchResult.matchedSections.filter(x => x.sectionNumber >= 9)) {
    console.log(`Testing applyMatchResultToEditor for Section ${s.sectionNumber}...`);
    const t0 = Date.now();
    const singleEngine = await loadDocx(cnTplBuf, `test_sec_${s.sectionNumber}.docx`);
    const partialMatch = {
      ...matchResult,
      matchedSections: [s]
    };
    applyMatchResultToEditor(partialMatch, singleEngine);
    console.log(`  Section ${s.sectionNumber} PASSED in ${Date.now() - t0} ms!`);
  }
  console.log('ALL SECTIONS 9-16 PASSED!');
}

main().catch(console.error);
