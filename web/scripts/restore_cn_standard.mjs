import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const targetDirs = [
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/6-3 水性聚碳化二亚胺交联剂 OS/OS-8503DMM',
  'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/06-3 水性聚碳化二亚胺交联剂 OS/OS-8503 DMM'
];

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function restoreChineseDocx(xml) {
  const dom = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = dom.getElementsByTagName('w:tbl');

  // 1. 恢复 Section 1 中文版原始标准格式:
  // Row 1 (1.1 产品名称：) -> 碳化二亚胺交联剂 OS-8503DMM
  // Row 2 (中文名称：) -> "" (留空)
  const s1Tbl = tbls[0];
  const s1Rows = s1Tbl.getElementsByTagName('w:tr');

  // Row 1 tc[1] 恢复为 "碳化二亚胺交联剂 OS-8503DMM"
  const r1_c1 = s1Rows[1].getElementsByTagName('w:tc')[1];
  const r1_c1_p = r1_c1.getElementsByTagName('w:p')[0];
  const r1_runs = Array.from(r1_c1_p.getElementsByTagName('w:r'));
  r1_runs.forEach(r => r1_c1_p.removeChild(r));

  const r1Run = dom.createElementNS(W_NS, 'w:r');
  const r1RPr = dom.createElementNS(W_NS, 'w:rPr');
  const r1Fonts = dom.createElementNS(W_NS, 'w:rFonts');
  r1Fonts.setAttribute('w:ascii', 'Times New Roman');
  r1Fonts.setAttribute('w:hAnsi', 'Times New Roman');
  r1Fonts.setAttribute('w:eastAsia', '宋体');
  r1Fonts.setAttribute('w:cs', 'Times New Roman');
  r1RPr.appendChild(r1Fonts);
  const sz24 = dom.createElementNS(W_NS, 'w:sz');
  sz24.setAttribute('w:val', '24');
  r1RPr.appendChild(sz24);
  const szCs24 = dom.createElementNS(W_NS, 'w:szCs');
  szCs24.setAttribute('w:val', '24');
  r1RPr.appendChild(szCs24);
  r1Run.appendChild(r1RPr);
  const t1 = dom.createElementNS(W_NS, 'w:t');
  t1.textContent = '碳化二亚胺交联剂 OS-8503DMM';
  r1Run.appendChild(t1);
  r1_c1_p.appendChild(r1Run);

  // Row 2 tc[1] 恢复为空
  const r2_c1 = s1Rows[2].getElementsByTagName('w:tc')[1];
  const r2_c1_p = r2_c1.getElementsByTagName('w:p')[0];
  const r2_runs = Array.from(r2_c1_p.getElementsByTagName('w:r'));
  r2_runs.forEach(r => r2_c1_p.removeChild(r));

  // 2. 恢复 Section 8: 移除添加的 Row 14，恢复为原始 14 行 (Row 0 ~ Row 13)
  const s8Tbl = tbls[7];
  const s8Rows = s8Tbl.getElementsByTagName('w:tr');
  if (s8Rows.length > 14) {
    for (let r = s8Rows.length - 1; r >= 14; r--) {
      s8Tbl.removeChild(s8Rows[r]);
    }
  }
  // 确保 Row 13 底部边框为 single
  const r13Tcs = s8Rows[13].getElementsByTagName('w:tc');
  for (let i = 0; i < r13Tcs.length; i++) {
    const btm = r13Tcs[i].getElementsByTagName('w:bottom')[0];
    if (btm) btm.setAttribute('w:val', 'single');
  }

  return new XMLSerializer().serializeToString(dom);
}

function restoreEnglishDocxSection8(xml) {
  const dom = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = dom.getElementsByTagName('w:tbl');
  const s8Tbl = tbls[7];
  const s8Rows = s8Tbl.getElementsByTagName('w:tr');
  if (s8Rows.length > 14) {
    for (let r = s8Rows.length - 1; r >= 14; r--) {
      s8Tbl.removeChild(s8Rows[r]);
    }
  }
  const r13Tcs = s8Rows[13].getElementsByTagName('w:tc');
  for (let i = 0; i < r13Tcs.length; i++) {
    const btm = r13Tcs[i].getElementsByTagName('w:bottom')[0];
    if (btm) btm.setAttribute('w:val', 'single');
  }
  return new XMLSerializer().serializeToString(dom);
}

async function main() {
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) continue;
    console.log(`\n======================================================`);
    console.log(`🔄 恢复中文版原始标准格式: ${dir}`);
    console.log(`======================================================`);

    const cnFiles = [
      'OS-8503DMM msds_CN 冠志.docx',
      'OS-8503DMM msds_CN 国彩.docx'
    ];

    for (const f of cnFiles) {
      const p = path.join(dir, f);
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      const zip = await JSZip.loadAsync(buf);
      const xml = await zip.file('word/document.xml').async('text');
      const restoredXml = restoreChineseDocx(xml);
      zip.file('word/document.xml', restoredXml);
      const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(p, outBuf);
      console.log(`✅ 已 100% 恢复中文原版标准格式: ${f}`);

      const sofficeCmd = `"C:\\Program Files\\LibreOffice\\program\\soffice.com" --headless --convert-to pdf "${p}" --outdir "${dir}"`;
      execSync(sofficeCmd, { stdio: 'pipe' });
      console.log(`✅ 已重新转译中文 PDF: ${f.replace('.docx', '.pdf')}`);
    }

    // 同样保证英文版 Section 8 与中文版 14 行严格同构
    const enFiles = [
      'OS-8503DMM msds_EN Guanzhi.docx',
      'OS-8503DMM msds_EN Guocai.docx'
    ];
    for (const f of enFiles) {
      const p = path.join(dir, f);
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      const zip = await JSZip.loadAsync(buf);
      const xml = await zip.file('word/document.xml').async('text');
      const restoredXml = restoreEnglishDocxSection8(xml);
      zip.file('word/document.xml', restoredXml);
      const outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(p, outBuf);
      console.log(`✅ 英文版 Section 8 恢复 14 行与中文版 1:1 同构: ${f}`);

      const sofficeCmd = `"C:\\Program Files\\LibreOffice\\program\\soffice.com" --headless --convert-to pdf "${p}" --outdir "${dir}"`;
      execSync(sofficeCmd, { stdio: 'pipe' });
      console.log(`✅ 已重新转译英文 PDF: ${f.replace('.docx', '.pdf')}`);
    }
  }
}

main().catch(err => {
  console.error('Error restoring CN:', err);
  process.exit(1);
});
