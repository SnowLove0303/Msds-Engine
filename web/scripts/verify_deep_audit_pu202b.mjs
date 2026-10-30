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

console.log('=== [Measured] 人机融合深度穿透验证 PU-202B 4 份 DOCX ===');

for (const f of files) {
  const filePath = path.join(baseDir, f);
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const xmlStr = await zip.file('word/document.xml').async('text');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const tbls = doc.getElementsByTagName('w:tbl');

  // 1. 验证 Section 2
  const s2Tbl = tbls[1];
  const s2Row1 = s2Tbl.getElementsByTagName('w:tr')[1];
  const s2Ps = Array.from(s2Row1.getElementsByTagName('w:p'));

  // 1.1 象形图居左 (jc="left")
  const drawingPs = s2Ps.filter(p => p.getElementsByTagName('w:drawing').length > 0);
  const drawingJc = drawingPs[0]?.getElementsByTagName('w:jc')[0]?.getAttribute('w:val');
  console.log(`[${f}] S2 象形图段落数: ${drawingPs.length}, 对齐 jc: ${drawingJc} (期望 left)`);
  if (drawingJc !== 'left') {
    console.error(f, ': S2 象形图居左校验失败!');
    process.exit(1);
  }

  // 1.2 2.3 序号
  const s2Text = s2Row1.textContent || '';
  const has23 = f.includes('_CN') ? /2\.3\s*(?:其他危险|其他危害)/.test(s2Text) : /2\.3\s*Other\s*hazards/i.test(s2Text);
  console.log(`[${f}] S2 2.3 序号存在: ${has23}`);
  if (!has23) {
    console.error(f, ': S2 2.3 序号校验失败!');
    process.exit(1);
  }

  // 1.3 模块间空行 (before="240")
  const before240Count = s2Ps.filter(p => p.getElementsByTagName('w:spacing')[0]?.getAttribute('w:before') === '240').length;
  console.log(`[${f}] S2 模块间空行数: ${before240Count} (期望 >= 3)`);
  if (before240Count < 3) {
    console.error(f, ': S2 模块间空行校验失败!');
    process.exit(1);
  }

  // 2. 验证 Section 11 Row 11 & 12 三列垂直合并结构
  const s11Tbl = tbls[10];
  const s11Trs = Array.from(s11Tbl.getElementsByTagName('w:tr'));
  const repRow = s11Trs[11];
  const teratoRow = s11Trs[12];
  const repTcs = Array.from(repRow.getElementsByTagName('w:tc'));
  const teratoTcs = Array.from(teratoRow.getElementsByTagName('w:tc'));

  const repVm = repTcs[0]?.getElementsByTagName('w:vMerge')[0]?.getAttribute('w:val');
  const teratoVmNode = teratoTcs[0]?.getElementsByTagName('w:vMerge')[0];
  const teratoVm = teratoVmNode?.getAttribute('w:val') || (teratoVmNode ? 'continue' : 'none');

  console.log(`[${f}] S11 Row 11 列数: ${repTcs.length} (期望 3), Row 12 列数: ${teratoTcs.length} (期望 3)`);
  console.log(`[${f}] S11 vMerge 首行: ${repVm} (期望 restart), 次行: ${teratoVm} (期望 continue)`);

  const sub1Label = (repTcs[1]?.textContent || '').trim();
  const sub2Label = (teratoTcs[1]?.textContent || '').trim();
  const sub1Span = repTcs[1]?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');
  const sub2Span = teratoTcs[1]?.getElementsByTagName('w:gridSpan')[0]?.getAttribute('w:val');

  console.log(`[${f}] S11 子标签: "${sub1Label}" & "${sub2Label}", 子标签跨列: ${sub1Span} & ${sub2Span}`);

  const isCn = f.includes('_CN');
  const expectedSub1 = isCn ? '生育力：' : 'Fertility:';
  const expectedSub2 = isCn ? '致畸性：' : 'Teratogenicity:';

  if (repTcs.length !== 3 || teratoTcs.length !== 3 || repVm !== 'restart' || teratoVm !== 'continue' || sub1Span !== '2' || sub2Span !== '2') {
    console.error(f, ': S11 11.7 三列垂直合并结构网格与跨列校验失败!');
    process.exit(1);
  }

  if (sub1Label !== expectedSub1 || sub2Label !== expectedSub2) {
    console.error(`${f}: S11 子标签文字不匹配! 期望 "${expectedSub1}" & "${expectedSub2}", 实测 "${sub1Label}" & "${sub2Label}"`);
    process.exit(1);
  }
}

console.log('=== 全量 4 份 DOCX 人机深度介入 4 项质量指标 100% 满分通过 ===');
