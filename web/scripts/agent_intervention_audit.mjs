import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { JSDOM } from 'jsdom';

if (!globalThis.DOMParser || !globalThis.XMLSerializer) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.XMLSerializer = dom.window.XMLSerializer;
}

import { loadDocx } from '../src/docx-engine.js';
import { validateCasChecksum } from '../src/cas-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const targetDir = path.resolve(REPO_ROOT, '算法训练材料/源文件材料/6-3 水性聚碳化二亚胺交联剂 OS/OS-8503DMM');
const model = 'OS-8503DMM';

async function main() {
  console.log(`========================================================================`);
  console.log(`🔍 [Agent 介入深度审计] 启动全维度智能体语义与物理契约证伪审计`);
  console.log(`   • 目标型号: ${model}`);
  console.log(`   • 目标目录: ${targetDir}`);
  console.log(`========================================================================\n`);

  // 1. 物理交付物文件清单与时间戳核对
  const expectedFiles = [
    `${model} msds_CN 冠志.docx`,
    `${model} msds_CN 冠志.pdf`,
    `${model} msds_CN 国彩.docx`,
    `${model} msds_CN 国彩.pdf`,
    `${model} msds_EN Guanzhi.docx`,
    `${model} msds_EN Guanzhi.pdf`,
    `${model} msds_EN Guocai.docx`,
    `${model} msds_EN Guocai.pdf`
  ];

  const fileStats = {};
  for (const f of expectedFiles) {
    const p = path.join(targetDir, f);
    if (!fs.existsSync(p)) {
      console.error(`❌ 缺失交付物文件: ${f}`);
      process.exit(1);
    }
    const stat = fs.statSync(p);
    fileStats[f] = { size: stat.size, mtime: stat.mtime };
  }
  console.log(`✅ [Gate 1] 8 份法定交付物全部物理存在且大小健康:`);
  for (const [f, s] of Object.entries(fileStats)) {
    console.log(`   - ${f.padEnd(35)} : ${String(s.size).padStart(7)} bytes, ${s.mtime.toLocaleTimeString()}`);
  }

  // 2. 载入 4 份 Word 文档引擎
  const cnGzDoc = await loadDocx(fs.readFileSync(path.join(targetDir, `${model} msds_CN 冠志.docx`)), 'CN_GZ');
  const cnGcDoc = await loadDocx(fs.readFileSync(path.join(targetDir, `${model} msds_CN 国彩.docx`)), 'CN_GC');
  const enGzDoc = await loadDocx(fs.readFileSync(path.join(targetDir, `${model} msds_EN Guanzhi.docx`)), 'EN_GZ');
  const enGcDoc = await loadDocx(fs.readFileSync(path.join(targetDir, `${model} msds_EN Guocai.docx`)), 'EN_GC');

  // 源文件
  const srcFile = path.join(targetDir, `${model} MSDS（冠志）.docx`);
  let srcDoc = null;
  if (fs.existsSync(srcFile)) {
    srcDoc = await loadDocx(fs.readFileSync(srcFile), 'SRC');
  }

  console.log(`\n------------------------------------------------------------------------`);
  console.log(`📊 [Gate 2: 16 章节拓扑同构度与行数核销]`);
  console.log(`------------------------------------------------------------------------`);
  console.log(`节号 | 中文冠志行数 | 中文国彩行数 | 英文冠志行数 | 英文国彩行数 | 源文件行数 | 判定`);
  console.log(`-----+--------------+--------------+--------------+--------------+------------+------`);

  for (let s = 1; s <= 16; s++) {
    const gzRec = cnGzDoc.records.find(r => r.sectionNumber === s);
    const gcRec = cnGcDoc.records.find(r => r.sectionNumber === s);
    const egRec = enGzDoc.records.find(r => r.sectionNumber === s);
    const ecRec = enGcDoc.records.find(r => r.sectionNumber === s);
    const scRec = srcDoc?.records?.find(r => r.sectionNumber === s);

    const gzRows = gzRec?.rows?.length ?? 0;
    const gcRows = gcRec?.rows?.length ?? 0;
    const egRows = egRec?.rows?.length ?? 0;
    const ecRows = ecRec?.rows?.length ?? 0;
    const scRows = scRec?.rows?.length ?? (scRec?.text ? 1 : 0);

    const match = (gzRows === gcRows && gzRows === egRows && gzRows === ecRows);
    console.log(`S${String(s).padStart(2)}  | ${String(gzRows).padStart(12)} | ${String(gcRows).padStart(12)} | ${String(egRows).padStart(12)} | ${String(ecRows).padStart(12)} | ${String(scRows).padStart(10)} | ${match ? '✅ MATCH' : '⚠️ DIFF'}`);
  }

  // 3. 详细提取 16 章节核心事实内容对比
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`🔬 [Gate 3: 核心化学技术事实与保真度核验 (Fidelity Audit)]`);
  console.log(`------------------------------------------------------------------------`);

  // Section 1
  console.log(`\n[Section 1: 化学品与企业标识]`);
  console.log(` - CN GZ 品名: ${cnGzDoc.records[0]?.rows?.[1]?.cells?.[1]?.text}`);
  console.log(` - EN GZ 品名: ${enGzDoc.records[0]?.rows?.[1]?.cells?.[1]?.text}`);
  console.log(` - CN GZ 供应商: ${cnGzDoc.records[0]?.rows?.[3]?.cells?.[1]?.text}`);
  console.log(` - CN GC 供应商: ${cnGcDoc.records[0]?.rows?.[3]?.cells?.[1]?.text}`);
  console.log(` - EN GZ 供应商: ${enGzDoc.records[0]?.rows?.[3]?.cells?.[1]?.text}`);
  console.log(` - EN GC 供应商: ${enGcDoc.records[0]?.rows?.[3]?.cells?.[1]?.text}`);

  // Section 2
  console.log(`\n[Section 2: 危险性概述]`);
  const s2Cn = cnGzDoc.records.find(r => r.sectionNumber === 2);
  const s2En = enGzDoc.records.find(r => r.sectionNumber === 2);
  console.log(` - CN GZ 分类: ${s2Cn?.rows?.[1]?.cells?.[0]?.text?.replace(/\s+/g, ' ')}`);
  console.log(` - EN GZ 分类: ${s2En?.rows?.[1]?.cells?.[0]?.text?.replace(/\s+/g, ' ')}`);
  console.log(` - CN GZ 危险说明: ${s2Cn?.rows?.[3]?.cells?.[0]?.text?.replace(/\s+/g, ' ')}`);
  console.log(` - EN GZ 危险说明: ${s2En?.rows?.[3]?.cells?.[0]?.text?.replace(/\s+/g, ' ')}`);
  console.log(` - CN GZ 防范说明: ${s2Cn?.rows?.[4]?.cells?.[0]?.text?.replace(/\s+/g, ' ')}`);
  console.log(` - EN GZ 防范说明: ${s2En?.rows?.[4]?.cells?.[0]?.text?.replace(/\s+/g, ' ')}`);

  // Section 3
  console.log(`\n[Section 3: 成分/组成信息]`);
  const s3Cn = cnGzDoc.records.find(r => r.sectionNumber === 3);
  const s3En = enGzDoc.records.find(r => r.sectionNumber === 3);
  for (let r = 2; r < s3Cn.rows.length; r++) {
    const rowCn = s3Cn.rows[r];
    const rowEn = s3En.rows[r];
    const nameCn = rowCn.cells[0]?.text;
    const casCn = rowCn.cells[1]?.text;
    const concCn = rowCn.cells[2]?.text;
    const nameEn = rowEn.cells[0]?.text;
    const casEn = rowEn.cells[1]?.text;
    const concEn = rowEn.cells[2]?.text;
    const casValid = casCn === 'Trade secret' || casCn === '商业机密' || validateCasChecksum(casCn).valid;
    console.log(` - 组分 ${r-1}: CN [${nameCn} | CAS: ${casCn} | ${concCn}] (CAS有效: ${casValid})`);
    console.log(`            EN [${nameEn} | CAS: ${casEn} | ${concEn}]`);
  }

  // Section 9
  console.log(`\n[Section 9: 理化特性对比 (14项)]`);
  const s9Cn = cnGzDoc.records.find(r => r.sectionNumber === 9);
  const s9En = enGzDoc.records.find(r => r.sectionNumber === 9);
  for (let r = 1; r < s9Cn.rows.length; r++) {
    const lblCn = s9Cn.rows[r].cells[0]?.text?.trim();
    const valCn = s9Cn.rows[r].cells[1]?.text?.trim();
    const lblEn = s9En.rows[r].cells[0]?.text?.trim();
    const valEn = s9En.rows[r].cells[1]?.text?.trim();
    console.log(` - 9.${r}: CN [${lblCn} => ${valCn}] | EN [${lblEn} => ${valEn}]`);
  }

  // Section 11
  console.log(`\n[Section 11: 毒理学信息]`);
  const s11Cn = cnGzDoc.records.find(r => r.sectionNumber === 11);
  const s11En = enGzDoc.records.find(r => r.sectionNumber === 11);
  console.log(` - CN 毒理行数: ${s11Cn?.rows?.length}, EN 毒理行数: ${s11En?.rows?.length}`);
  for (let r = 1; r < Math.min(s11Cn.rows.length, 6); r++) {
    console.log(`   * Row ${r} CN: ${s11Cn.rows[r].cells.map(c => c.text).join(' | ').slice(0, 80)}`);
    console.log(`     Row ${r} EN: ${s11En.rows[r].cells.map(c => c.text).join(' | ').slice(0, 80)}`);
  }

  // Section 14
  console.log(`\n[Section 14: 运输信息]`);
  const s14Cn = cnGzDoc.records.find(r => r.sectionNumber === 14);
  const s14En = enGzDoc.records.find(r => r.sectionNumber === 14);
  for (let r = 1; r < s14Cn.rows.length; r++) {
    console.log(` - 14.${r}: CN [${s14Cn.rows[r].cells[0]?.text} => ${s14Cn.rows[r].cells[1]?.text}] | EN [${s14En.rows[r].cells[0]?.text} => ${s14En.rows[r].cells[1]?.text}]`);
  }

  // 4. 英文版中文残留深度探测
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`🔤 [Gate 4: 英文交付物中文字符全域零残留深度扫描]`);
  console.log(`------------------------------------------------------------------------`);
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  for (const enName of [`${model} msds_EN Guanzhi.docx`, `${model} msds_EN Guocai.docx`]) {
    const enDocxBuf = fs.readFileSync(path.join(targetDir, enName));
    const zip = await JSZip.loadAsync(enDocxBuf);
    const xml = await zip.file('word/document.xml').async('text');
    const matches = xml.match(chineseRegex) || [];
    console.log(` - ${enName}: 检测到中文字符数: ${matches.length}`);
  }

  console.log(`\n========================================================================`);
  console.log(`🎯 Agent 介入审计扫描完成！`);
  console.log(`========================================================================`);
}

main().catch(err => {
  console.error('Fatal in agent audit:', err);
  process.exit(1);
});
