import fs from 'fs';
import path from 'path';
import { recognizeSourceDocx } from '../src/recognition-engine.js';
import { buildStructuredContext2 } from '../src/context-governor.js';

function findDocx(dir, pattern) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const res = findDocx(p, pattern);
      if (res) return res;
    } else if (e.name.toLowerCase().includes(pattern.toLowerCase()) && e.name.endsWith('.docx') && !e.name.startsWith('~$')) {
      return p;
    }
  }
  return null;
}

const VALID_ROLES = new Set([
  'SECTION_HEADER', 'SEQ_LABEL', 'SUB_LABEL', 'EXPLANATION',
  'TABLE_HEADER', 'COMPONENT_ROW', 'OEL_ROW', 'REGULATION_ITEM',
  'FULL_WIDTH_STRUCTURED', 'MIGRATED_TO_S2'
]);

async function testSample(label, filePath) {
  const t0 = Date.now();
  const c1 = await recognizeSourceDocx(filePath, path.basename(filePath));
  const c2 = buildStructuredContext2(c1);
  const elapsedMs = Date.now() - t0;

  const errors = [];
  if (!c2.validation?.isValid || c2.validation.coveredSections !== 16) {
    errors.push(`章节未全覆盖 (${c2.validation?.coveredSections}/16)`);
  }

  // 检查 S1.1 CN 中文名称是否规范携带 modelCode
  const s1Items = c2.sections?.[1]?.items || [];
  const cnNameItem = s1Items.find(it => /中文名称|产品中文名称/i.test(it.cleanKey || ''));
  if (cnNameItem && cnNameItem.valueCn && c2.modelCode !== 'UNKNOWN' && !cnNameItem.valueCn.toUpperCase().includes(c2.modelCode.toUpperCase())) {
    errors.push(`S1.1 中文名称未含型号 (${cnNameItem.valueCn})`);
  }

  // 检查全部角色标注合法性
  for (let s = 1; s <= 16; s++) {
    for (const it of (c2.sections?.[s]?.items || [])) {
      if (!VALID_ROLES.has(it.role)) {
        errors.push(`S${s} R${it.rowIndex} 非法角色: ${it.role}`);
      }
    }
  }

  // 检查 S14 packingGroup 无污染
  const pg = c1.transport?.packingGroup || '';
  if (/温度|高于|低于|远离|非危险/i.test(pg)) {
    errors.push(`S14 packingGroup 污染: ${pg}`);
  }

  return {
    label,
    modelCode: c2.modelCode,
    elapsedMs,
    sections: `${c2.validation.coveredSections}/16`,
    items: c2.validation.totalItems,
    s11Paradigm: c2.sections?.[11]?.items?.find(i => i.paradigm)?.paradigm || 'PARADIGM_2',
    s1CnName: cnNameItem?.valueCn || '—',
    errors
  };
}

async function main() {
  const base = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料';
  const samples = [
    ['PA-4840', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-4 水溶性丙烯酸树脂 PA/PA-4840/PA-4840 msds_CN 冠志_源文件留存.docx'],
    ['PA-4902', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/2-1 单组份水性丙烯酸乳液 PA/PA-4902/PA-4902msds_CN 冠志___源文件留存.docx'],
    ['PU-202A', findDocx(base, 'PU-202A msds_CN')],
    ['PU-2346A', findDocx(base, 'PU-2346A msds_CN')],
    ['EP-8801', findDocx(base, 'EP-8801 msds_CN')],
    ['OS-79A', findDocx(base, 'OS-79A msds_CN')],
    ['PU-1035', findDocx(base, 'PU-1035 msds_CN')],
    ['RU-10130', findDocx(base, 'RU-10130')]
  ];

  console.log('=== 多样本 Context 1 -> Context 2 全链路实测检验 (8 样本) ===\n');
  let failures = 0;
  for (const [label, fp] of samples) {
    if (!fp || !fs.existsSync(fp)) {
      console.log(`❌ [${label}] 未找到源文件`);
      failures++;
      continue;
    }
    const res = await testSample(label, fp);
    if (res.errors.length === 0) {
      console.log(`✅ [${res.label}] (${res.elapsedMs}ms) | 章节: ${res.sections} | 标注项: ${res.items} | S11: ${res.s11Paradigm} | S1中文名: ${res.s1CnName}`);
    } else {
      console.log(`❌ [${res.label}] (${res.elapsedMs}ms) | 缺陷: ${res.errors.join('; ')}`);
      failures++;
    }
  }

  console.log(`\n总样本: ${samples.length} | 失败: ${failures}`);
  if (failures > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
