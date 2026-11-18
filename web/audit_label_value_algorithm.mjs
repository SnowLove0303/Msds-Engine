import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import fs from 'fs';
import path from 'path';
import { loadDocx } from './src/docx-engine.js';
import { runSmartMatching } from './src/smart-matching.js';

const SAMPLES = [
  { name: 'PU-1007', cat: '水性聚氨酯 (非危+全量实测)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/1-1 单组份水性聚氨酯树脂 PU/PU-1007/PU-1007 msds_CN 冠志.docx' },
  { name: 'PU-202A', cat: '水性聚氨酯 (强危+NMP生殖毒性)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/1-1 单组份水性聚氨酯树脂 PU/PU-202A/PU-202A msds_CN 冠志.docx' },
  { name: 'HPU-7651', cat: '羟基聚氨酯 (非标表述非危)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/1-2 水性羟基聚氨酯树脂 HPU/HPU-7651/HPU-7651 msds_CN 冠志.docx' },
  { name: 'PA-3110', cat: '羟基丙烯酸 (5组分+压缩排版)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/2-3 水性羟基丙烯酸二级分散体 PA/PA-3110/PA-3110 msds_CN 冠志_(2).docx' },
  { name: 'OS-9012', cat: '异氰酸酯固化剂 (强危+多致敏)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/6-1 水分散型异氰酸酯固化剂 OS/OS-9012/OS-9012 msds_CN 冠志.docx' },
  { name: 'EP-1601', cat: '水性环氧 (环境危H412+纯声明)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/4-1 水性环氧树脂 EP/EP-1601/EP-1601 msds_CN 冠志.docx' },
  { name: '2-苯氧基乙醇', cat: '水性助剂 (单一物质)', path: 'F:/App Location/Guanzhi Tong/Skill/MSDS Skill/TDS MSDS 预处理/7 水性助剂 OS等/2-苯氧基乙醇/2-苯氧基乙醇 msds_CN 冠志.docx' }
];

async function examineModel(s) {
  const buf = fs.readFileSync(s.path);
  const engine = await loadDocx(buf);
  const matchResult = runSmartMatching(engine.records);

  const report = {
    name: s.name,
    cat: s.cat,
    sections: {}
  };

  // Inspect each section's label-value matching quality
  for (const ms of matchResult.matchedSections) {
    const secNum = ms.sectionNumber;
    const rows = (ms.matchedRows || []).map(r => ({
      key: r.key,
      standardLabel: r.standardLabel,
      rawLabel: r.rawSnippet ? r.rawSnippet.split(/\s+/)[0] : '',
      rawSnippet: r.rawSnippet,
      value: r.value,
      status: r.status,
      conditionQualifier: r.conditionQualifier,
      reason: r.reason
    }));

    report.sections[secNum] = {
      title: ms.title,
      rowCount: rows.length,
      rows: rows
    };
  }

  return report;
}

async function main() {
  const allReports = [];
  for (const s of SAMPLES) {
    const r = await examineModel(s);
    allReports.push(r);
  }
  fs.writeFileSync('./data/deep_label_value_audit.json', JSON.stringify(allReports, null, 2), 'utf8');
  console.log('Saved deep audit to ./data/deep_label_value_audit.json');
}

main().catch(console.error);
