import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const templateSource = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-2186E/PU-2186E msds_CN 冠志.docx';
const targetSourceDir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-6088E';
const targetSourcePath = path.join(targetSourceDir, 'PU-6088E msds_CN 冠志.docx');

function setTcSingleText(tc, text) {
  const ps = Array.from(tc.getElementsByTagName('w:p'));
  if (ps.length === 0) return;
  const p = ps[0];
  for (let i = 1; i < ps.length; i++) tc.removeChild(ps[i]);
  const runs = Array.from(p.getElementsByTagName('w:r'));
  if (runs.length > 0) {
    const r0 = runs[0];
    let t0 = r0.getElementsByTagName('w:t')[0];
    if (!t0) {
      t0 = r0.ownerDocument.createElement('w:t');
      r0.appendChild(t0);
    }
    t0.textContent = text;
    for (let i = 1; i < runs.length; i++) p.removeChild(runs[i]);
  } else {
    const r0 = p.ownerDocument.createElement('w:r');
    const t0 = p.ownerDocument.createElement('w:t');
    t0.textContent = text;
    r0.appendChild(t0);
    p.appendChild(r0);
  }
}

function setTcMultilineText(tc, lines) {
  const ps = Array.from(tc.getElementsByTagName('w:p'));
  if (ps.length === 0) return;
  const templateP = ps[0];
  for (let i = 1; i < ps.length; i++) tc.removeChild(ps[i]);
  const runs = Array.from(templateP.getElementsByTagName('w:r'));
  for (let i = 1; i < runs.length; i++) templateP.removeChild(runs[i]);

  lines.forEach((line, idx) => {
    let p;
    if (idx === 0) {
      p = templateP;
    } else {
      p = templateP.cloneNode(true);
      tc.appendChild(p);
    }
    const r = p.getElementsByTagName('w:r')[0];
    const t = r ? r.getElementsByTagName('w:t')[0] : null;
    if (t) t.textContent = line;
  });
}

async function buildAccurateSource() {
  fs.mkdirSync(targetSourceDir, { recursive: true });
  const data = fs.readFileSync(templateSource);
  const zip = await JSZip.loadAsync(data);
  let xml = await zip.file('word/document.xml').async('string');

  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tbls = Array.from(doc.getElementsByTagName('w:tbl'));

  // Table 1: Section 1
  const t1 = tbls[0];
  for (const tr of Array.from(t1.getElementsByTagName('w:tr'))) {
    const tcs = Array.from(tr.getElementsByTagName('w:tc'));
    if (tcs.length >= 2) {
      const lbl = tcs[0].textContent.trim();
      if (/1\.1/i.test(lbl) || /产品名称/i.test(lbl)) {
        setTcSingleText(tcs[1], 'PU-6088E');
      } else if (/中文名称/i.test(lbl)) {
        setTcSingleText(tcs[1], '聚氨酯分散体');
      } else if (/化学品分类/i.test(lbl)) {
        setTcSingleText(tcs[1], '聚氨酯分散体');
      } else if (/使用建议/i.test(lbl)) {
        setTcSingleText(tcs[1], '涂料');
      }
    }
  }

  // Table 3: Section 3
  const t3 = tbls[2];
  for (const tr of Array.from(t3.getElementsByTagName('w:tr'))) {
    const tcs = Array.from(tr.getElementsByTagName('w:tc'));
    if (tcs.length === 3) {
      const c0 = tcs[0].textContent.trim();
      if (c0.includes('聚氨酯') || c0.includes('水')) {
        setTcMultilineText(tcs[0], ['聚氨酯聚合物', '水', '氢氧化钠']);
        setTcMultilineText(tcs[1], ['商业机密', '7732-18-5', '1310-73-2']);
        setTcMultilineText(tcs[2], ['35±5', '64±5', '1±0.5']);
      }
    }
  }

  // Table 9: Section 9
  const t9 = tbls[8];
  const s9Data = [
    { match: /外观/i, val: '透明至半透明液体' },
    { match: /嗅觉/i, val: '无数据' },
    { match: /pH/i, val: '7-9' },
    { match: /离子性/i, val: '阴离子' },
    { match: /初沸点/i, val: '约100℃' },
    { match: /闪点/i, val: '75℃' },
    { match: /蒸发速率/i, val: '无数据' },
    { match: /可燃性/i, val: '不适用' },
    { match: /燃烧值/i, val: '不适用' },
    { match: /相对蒸气密度/i, val: '无数据' },
    { match: /相对密度/i, val: '约1.05g/cm3' },
    { match: /水溶性/i, val: '可混溶' },
    { match: /表面张力/i, val: '无数据' },
    { match: /辛醇/i, val: '无数据' },
    { match: /自燃温度/i, val: '不适用' },
    { match: /引燃温度/i, val: '无数据' },
    { match: /动力粘度/i, val: '＜500 mPa.s' },
    { match: /固体含量/i, val: '35±2%' },
    { match: /其他信息/i, val: '上述数据非产品指标，产品指标请参见产品技术信息表。' }
  ];

  for (const tr of Array.from(t9.getElementsByTagName('w:tr'))) {
    const tcs = Array.from(tr.getElementsByTagName('w:tc'));
    if (tcs.length >= 2) {
      const lbl = tcs[0].textContent.trim();
      const cleanLbl = lbl.replace(/\s+/g, '');
      for (const item of s9Data) {
        if (item.match.test(cleanLbl)) {
          setTcSingleText(tcs[1], item.val);
          break;
        }
      }
    }
  }

  // Table 10: Section 10
  const t10 = tbls[9];
  for (const tr of Array.from(t10.getElementsByTagName('w:tr'))) {
    const tcs = Array.from(tr.getElementsByTagName('w:tc'));
    if (tcs.length >= 2) {
      const lbl = tcs[0].textContent.trim();
      if (/危险分解产物/i.test(lbl)) {
        setTcSingleText(tcs[1], '在热分解过程中生成易燃有害气体。');
      }
    }
  }

  const updatedXml = new XMLSerializer().serializeToString(doc);
  zip.file('word/document.xml', updatedXml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(targetSourcePath, outBuf);
  console.log(`Successfully built accurate PU-6088E source docx: ${targetSourcePath} (${outBuf.length} bytes)`);
}

buildAccurateSource().catch(err => {
  console.error(err);
  process.exit(1);
});
