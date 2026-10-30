import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202B';
const files = [
  'PU-202B msds_CN 冠志.docx',
  'PU-202B msds_CN 国彩.docx',
  'PU-202B msds_EN Guanzhi.docx',
  'PU-202B msds_EN Guocai.docx'
];

console.log('=== [Measured] 人机深度穿透验证 PU-202B 4 份 DOCX ===');

for (const f of files) {
  const filePath = path.join(baseDir, f);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const xmlStr = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');

  const tbls = doc.getElementsByTagName('w:tbl');
  const s2Tbl = tbls[1];
  if (!s2Tbl) {
    console.error(f, ': 未能获取 tbls[1] (Section 2 表格)!');
    process.exit(1);
  }

  const trs = Array.from(s2Tbl.getElementsByTagName('w:tr'));
  const rowCount = trs.length;
  const row1 = trs[1];
  const tcs = Array.from(row1.getElementsByTagName('w:tc'));
  const tcCount = tcs.length;
  const gridSpan = tcs[0]?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
  const tcText = row1.textContent || '';

  console.log(`[${f}] S2 行数: ${rowCount} (期望 2), Row1 单元格数: ${tcCount} (期望 1), gridSpan: ${gridSpan} (期望 2)`);

  if (rowCount !== 2 || tcCount !== 1 || gridSpan !== '2') {
    console.error(f, ': S2 G-40 拓扑校验失败!');
    process.exit(1);
  }

  // 验证 S2 语义
  if (f.includes('_CN')) {
    const hasGhs = /2\.1|GHS危险性类别|生殖毒性/.test(tcText);
    const hasSignal = /信号词[：:]\s*危险/.test(tcText);
    const hasOther = /其他危险[：:].*N[－-]甲基吡咯烷酮/.test(tcText);
    console.log(`[${f}] S2 GHS分类: ${hasGhs}, 信号词危险: ${hasSignal}, 其他危险: ${hasOther}`);
    if (!hasGhs || !hasSignal || !hasOther) {
      console.error(f, ': S2 中文语义不完整!');
      process.exit(1);
    }
  } else {
    const hasGhsEn = /Reproductive toxicity/i.test(tcText);
    const hasSignalEn = /Signal word:\s*Danger/i.test(tcText);
    const hasOtherEn = /cutaneous absorption.*N-Methyl-2-pyrrolidone|Other Hazards/i.test(tcText);
    console.log(`[${f}] S2 EN GHS: ${hasGhsEn}, 信号词Danger: ${hasSignalEn}, 其他危险: ${hasOtherEn}`);
    if (!hasGhsEn || !hasSignalEn || !hasOtherEn) {
      console.error(f, ': S2 英文语义不完整!');
      process.exit(1);
    }
  }

  // 验证 Section 11 行数 (16 行) 与生育力/致畸性
  const s11Tbl = tbls[10];
  const s11Trs = Array.from(s11Tbl.getElementsByTagName('w:tr'));
  const s11Text = s11Tbl.textContent || '';
  const s11RowCount = s11Trs.length;

  if (f.includes('_CN')) {
    const hasFertility = s11Text.includes('生育') || s11Text.includes('生殖毒性');
    const hasTerato = s11Text.includes('致畸');
    console.log(`[${f}] S11 行数: ${s11RowCount} (期望 16), 生育力: ${hasFertility}, 致畸: ${hasTerato}`);
    if (s11RowCount !== 16 || !hasFertility || !hasTerato) {
      console.error(f, ': S11 中文行数或端点保全失败!');
      process.exit(1);
    }
  } else {
    const hasFertilityEn = /Fertility|Reproductive/i.test(s11Text);
    const hasTeratoEn = /Teratogenicity/i.test(s11Text);
    console.log(`[${f}] S11 EN 行数: ${s11RowCount} (期望 16), Fertility: ${hasFertilityEn}, Teratogenicity: ${hasTeratoEn}`);
    if (s11RowCount !== 16 || !hasFertilityEn || !hasTeratoEn) {
      console.error(f, ': S11 英文行数或端点保全失败!');
      process.exit(1);
    }
  }
}

console.log('=== 全量 4 份 DOCX 通栏与 Section 11 底层 XML 验证 100% 通过 ===');
