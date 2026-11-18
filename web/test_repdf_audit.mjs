import { runMasterMsdsAudit } from './scripts/run_master_msds_audit.mjs';
import { convertBatchDocxToPdf } from './src/pdf-converter.js';
import fs from 'fs';

const docxPaths = [
  '算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_CN 冠志.docx',
  '算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/EP-1736 msds_EN Guanzhi.docx'
];

const inputs = docxPaths.map(p => ({
  docxBuffer: fs.readFileSync(p),
  fileName: p.split('/').pop()
}));

const pdfOutputs = await convertBatchDocxToPdf(inputs);
for (const p of pdfOutputs) {
  const finalPdf = '算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736/' + p.pdfName;
  fs.writeFileSync(finalPdf, p.pdfBuffer);
  console.log('✓ Re-rendered PDF:', p.pdfName);
}

const res = await runMasterMsdsAudit('EP-1736', '算法训练材料/TDS MSDS 重写版/04-1 水性环氧树脂 EP/EP-1736');
console.log('EP-1736 Audit passed:', res.success, 'total:', res.total, 'passed:', res.passed, 'failed:', res.failed);
