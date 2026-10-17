import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

console.log('=== MSDS-Engine 全量深度法证级综合审计启动 ===\n');

const tplCnGuanzhiPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/public/templates/正式模板_MSDS_CN_冠志(1).docx';
const tplCnGuanzhiBuf = await fs.readFile(tplCnGuanzhiPath);

async function generateAutoDocx(srcPath, tplBuf, docName) {
  const srcBuf = await fs.readFile(srcPath);
  const srcDoc = await loadDocx(srcBuf, `${docName}_src.docx`);
  const tplDoc = await loadDocx(tplBuf, `${docName}_tpl.docx`);
  const matchRes = runSmartMatching(srcDoc.records);
  applyMatchResultToEditor(matchRes, tplDoc);
  const exportedBuf = await tplDoc.exportArrayBuffer();
  const reloadedDoc = await loadDocx(exportedBuf, `${docName}_auto_final.docx`);
  return { srcDoc, tplDoc, reloadedDoc, matchRes };
}

function normalizeText(txt) {
  return String(txt || '').replace(/\r\n/g, '\n').trim();
}

function compareDocxRecords(autoDoc, manualDoc, modelName) {
  const report = {
    model: modelName,
    sections: [],
    cantSplitCount: autoDoc.documentXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'cantSplit').length,
    drawingsCount: autoDoc.documentXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'drawing').length,
    mediaFilesCount: autoDoc.mediaFiles?.size || 0,
    differences: [],
  };

  for (let s = 1; s <= 16; s++) {
    const autoSec = autoDoc.records.find((r) => r.sectionNumber === s && r.kind === 'table');
    const manSec = manualDoc.records.find((r) => r.sectionNumber === s && r.kind === 'table');

    const secInfo = {
      section: s,
      title: autoSec?.title || manSec?.title || `Section ${s}`,
      autoRows: autoSec?.rows?.length || 0,
      manRows: manSec?.rows?.length || 0,
      rowDelta: (autoSec?.rows?.length || 0) - (manSec?.rows?.length || 0),
      cellDifferences: [],
    };

    if (autoSec && manSec) {
      const minRows = Math.min(autoSec.rows.length, manSec.rows.length);
      for (let r = 0; r < minRows; r++) {
        const autoRow = autoSec.rows[r];
        const manRow = manSec.rows[r];
        const minCells = Math.min(autoRow.cells.length, manRow.cells.length);
        for (let c = 0; c < minCells; c++) {
          const autoTxt = normalizeText(autoRow.cells[c]?.text);
          const manTxt = normalizeText(manRow.cells[c]?.text);
          if (autoTxt !== manTxt) {
            secInfo.cellDifferences.push({
              row: r,
              col: c,
              autoText: autoTxt,
              manText: manTxt,
            });
          }
        }
      }
    }
    report.sections.push(secInfo);
  }
  return report;
}

const auditResults = [];

// 1. 审计 EP-1702
console.log('--- 正在审计 EP-1702 ---');
const ep1702SrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志（源文件）.docx';
const ep1702ManPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1702/EP-1702 msds_CN 冠志 (手动调整）.docx';
const ep1702ManDoc = await loadDocx(await fs.readFile(ep1702ManPath), 'EP-1702_man.docx');
const { reloadedDoc: ep1702AutoDoc } = await generateAutoDocx(ep1702SrcPath, tplCnGuanzhiBuf, 'EP-1702');
auditResults.push(compareDocxRecords(ep1702AutoDoc, ep1702ManDoc, 'EP-1702'));

// 2. 审计 EP-1704 (EP-1740)
console.log('--- 正在审计 EP-1704 ---');
const ep1704SrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1704/EP-1740 msds_CN 冠志(源文件).docx';
const ep1704ManPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/EP-1704/EP-1740 msds_CN 冠志 （手动产出）.docx';
const ep1704ManDoc = await loadDocx(await fs.readFile(ep1704ManPath), 'EP-1704_man.docx');
const { reloadedDoc: ep1704AutoDoc } = await generateAutoDocx(ep1704SrcPath, tplCnGuanzhiBuf, 'EP-1704');
auditResults.push(compareDocxRecords(ep1704AutoDoc, ep1704ManDoc, 'EP-1704'));

// 3. 审计 PU-2702
console.log('--- 正在审计 PU-2702 ---');
const pu2702SrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-2702/PU-2702 msds_CN 冠志(源文件）.docx';
const pu2702ManPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-2702/手动产出/PU-2702 msds_CN 冠志(2).docx';
const pu2702ManDoc = await loadDocx(await fs.readFile(pu2702ManPath), 'PU-2702_man.docx');
const { reloadedDoc: pu2702AutoDoc } = await generateAutoDocx(pu2702SrcPath, tplCnGuanzhiBuf, 'PU-2702');
auditResults.push(compareDocxRecords(pu2702AutoDoc, pu2702ManDoc, 'PU-2702'));

// 4. 审计 PU-303C (象形图真图)
console.log('--- 正在审计 PU-303C ---');
const pu303cSrcPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-303A/PU-303C msds_CN 冠志（源文件）.docx';
const { reloadedDoc: pu303cAutoDoc } = await generateAutoDocx(pu303cSrcPath, tplCnGuanzhiBuf, 'PU-303C');
auditResults.push({
  model: 'PU-303C',
  cantSplitCount: pu303cAutoDoc.documentXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'cantSplit').length,
  drawingsCount: pu303cAutoDoc.documentXml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'drawing').length,
  mediaFilesCount: pu303cAutoDoc.mediaFiles?.size || 0,
});

await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/scripts/audit_dump.json', JSON.stringify(auditResults, null, 2), 'utf8');
console.log('✅ 法证审计数据提取完成，已输出至 web/scripts/audit_dump.json！');
