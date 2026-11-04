import { JSDOM } from 'jsdom';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from '../src/docx-engine.js';
import fs from 'fs';
import path from 'path';

export async function auditEc1804Deliverables() {
  const dir = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/04-2 水性环氧固化剂 EC/EC-1804';
  const cnDocxPath = path.join(dir, 'EC-1804 msds_CN 冠志.docx');
  const enDocxPath = path.join(dir, 'EC-1804 msds_EN Guanzhi.docx');

  if (!fs.existsSync(cnDocxPath) || !fs.existsSync(enDocxPath)) {
    console.error("Deliverables do not exist yet!");
    return false;
  }

  const cnEngine = await loadDocx(fs.readFileSync(cnDocxPath), 'cn.docx');
  const enEngine = await loadDocx(fs.readFileSync(enDocxPath), 'en.docx');

  console.log("==========================================================");
  console.log("   EC-1804 4 项实测缺陷深度物理对账终审 (Microscope Audit)   ");
  console.log("==========================================================");

  let passed = true;

  // 1. 验证 Section 5.3 与 5.4 独立性 (缺陷 1)
  const cnS5 = cnEngine.records.find(r => r.sectionNumber === 5);
  const row53 = cnS5?.rows?.[3];
  const row54 = cnS5?.rows?.[4];
  const val53 = row53?.cells?.[1]?.text?.trim() || '';
  const val54 = row54?.cells?.[1]?.text?.trim() || '';

  console.log("\n[Check 1: Section 5 独立性与漏空核验]");
  console.log(`5.3 特殊危害值: "${val53}"`);
  console.log(`5.4 保护设备值: "${val54}"`);
  if (!val53.includes('燃烧时释放') || val53.includes('不要吸进烟尘')) {
    console.error("❌ Check 1 FAILED: 5.3 依然串行合并了 5.4 内容！");
    passed = false;
  } else if (!val54.includes('不要吸进烟尘')) {
    console.error("❌ Check 1 FAILED: 5.4 依然漏空开天窗！");
    passed = false;
  } else {
    console.log("✅ Check 1 PASS: Section 5.3 与 5.4 各自独立归位，彻底消除漏空与串行！");
  }

  // 2. 验证 Section 10 编号连续性 (缺陷 3)
  const cnS10 = cnEngine.records.find(r => r.sectionNumber === 10);
  const labels10 = cnS10?.rows?.slice(1).map(r => r.cells?.[0]?.text?.trim() || '') || [];
  console.log("\n[Check 2: Section 10 存活行连续重新编号核验]");
  console.log(`Section 10 标签序列:`, labels10);
  const expectedSeq = ['10.1', '10.2', '10.3'];
  const actualSeq = labels10.map(l => l.match(/^10\.\d+/)?.[0]);
  let seqMatched = actualSeq.length === expectedSeq.length;
  for (let i = 0; i < expectedSeq.length; i++) {
    if (actualSeq[i] !== expectedSeq[i]) seqMatched = false;
  }
  if (!seqMatched) {
    console.error("❌ Check 2 FAILED: Section 10 依然存在跳号或缺失！", actualSeq);
    passed = false;
  } else {
    console.log("✅ Check 2 PASS: Section 10 存活行完美连续编号 (10.1, 10.2, 10.3)，无任何跳号！");
  }

  // 3. 验证 Section 2 悬空标签消除 (缺陷 5)
  const cnS2 = cnEngine.records.find(r => r.sectionNumber === 2);
  const s2Texts = cnS2?.rows?.map(r => r.cells.map(c => c.text).join(' ')).join('\n') || '';
  console.log("\n[Check 3: Section 2 悬空标签消除核验]");
  console.log("Section 2 关键文本预览:\n" + s2Texts.slice(0, 500));
  if (s2Texts.includes('事故响应：\n安全储存：') || s2Texts.includes('事故响应：\n废弃处置：') || s2Texts.includes('安全储存：\n废弃处置：')) {
    console.error("❌ Check 3 FAILED: Section 2 仍包含无值的孤立悬空标签标题！");
    passed = false;
  } else if (!s2Texts.includes('象形图：无') && !s2Texts.includes('GHS象形图：无')) {
    console.error("❌ Check 3 FAILED: Section 2 象形图未规范填充'无'！");
    passed = false;
  } else {
    console.log("✅ Check 3 PASS: Section 2 无值子组已完全消除悬空断层，象形图标注规范！");
  }

  // 4. 验证 Section 8.1 手部防护制表符与空行清理 (指令 6)
  const cnS8 = cnEngine.records.find(r => r.sectionNumber === 8);
  const handCell = cnS8?.rows?.find(r => /手部防护/i.test(r.cells?.[0]?.text || ''))?.cells?.[0];
  console.log("\n[Check 4: Section 8.1 手部防护制表符与空行清理核验]");
  const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tabsInHand = handCell?.node ? Array.from(handCell.node.getElementsByTagNameNS(W_NS, 'tab')) : [];
  const indInHand = handCell?.node ? handCell.node.getElementsByTagNameNS(W_NS, 'ind')[0] : null;
  const indLeft = indInHand ? indInHand.getAttributeNS(W_NS, 'left') : '0';
  console.log(`手部防护单元格内部 <w:tab/> 数量: ${tabsInHand.length}`);
  console.log(`手部防护段落缩进 w:left: ${indLeft}`);
  if (tabsInHand.length > 0) {
    console.error("❌ Check 4 FAILED: 手部防护单元格内仍残留 <w:tab/> 制表符！");
    passed = false;
  } else if (indLeft && parseInt(indLeft, 10) > 1000) {
    console.error(`❌ Check 4 FAILED: 缩进过大 (${indLeft}) 仍会导致溢出弹飞空行！`);
    passed = false;
  } else {
    console.log("✅ Check 4 PASS: 手部防护单元格制表符彻底清零，缩进已重置为正常左对齐！");
  }

  // 5. 验证白名单不变量保护 (Section 1.1 留空与 Section 8.1/8.2 对调)
  console.log("\n[Check 5: 法定不变量白名单免检守护核验 (INV-S1-01 & INV-S8-01)]");
  const cnS1 = cnEngine.records.find(r => r.sectionNumber === 1);
  const r11Val = cnS1?.rows?.[1]?.cells?.[1]?.text?.trim() || '';
  const r12Val = cnS1?.rows?.[2]?.cells?.[1]?.text?.trim() || '';
  console.log(`1.1 产品名称值格: "${r11Val}" (法定必须留空)`);
  console.log(`1.2 中文名称值格: "${r12Val}" (法定必须为 产品名+空格+型号)`);
  if (r11Val !== '') {
    console.error("❌ Check 5 FAILED: 1.1 产品名称违背企业法定惯例，未保持留空！");
    passed = false;
  } else if (!r12Val.includes('水性环氧固化剂 EC-1804')) {
    console.error("❌ Check 5 FAILED: 1.2 中文名称未正确拼接型号！");
    passed = false;
  } else {
    console.log("✅ Check 5 PASS: Section 1.1 留空与 1.2 拼接型号严格服从法定白名单 OW-080！");
  }

  const r81Label = cnS8?.rows?.[1]?.cells?.[0]?.text?.trim() || '';
  const r82Row = cnS8?.rows?.find(r => /8\.2/i.test(r.cells?.[0]?.text || ''));
  const r82Val = r82Row?.cells?.[1]?.text?.trim() || '';
  console.log(`Section 8 顶部块: "${r81Label}" (暴露控制)`);
  console.log(`Section 8.2 工程控制值格: "${r82Val}" (根据EC指令2006/121/EG...)`);
  if (!r81Label.includes('暴露控制')) {
    console.error("❌ Check 5 FAILED: 8.1 未正确对应暴露控制！");
    passed = false;
  } else if (!r82Val.includes('2006/121')) {
    console.error("❌ Check 5 FAILED: 8.2 未正确承载接触限值说明！");
    passed = false;
  } else {
    console.log("✅ Check 5 PASS: Section 8 反直觉语义对调严格服从法定白名单 OW-131！");
  }

  console.log("\n==========================================================");
  if (passed) {
    console.log("🎉 ALL 5 COMPREHENSIVE AUDIT CHECKS PASSED WITH FLYING COLORS!");
    console.log("==========================================================");
    process.exit(0);
  } else {
    console.error("🚨 AUDIT FAILED: At least one invariant was violated!");
    console.log("==========================================================");
    process.exit(1);
  }
}

auditEc1804Deliverables().catch(err => {
  console.error("Audit runner error:", err);
  process.exit(1);
});
