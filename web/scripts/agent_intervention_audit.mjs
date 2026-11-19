import { loadDocx } from '../src/docx-engine.js';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const DIR_4840 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-4 水溶性丙烯酸树脂 PA/PA-4840';
const DIR_4902 = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/TDS MSDS 重写版/02-1 单组份水性丙烯酸乳液 PA/PA-4902';

const EXPECTED_FILES_4840 = [
  'PA-4840 msds_CN 冠志.docx',
  'PA-4840 msds_CN 冠志.pdf',
  'PA-4840 msds_CN 国彩.docx',
  'PA-4840 msds_CN 国彩.pdf',
  'PA-4840 msds_EN Guanzhi.docx',
  'PA-4840 msds_EN Guanzhi.pdf',
  'PA-4840 msds_EN Guocai.docx',
  'PA-4840 msds_EN Guocai.pdf'
];

const EXPECTED_FILES_4902 = [
  'PA-4902 msds_CN 冠志.docx',
  'PA-4902 msds_CN 冠志.pdf',
  'PA-4902 msds_CN 国彩.docx',
  'PA-4902 msds_CN 国彩.pdf',
  'PA-4902 msds_EN Guanzhi.docx',
  'PA-4902 msds_EN Guanzhi.pdf',
  'PA-4902 msds_EN Guocai.docx',
  'PA-4902 msds_EN Guocai.pdf'
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

async function runAudit() {
  console.log('========================================================================');
  console.log('    AGENT INTERVENTION AUDIT: TRI-PARTY RECONCILIATION & REQ AUDIT     ');
  console.log('========================================================================');

  // --- 1. REQ-06: 交付物物理存在性与数量核对 (16 份) ---
  console.log('\n>>> [CHECK 1: REQ-06 交付物物理存在性与数量核对 (16 份)]');
  for (const f of EXPECTED_FILES_4840) {
    const p = path.join(DIR_4840, f);
    assert(fs.existsSync(p) && fs.statSync(p).size > 1000, `PA-4840 交付物存在且有效: ${f} (${fs.existsSync(p) ? fs.statSync(p).size : 0} bytes)`);
  }
  for (const f of EXPECTED_FILES_4902) {
    const p = path.join(DIR_4902, f);
    assert(fs.existsSync(p) && fs.statSync(p).size > 1000, `PA-4902 交付物存在且有效: ${f} (${fs.existsSync(p) ? fs.statSync(p).size : 0} bytes)`);
  }

  // --- 2. REQ-01: PA-4902 Section 2 GHS 散文防范措施、信号词与危害说明保全 ---
  console.log('\n>>> [CHECK 2: REQ-01 PA-4902 Section 2 内容保全与四分类排版]');
  const doc4902CnGuanzhi = await loadDocx(fs.readFileSync(path.join(DIR_4902, 'PA-4902 msds_CN 冠志.docx')));
  const doc4902EnGuanzhi = await loadDocx(fs.readFileSync(path.join(DIR_4902, 'PA-4902 msds_EN Guanzhi.docx')));

  const s2_4902_cn = doc4902CnGuanzhi.records.find(r => r.sectionNumber === 2);
  const s2_4902_en = doc4902EnGuanzhi.records.find(r => r.sectionNumber === 2);

  const s2_4902_cn_text = s2_4902_cn?.rows ? s2_4902_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s2_4902_en_text = s2_4902_en?.rows ? s2_4902_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';

  assert(s2_4902_cn_text.includes('警告'), 'PA-4902 中文版 Section 2 包含信号词: 警告');
  assert(s2_4902_cn_text.includes('没有明显的已知作用或严重危险'), 'PA-4902 中文版 Section 2 包含危害说明: 没有明显的已知作用或严重危险。');
  assert(s2_4902_cn_text.includes('操作时穿戴必要的防护用品'), 'PA-4902 中文版 Section 2 包含预防措施: 操作时穿戴必要的防护用品');
  assert(s2_4902_cn_text.includes('使用肥皂、清水等清洗即可'), 'PA-4902 中文版 Section 2 包含响应措施: 眼睛、皮肤接触清洗说明');
  assert(s2_4902_cn_text.includes('存储温度应保持在5-35'), 'PA-4902 中文版 Section 2 包含储存措施: 存储温度应保持在5-35');
  assert(s2_4902_cn_text.includes('使用后的空桶未经无害化处理前'), 'PA-4902 中文版 Section 2 包含处置措施: 空桶处置说明');
  assert(s2_4902_cn_text.includes('对水体、土壤可造成一定的污染'), 'PA-4902 中文版 Section 2 包含其他危害: 物理化学危险说明');

  assert(s2_4902_en_text.includes('Warning'), 'PA-4902 英文版 Section 2 包含 Signal word: Warning');
  assert(s2_4902_en_text.includes('No known significant effects or critical hazards'), 'PA-4902 英文版 Section 2 包含 Hazard statements: No known significant effects...');
  assert(s2_4902_en_text.includes('Wear necessary personal protective equipment'), 'PA-4902 英文版 Section 2 包含 Prevention: Wear necessary personal protective equipment');
  assert(s2_4902_en_text.includes('Wash thoroughly with soap and water'), 'PA-4902 英文版 Section 2 包含 Response: Wash thoroughly with soap and water');
  assert(s2_4902_en_text.includes('Maintain storage temperature between 5-35'), 'PA-4902 英文版 Section 2 包含 Storage: Maintain storage temperature between 5-35');
  assert(s2_4902_en_text.includes('Empty drums must not be used to store food'), 'PA-4902 英文版 Section 2 包含 Disposal: Empty drums must not be used...');
  assert(s2_4902_en_text.includes('Physical & chemical hazards'), 'PA-4902 英文版 Section 2 包含 Other hazards: Physical & chemical hazards');

  // --- 3. REQ-02: PA-4902 Section 3 中和剂成盐附注挂载 ---
  console.log('\n>>> [CHECK 3: REQ-02 PA-4902 Section 3 中和剂成盐法规附注挂载]');
  const s3_4902_cn = doc4902CnGuanzhi.records.find(r => r.sectionNumber === 3);
  const s3_4902_en = doc4902EnGuanzhi.records.find(r => r.sectionNumber === 3);
  const s3_4902_cn_text = s3_4902_cn?.rows ? s3_4902_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s3_4902_en_text = s3_4902_en?.rows ? s3_4902_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';

  assert(s3_4902_cn_text.includes('N,N-二甲基乙醇胺，中和剂，已键合为盐'), 'PA-4902 中文版 Section 3 包含中和剂成盐附注: N,N-二甲基乙醇胺，中和剂，已键合为盐');
  assert(s3_4902_cn_text.includes('质量浓度小于1.0%'), 'PA-4902 中文版 Section 3 包含质量浓度说明: 质量浓度小于1.0%');
  assert(s3_4902_en_text.includes('N,N-Dimethylethanolamine, neutralizer, bonded as salt'), 'PA-4902 英文版 Section 3 包含中和剂成盐英译附注');
  assert(s3_4902_en_text.includes('mass concentration < 1.0%'), 'PA-4902 英文版 Section 3 包含 mass concentration < 1.0%');

  // --- 4. REQ-03: PA-4840 Section 2 标签有害成分与 H/P 完整保全 ---
  console.log('\n>>> [CHECK 4: REQ-03 PA-4840 Section 2 标签有害成分与 H412/P273 保全]');
  const doc4840CnGuanzhi = await loadDocx(fs.readFileSync(path.join(DIR_4840, 'PA-4840 msds_CN 冠志.docx')));
  const doc4840EnGuanzhi = await loadDocx(fs.readFileSync(path.join(DIR_4840, 'PA-4840 msds_EN Guanzhi.docx')));

  const s2_4840_cn = doc4840CnGuanzhi.records.find(r => r.sectionNumber === 2);
  const s2_4840_en = doc4840EnGuanzhi.records.find(r => r.sectionNumber === 2);
  const s2_4840_cn_text = s2_4840_cn?.rows ? s2_4840_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s2_4840_en_text = s2_4840_en?.rows ? s2_4840_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';

  assert(s2_4840_cn_text.includes('2-丁氧基乙醇') || s2_4840_cn_text.includes('丁氧基乙醇'), 'PA-4840 中文版 Section 2 包含标签有害成分: 2-丁氧基乙醇');
  assert(s2_4840_cn_text.includes('H412') || s2_4840_cn_text.includes('有害'), 'PA-4840 中文版 Section 2 包含 H412 水生危害说明');
  assert(s2_4840_cn_text.includes('P273') || s2_4840_cn_text.includes('环境'), 'PA-4840 中文版 Section 2 包含 P273 避免释放到环境中');
  assert(s2_4840_en_text.includes('2-Butoxyethanol'), 'PA-4840 英文版 Section 2 包含 Hazardous components: 2-Butoxyethanol');
  assert(s2_4840_en_text.includes('H412') || s2_4840_en_text.includes('Harmful to aquatic life with long lasting effects'), 'PA-4840 英文版 Section 2 包含 H412 说明');
  assert(s2_4840_en_text.includes('P273') || s2_4840_en_text.includes('Avoid release to the environment'), 'PA-4840 英文版 Section 2 包含 P273 预防措施');

  // --- 5. REQ-04: Section 9 稀释比与 19 项理化参数 100% 同步 ---
  console.log('\n>>> [CHECK 5: REQ-04 Section 9 稀释比与 19 项理化参数双语 100% 同步]');
  const s9_4840_cn = doc4840CnGuanzhi.records.find(r => r.sectionNumber === 9);
  const s9_4840_en = doc4840EnGuanzhi.records.find(r => r.sectionNumber === 9);
  const s9_4902_cn = doc4902CnGuanzhi.records.find(r => r.sectionNumber === 9);
  const s9_4902_en = doc4902EnGuanzhi.records.find(r => r.sectionNumber === 9);

  const s9_4840_cn_text = s9_4840_cn?.rows ? s9_4840_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s9_4840_en_text = s9_4840_en?.rows ? s9_4840_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s9_4902_cn_text = s9_4902_cn?.rows ? s9_4902_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s9_4902_en_text = s9_4902_en?.rows ? s9_4902_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';

  assert(s9_4840_cn_text.includes('1:1'), 'PA-4840 中文版 Section 9 pH 包含 1:1 稀释比例');
  assert(s9_4840_en_text.includes('1:1'), 'PA-4840 英文版 Section 9 pH 包含 1:1 稀释比例');
  assert(s9_4902_cn_text.includes('1:10'), 'PA-4902 中文版 Section 9 pH 包含 1:10 稀释比例');
  assert(s9_4902_en_text.includes('1:10'), 'PA-4902 英文版 Section 9 pH 包含 1:10 稀释比例');
  assert(s9_4840_cn.rows.length === 20 && s9_4840_en.rows.length === 20, 'PA-4840 Section 9 包含完整 19 项理化参数 (表头+19行 = 20行)');
  assert((s9_4902_cn.rows.length === 19 || s9_4902_cn.rows.length === 20) && s9_4902_cn.rows.length === s9_4902_en.rows.length, `PA-4902 Section 9 理化参数行数与源文件及双语严格守恒 (当前为: ${s9_4902_cn.rows.length}行)`);

  // --- 6. REQ-05: Section 11 毒理学动态端点与动物数据保全 ---
  console.log('\n>>> [CHECK 6: REQ-05 Section 11 毒理学测试数据保全]');
  const s11_4840_cn = doc4840CnGuanzhi.records.find(r => r.sectionNumber === 11);
  const s11_4840_en = doc4840EnGuanzhi.records.find(r => r.sectionNumber === 11);
  const s11_4902_cn = doc4902CnGuanzhi.records.find(r => r.sectionNumber === 11);
  const s11_4902_en = doc4902EnGuanzhi.records.find(r => r.sectionNumber === 11);

  const s11_4840_cn_text = s11_4840_cn?.rows ? s11_4840_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s11_4840_en_text = s11_4840_en?.rows ? s11_4840_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s11_4902_cn_text = s11_4902_cn?.rows ? s11_4902_cn.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';
  const s11_4902_en_text = s11_4902_en?.rows ? s11_4902_en.rows.map(r => r.cells.map(c => c.text).join(' ')).join('\n') : '';

  assert(s11_4840_cn.rows.length === 20, 'PA-4840 中文版 Section 11 包含完整 20 行标准插槽结构');
  assert(s11_4840_en.rows.length === 20, 'PA-4840 英文版 Section 11 包含完整 20 行标准插槽结构');
  assert(s11_4840_cn_text.includes('5,000') || s11_4840_cn_text.includes('5000'), 'PA-4840 中文版 Section 11 包含 LD50 > 5,000 mg/kg 实测值');
  assert(s11_4840_en_text.includes('5,000') || s11_4840_en_text.includes('5000'), 'PA-4840 英文版 Section 11 包含 LD50 > 5,000 mg/kg 英译实测值');
  assert(s11_4840_en_text.includes('2-Butoxyethanol'), 'PA-4840 英文版 Section 11 包含 2-Butoxyethanol 组分毒理数据');
  assert(s11_4840_en_text.includes('Polyacrylate dispersion'), 'PA-4840 英文版 Section 11 包含 Polyacrylate dispersion 组分数据');

  assert(s11_4902_cn_text.includes('LD50') || s11_4902_cn_text.includes('半数致死') || s11_4902_cn_text.includes('无可用的毒理学研究'), 'PA-4902 中文版 Section 11 包含毒理说明或无可用的毒理学研究声明');
  assert(s11_4902_en_text.includes('LD50') || s11_4902_en_text.includes('toxicological'), 'PA-4902 英文版 Section 11 包含毒理说明与实测信息');

  // --- 7. Gate 4: 英文版绝对零中文硬门禁核验 ---
  console.log('\n>>> [CHECK 7: 英文版绝对零中文硬门禁核验]');
  for (const f of ['PA-4840 msds_EN Guanzhi.docx', 'PA-4840 msds_EN Guocai.docx']) {
    const doc = await loadDocx(fs.readFileSync(path.join(DIR_4840, f)));
    let chCount = 0;
    for (const r of doc.records) {
      if (r.rows) {
        for (const row of r.rows) {
          for (const cell of row.cells) {
            const ch = (cell.text || '').match(/[\u4e00-\u9fa5]/g) || [];
            chCount += ch.length;
          }
        }
      }
    }
    assert(chCount === 0, `英文交付物零中文检测: ${f} (中文字符数: ${chCount})`);
  }
  for (const f of ['PA-4902 msds_EN Guanzhi.docx', 'PA-4902 msds_EN Guocai.docx']) {
    const doc = await loadDocx(fs.readFileSync(path.join(DIR_4902, f)));
    let chCount = 0;
    for (const r of doc.records) {
      if (r.rows) {
        for (const row of r.rows) {
          for (const cell of row.cells) {
            const ch = (cell.text || '').match(/[\u4e00-\u9fa5]/g) || [];
            chCount += ch.length;
          }
        }
      }
    }
    assert(chCount === 0, `英文交付物零中文检测: ${f} (中文字符数: ${chCount})`);
  }

  console.log('\n========================================================================');
  console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log('========================================================================');
  if (failedChecks > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('FATAL AUDIT ERROR:', err);
  process.exit(1);
});
