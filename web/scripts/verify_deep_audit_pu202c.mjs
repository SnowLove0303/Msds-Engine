import path from 'node:path';
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const baseDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/PU-202C';
const files = [
  'PU-202C msds_CN 冠志.docx',
  'PU-202C msds_CN 国彩.docx',
  'PU-202C msds_EN Guanzhi.docx',
  'PU-202C msds_EN Guocai.docx'
];

console.log('=== [Measured] 人机融合深度穿透验证 PU-202C 4 份 DOCX ===');

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

  // 2. 验证 Section 11
  const s11Tbl = tbls[10];
  const s11Trs = Array.from(s11Tbl.getElementsByTagName('w:tr'));
  console.log(`[${f}] S11 行数: ${s11Trs.length} (期望 15)`);
  if (s11Trs.length !== 15) {
    console.error(f, ': S11 15行同构校验失败!');
    process.exit(1);
  }

  // 2.1 11.1 急性毒性三列垂直合并架构
  const r3Tcs = Array.from(s11Trs[3].getElementsByTagName('w:tc'));
  const r4Tcs = Array.from(s11Trs[4].getElementsByTagName('w:tc'));
  const r5Tcs = Array.from(s11Trs[5].getElementsByTagName('w:tc'));
  const vm3 = r3Tcs[0]?.getElementsByTagName('w:vMerge')[0]?.getAttribute('w:val');
  const vm4Node = r4Tcs[0]?.getElementsByTagName('w:vMerge')[0];
  const vm4 = vm4Node?.getAttribute('w:val') || (vm4Node ? 'continue' : 'none');
  const vm5Node = r5Tcs[0]?.getElementsByTagName('w:vMerge')[0];
  const vm5 = vm5Node?.getAttribute('w:val') || (vm5Node ? 'continue' : 'none');

  console.log(`[${f}] S11 11.1 三列垂直合并: r3.len=${r3Tcs.length}, r4.len=${r4Tcs.length}, r5.len=${r5Tcs.length}, vm3=${vm3}, vm4=${vm4}, vm5=${vm5}`);
  if (r3Tcs.length !== 3 || r4Tcs.length !== 3 || r5Tcs.length !== 3 || vm3 !== 'restart' || vm4 !== 'continue' || vm5 !== 'continue') {
    console.error(f, ': S11 11.1 三列垂直合并校验失败!');
    process.exit(1);
  }

  // 2.2 11.10 附加信息
  const addInfoTr = s11Trs[14];
  const addInfoText = addInfoTr?.textContent || '';
  const hasAddInfo = f.includes('_CN') ? (/饮酒精饮料/.test(addInfoText) && /重复剂量中毒/.test(addInfoText)) : (/alcoholic beverages/i.test(addInfoText) && /Repeated dose/i.test(addInfoText));
  console.log(`[${f}] S11 11.10 附加信息完整性: ${hasAddInfo}`);
  if (!hasAddInfo) {
    console.error(f, ': S11 11.10 附加信息校验失败!');
    process.exit(1);
  }
}

console.log('=== 全量 4 份 DOCX 人机深度介入与全局/局部规范 100% 满分通过 ===');
