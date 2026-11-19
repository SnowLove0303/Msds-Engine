import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { convertBatchDocxToPdf } from '../src/pdf-converter.js';

const targetDirs = [
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-3 水性聚碳化二亚胺交联剂 OS/OS-8503DMM',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-3 水性聚碳化二亚胺交联剂 OS/OS-8503 DMM'
];

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function patchDocxXml(xml, isEnglish) {
  const dom = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = dom.getElementsByTagName('w:tbl');

  // =========================================================================
  // 1. Section 1 (Table 0)
  // =========================================================================
  const s1Tbl = tbls[0];
  const s1Rows = s1Tbl.getElementsByTagName('w:tr');

  if (!isEnglish) {
    // 中文版 Section 1:
    // Row 1 (1.1 产品名称：) -> tc[1] 留空 (产品名称留空特权，企业规程禁止填型号)
    const r1_c1 = s1Rows[1].getElementsByTagName('w:tc')[1];
    const r1_c1_p = r1_c1.getElementsByTagName('w:p')[0];
    const r1_runs = Array.from(r1_c1_p.getElementsByTagName('w:r'));
    r1_runs.forEach(r => r1_c1_p.removeChild(r));

    // Row 2 (中文名称：) -> tc[1] 填入 "碳化二亚胺交联剂 OS-8503DMM" (产品品名 + 半角空格 + 产品型号)
    const r2_c1 = s1Rows[2].getElementsByTagName('w:tc')[1];
    const r2_c1_p = r2_c1.getElementsByTagName('w:p')[0];
    const r2_runs = Array.from(r2_c1_p.getElementsByTagName('w:r'));
    r2_runs.forEach(r => r2_c1_p.removeChild(r));

    const newR = dom.createElementNS(W_NS, 'w:r');
    const newRPr = dom.createElementNS(W_NS, 'w:rPr');
    const rFonts = dom.createElementNS(W_NS, 'w:rFonts');
    rFonts.setAttribute('w:ascii', 'Times New Roman');
    rFonts.setAttribute('w:hAnsi', 'Times New Roman');
    rFonts.setAttribute('w:eastAsia', '宋体');
    rFonts.setAttribute('w:cs', 'Times New Roman');
    newRPr.appendChild(rFonts);
    const sz = dom.createElementNS(W_NS, 'w:sz');
    sz.setAttribute('w:val', '24');
    newRPr.appendChild(sz);
    const szCs = dom.createElementNS(W_NS, 'w:szCs');
    szCs.setAttribute('w:val', '24');
    newRPr.appendChild(szCs);
    newR.appendChild(newRPr);
    const t = dom.createElementNS(W_NS, 'w:t');
    t.textContent = '碳化二亚胺交联剂 OS-8503DMM';
    newR.appendChild(t);
    r2_c1_p.appendChild(newR);
  } else {
    // 英文版 Section 1:
    // Row 1 (1.1 Product name:) -> 去掉末尾句号
    const r1_c1 = s1Rows[1].getElementsByTagName('w:tc')[1];
    const ts = r1_c1.getElementsByTagName('w:t');
    for (let i = 0; i < ts.length; i++) {
      if (ts[i].textContent.includes('OS-8503DMM.')) {
        ts[i].textContent = ts[i].textContent.replace('OS-8503DMM.', 'OS-8503DMM');
      }
    }

    // Row 2 (Chemical category:) -> 修正为 "Polycarbodiimide"
    const r2_c1 = s1Rows[2].getElementsByTagName('w:tc')[1];
    const r2_ts = r2_c1.getElementsByTagName('w:t');
    for (let i = 0; i < r2_ts.length; i++) {
      if (/Aqueous polymer dispersion/i.test(r2_ts[i].textContent)) {
        r2_ts[i].textContent = 'Polycarbodiimide';
      }
    }
  }

  // =========================================================================
  // 2. Section 8 (Table 7) - 职业接触限值具体值内容恢复 (Row 14)
  // =========================================================================
  const s8Tbl = tbls[7];
  const s8Rows = s8Tbl.getElementsByTagName('w:tr');

  // 若已有超过 14 行，先移除旧追加行保持干净
  if (s8Rows.length > 14) {
    for (let r = s8Rows.length - 1; r >= 14; r--) {
      s8Tbl.removeChild(s8Rows[r]);
    }
  }

  // 现在 s8Rows 严格为 14 行 (Row 0 ~ Row 13)
  // Row 13 为表头: [物质 | 依据 | 类型 | 数值] / [Substance | Basis | Type | Value]
  const r13 = s8Rows[13];
  const r14 = r13.cloneNode(true);
  const r14Tcs = r14.getElementsByTagName('w:tc');

  // 将 r13 底部边框设为 dotted
  const r13Tcs = r13.getElementsByTagName('w:tc');
  for (let i = 0; i < r13Tcs.length; i++) {
    const btm = r13Tcs[i].getElementsByTagName('w:bottom')[0];
    if (btm) btm.setAttribute('w:val', 'dotted');
  }

  // 准备 Row 14 数据
  const dataVals = !isEnglish ?
    ['丙二醇甲醚醋酸酯', 'CN OEL', 'TWA', '100 mg/m3'] :
    ['Propylene glycol methyl ether acetate', 'CN OEL', 'TWA', '100 mg/m3'];

  const szVal = !isEnglish ? '24' : '19';

  for (let c = 0; c < r14Tcs.length; c++) {
    const tc = r14Tcs[c];
    // 确保 r14 底部边框为 single
    const btm = tc.getElementsByTagName('w:bottom')[0];
    if (btm) btm.setAttribute('w:val', 'single');

    const p = tc.getElementsByTagName('w:p')[0];
    // 移除粗体
    const bs = p.getElementsByTagName('w:b');
    Array.from(bs).forEach(b => b.parentNode?.removeChild(b));
    const bCss = p.getElementsByTagName('w:bCs');
    Array.from(bCss).forEach(b => b.parentNode?.removeChild(b));

    // 设置文本
    const t = p.getElementsByTagName('w:t')[0];
    if (t) {
      t.textContent = dataVals[c];
    }

    // 设置字号
    const szs = p.getElementsByTagName('w:sz');
    Array.from(szs).forEach(s => s.setAttribute('w:val', szVal));
    const szCss = p.getElementsByTagName('w:szCs');
    Array.from(szCss).forEach(s => s.setAttribute('w:val', szVal));

    // 对齐方式：第 0 列左对齐，数值列居中
    const jc = p.getElementsByTagName('w:jc')[0];
    if (jc) jc.setAttribute('w:val', c === 0 ? 'left' : 'center');
  }

  s8Tbl.appendChild(r14);

  // =========================================================================
  // 3. Section 9 (Table 8) - 仅英文版补全
  // =========================================================================
  if (isEnglish) {
    const s9Tbl = tbls[8];
    const s9Rows = s9Tbl.getElementsByTagName('w:tr');
    // Row 1 (9.1 Appearance:) -> 补全 Yellow transparent liquid
    const r1_c1 = s9Rows[1].getElementsByTagName('w:tc')[1];
    const r1_ts = r1_c1.getElementsByTagName('w:t');
    for (let i = 0; i < r1_ts.length; i++) {
      if (/Transparent liquid/i.test(r1_ts[i].textContent)) {
        r1_ts[i].textContent = 'Yellow transparent liquid';
      }
    }

    // Row 7 (9.7 Auto-ignition temperature:) -> 补全 Flash point 65 °C
    const r7_c0 = s9Rows[7].getElementsByTagName('w:tc')[0];
    const r7_c0_runs = r7_c0.getElementsByTagName('w:r');
    if (r7_c0_runs.length >= 2) {
      const lblRun = r7_c0_runs[1];
      const lblT = lblRun.getElementsByTagName('w:t')[0];
      if (lblT && lblT.textContent.includes('Auto-ignition temperature:')) {
        lblT.textContent = 'Auto-ignition temperature: Flash point (closed cup):';
      }
    }

    const r7_c1 = s9Rows[7].getElementsByTagName('w:tc')[1];
    const r7_c1_t = r7_c1.getElementsByTagName('w:t')[0];
    if (r7_c1_t && /No data available/i.test(r7_c1_t.textContent)) {
      r7_c1_t.textContent = 'No data available.  65 °C';
    }
  }

  let resultXml = new XMLSerializer().serializeToString(dom);

  // =========================================================================
  // 4. 英文版全篇微观空格与标点
  // =========================================================================
  if (isEnglish) {
    resultXml = resultXml
      .replace(/hydrogen cyanide\.In case of fire/g, 'hydrogen cyanide. In case of fire')
      .replace(/\(SCBA\)\.Do not allow/g, '(SCBA). Do not allow')
      .replace(/>\s*2,000mg\/kg/g, '> 2,000 mg/kg')
      .replace(/\(e\.\s*g\.,/g, '(e.g.,');
  }

  return resultXml;
}

async function processDirectory(dirPath) {
  console.log(`\n======================================================`);
  console.log(`📂 处理交付目录: ${dirPath}`);
  console.log(`======================================================`);

  const files = [
    { name: 'OS-8503DMM msds_CN 冠志.docx', isEnglish: false },
    { name: 'OS-8503DMM msds_CN 国彩.docx', isEnglish: false },
    { name: 'OS-8503DMM msds_EN Guanzhi.docx', isEnglish: true },
    { name: 'OS-8503DMM msds_EN Guocai.docx', isEnglish: true }
  ];

  const docxItemsForPdf = [];

  for (const f of files) {
    const docxPath = path.join(dirPath, f.name);
    if (!fs.existsSync(docxPath)) {
      console.warn(`⚠️ 文件不存在，跳过: ${docxPath}`);
      continue;
    }
    const buf = fs.readFileSync(docxPath);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('text');

    const patchedXml = patchDocxXml(xml, f.isEnglish);
    zip.file('word/document.xml', patchedXml);

    const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(docxPath, outBuf);
    console.log(`✅ 已完成 DOCX 规范覆写与内容修正: ${f.name}`);

    docxItemsForPdf.push({
      docxBuffer: outBuf,
      fileName: f.name,
      pdfPath: docxPath.replace('.docx', '.pdf')
    });
  }

  console.log(`\n🖨️ 启动标准 Windows COM (WPS/Word) 批量转译 PDF (共 ${docxItemsForPdf.length} 份)...`);
  const pdfResults = await convertBatchDocxToPdf(docxItemsForPdf.map(item => ({
    docxBuffer: item.docxBuffer,
    fileName: item.fileName
  })));

  for (let i = 0; i < pdfResults.length; i++) {
    const res = pdfResults[i];
    const targetPdfPath = docxItemsForPdf[i].pdfPath;
    fs.writeFileSync(targetPdfPath, res.pdfBuffer);
    console.log(`  ✅ [标准COM转译完成] ${path.basename(targetPdfPath)} (大小: ${res.size} bytes, 引擎: ${res.backend}, 耗时: ${res.durationMs}ms)`);
  }
}

async function main() {
  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      await processDirectory(dir);
    }
  }
  console.log('\n🎉 双目录全量交付物（4 DOCX + 4 PDF）标准重做与标准 COM 转译全部完成！');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
