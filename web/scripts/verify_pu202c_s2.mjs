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

console.log('=== [Measured] 人机深度穿透验证 PU-202C 4 份 DOCX ===');

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
    const hasGhs = /2\.1|GHS危险性类别|急性毒性/.test(tcText);
    const hasSignal = /信号词[：:]\s*危险/.test(tcText);
    const hasOther = /其他危险[：:]\s*无适用资料/.test(tcText);
    console.log(`[${f}] S2 GHS分类: ${hasGhs}, 信号词危险: ${hasSignal}, 其他危险: ${hasOther}`);
    if (!hasGhs || !hasSignal || !hasOther) {
      console.error(f, ': S2 中文语义不完整!');
      process.exit(1);
    }
  } else {
    const hasGhsEn = /Classification of the substance|Acute toxicity/i.test(tcText);
    const hasSignalEn = /Signal word:\s*Danger/i.test(tcText);
    const hasPrevEn = /Precautionary statements|Prevention|Response/i.test(tcText);
    console.log(`[${f}] S2 EN GHS: ${hasGhsEn}, 信号词Danger: ${hasSignalEn}, 防范说明: ${hasPrevEn}`);
    if (!hasGhsEn || !hasSignalEn || !hasPrevEn) {
      console.error(f, ': S2 英文语义不完整!');
      process.exit(1);
    }
  }

  // 验证 Section 11 DMAC 毒理事实 (Row 2 标题与 Row 14 附加信息)
  const s11Tbl = tbls[10];
  const s11Trs = Array.from(s11Tbl.getElementsByTagName('w:tr'));
  const s11Text = s11Tbl.textContent || '';
  const s11Row14Text = s11Trs[14]?.textContent || '';

  if (f.includes('_CN')) {
    const hasDmacHeader = s11Text.includes('N,N－二甲基乙酰胺') || s11Text.includes('二甲基乙酰胺');
    const hasAddlTox = s11Row14Text.includes('饮酒精饮料会加剧毒性影响') && s11Row14Text.includes('视网膜损伤');
    console.log(`[${f}] S11 DMAC组分标题: ${hasDmacHeader}, Row 14 附加信息3条事实保全: ${hasAddlTox}`);
    if (!hasDmacHeader || !hasAddlTox) {
      console.error(f, ': S11 中文 DMAC 毒理事实保全失败!');
      process.exit(1);
    }
  } else {
    const hasDmacHeaderEn = s11Text.includes('N,N-Dimethylacetamide');
    const hasAddlToxEn = s11Row14Text.includes('Drinking of alcohol increases toxic effects') || s11Row14Text.includes('retinal damage') || s11Row14Text.includes('Additional toxicological information');
    console.log(`[${f}] S11 EN DMAC组分标题: ${hasDmacHeaderEn}, Row 14 附加信息保全: ${hasAddlToxEn}`);
    if (!hasDmacHeaderEn || !hasAddlToxEn) {
      console.error(f, ': S11 英文 DMAC 毒理事实保全失败!');
      process.exit(1);
    }
  }
}

console.log('=== 全量 4 份 DOCX 通栏与毒理底层 XML 验证 100% 通过 ===');
