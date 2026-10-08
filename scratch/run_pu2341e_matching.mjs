import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../web/src/docx-engine.js';
import { runSmartMatching, applyMatchResultToEditor } from '../web/src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const samplePath = 'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-2341E/中文版/PU-2341E msds_CN 冠志.docx';
const tplPath = path.resolve('../web/public/templates/正式模板_MSDS_CN_冠志(1).docx');

console.log('正在读取源文件与模板...');
const [sourceBuf, tplBuf] = await Promise.all([
  fs.readFile(samplePath),
  fs.readFile(tplPath),
]);

console.log('正在解析 DOCX 结构...');
const sourceEngine = await loadDocx(sourceBuf, 'PU-2341E msds_CN 冠志.docx');
const tplEngine = await loadDocx(tplBuf, '正式模板_MSDS_CN_冠志(1).docx');

console.log('正在执行智能匹配引擎 (runSmartMatching)...');
const matchResult = runSmartMatching(sourceEngine.records);

console.log('正在应用匹配结果至模板插槽 (applyMatchResultToEditor)...');
const injectRes = applyMatchResultToEditor(matchResult, tplEngine);

console.log(`匹配注入统计: 注入字段 = ${injectRes.injectedCount}, 剪枝 = ${injectRes.prunedCount}`);

// 提取 16 个 Section 的具体内容
const sectionReports = [];

for (let secNum = 1; secNum <= 16; secNum++) {
  const tplRecord = (tplEngine.records || []).find((r) => r.kind === 'table' && r.sectionNumber === secNum);
  const rawRecord = (sourceEngine.records || []).find((r) => r.kind === 'table' && r.sectionNumber === secNum);

  const sectionData = {
    sectionNumber: secNum,
    title: tplRecord?.title || rawRecord?.title || `Section ${secNum}`,
    rows: [],
  };

  if (tplRecord && tplRecord.rows) {
    for (const row of tplRecord.rows) {
      if (row.index === 0) continue; // 跳过表头 Section 标题行
      const cells = row.cells || [];
      if (cells.length === 0) continue;

      // 第一列通常是序号/标签，后续列是值
      const labelCell = cells[0];
      const valueCells = cells.slice(1);

      const labelText = labelCell.text.trim();
      const valueText = valueCells.map((c) => c.text.trim()).filter(Boolean).join(' | ');

      sectionData.rows.push({
        rowIndex: row.index,
        label: labelText,
        value: valueText,
        cellCount: cells.length,
        cells: cells.map((c) => c.text.trim()),
      });
    }
  }

  sectionReports.push(sectionData);
}

const outputPath = path.resolve('./scratch/pu2341e_matched_report.json');
await fs.writeFile(outputPath, JSON.stringify({
  sampleName: 'PU-2341E msds_CN 冠志.docx',
  summary: matchResult.summary,
  injectRes,
  sections: sectionReports,
}, null, 2), 'utf-8');

console.log(`分析完成！已输出报告数据至: ${outputPath}`);
