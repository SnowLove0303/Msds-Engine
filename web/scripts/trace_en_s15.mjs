import fs from 'fs';
import path from 'path';
import {
  parseDocxToEngine,
  buildBaseChineseEngine,
  buildBaseEnglishEngine,
  generateDocxBufferFromEngine,
  TEMPLATES_DIR
} from '../src/pipeline-engine.js';
import { runSmartMatching } from '../src/smart-matching.js';
import { extractSourceFacts } from '../src/source-extractor.js';
import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';

async function trace() {
  const srcPath = '算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-3654/PA-3654 MSDS（冠志）_源文件留存.docx';
  const srcBuf = fs.readFileSync(srcPath);
  const srcEngine = await parseDocxToEngine(srcBuf);
  const facts = await extractSourceFacts(srcBuf, srcEngine);
  facts.srcEngine = srcEngine;

  const baseCnEngine = await buildBaseChineseEngine({
    modelCode: 'PA-3654',
    sourceBuffer: srcBuf,
    srcEngine,
    facts,
    presetKey: 'guanzhi'
  });

  const baseEnEngine = await buildBaseEnglishEngine({
    modelCode: 'PA-3654',
    baseCnEngine,
    facts,
    presetKey: 'guanzhi'
  });

  console.log('--- In baseEnEngine before docx generation ---');
  const s15 = baseEnEngine.records.find(r => r.sectionNumber === 15);
  s15.rows.forEach((r, i) => {
    console.log(`Row ${i}: "${r.cells[0]?.text}"`);
  });

  const enBuf = await generateDocxBufferFromEngine(baseEnEngine, 'guanzhi', true, 'PA-3654');
  const zip = await JSZip.loadAsync(enBuf);
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const tables = Array.from(doc.getElementsByTagName('w:tbl'));
  const s15Tbl = tables[14];
  console.log('--- In generated docx after typography ---');
  const rows = Array.from(s15Tbl.getElementsByTagName('w:tr'));
  rows.forEach((r, i) => {
    const cells = Array.from(r.getElementsByTagName('w:tc'));
    console.log(`Row ${i}: "${cells[0]?.textContent}"`);
  });
}

trace();
