import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadDocx } from '../src/docx-engine.js';
import {
  SECTION_SLOT_REGISTRY,
  stripNumberingPrefix,
  normalizeLabelKey,
  isPureMissingValue,
  isSubstantiveNegativeFinding,
  canonicalSlotKey,
  decoupleSection9Condition,
  groupPrecautionaryStatements,
  detectSlotConflicts,
  safeColonSplit,
  decomposeRunsToFact,
  isLabelLengthAcceptable,
  resolveSlotBySemantics,
  sanitizeTypographyAndSymbols,
} from '../src/smart-matching.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

// 1. Expand SECTION_SLOT_REGISTRY with MFFT, Tg, Hydroxyl value in Sec 9, and GBs in Sec 15
SECTION_SLOT_REGISTRY[9].slots.find(s => s.key === 'other_physical').aliases.push(
  '最低成膜温度', '最低成膜温度mfft', '最低成膜温度 (mfft)', 'mfft',
  '玻璃化温度', '玻璃化温度tg', '玻璃化转变温度', 'tg', '羟值', '羟基值', 'hydroxyl value',
  '9.18最低成膜温度mfft/', '9.19 玻璃化温度tg/℃', '9.18最低成膜温度', '9.19玻璃化温度'
);

SECTION_SLOT_REGISTRY[8].slots.find(s => s.key === 'control_parameters').aliases.push(
  '8.1控制参数', '根据ec指令', '接触限值信息', '无可用的接触限值信息', '根据ec指令2006/121/eg,无可用的接触限值信息'
);

SECTION_SLOT_REGISTRY[11].slots.find(s => s.key === 'sensitization').aliases.push(
  '物种: 人类', '物种：人类', '分类: 不是皮肤过敏物质', '结果: 对志愿者做的皮肤接触试验证明没有过敏特性', '皮肤接触试验'
);

SECTION_SLOT_REGISTRY[11].slots.find(s => s.key === 'stot_repeated').aliases.push(
  '重复剂量中毒', '重复剂量中毒：经口', '重复剂量中毒：吸入', '病理变化'
);

SECTION_SLOT_REGISTRY[15].slots.find(s => s.key === 'gb_30000').aliases.push(
  'GB 20576', 'GB 20598', 'GB 20576- GB20598', 'GB20576', 'GB20598', 'GB 20576- GB20598 化学品分类，警示标签和警'
);

const files = [
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1007 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-1036 msds_EN Guanzhi.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/1-1 单组份水性聚氨酯树脂 PU/PU-202A msds_CN 冠志.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3617 MSDS-CN 国彩.docx',
  'F:/MSDS覆写/MSDS/TDS MSDS (2)/TDS MSDS/产品 TDS MSDS -- WORD版本/2-1 单组份水性丙烯酸乳液 PA/PA-3615 MSDS（冠志）.docx'
];

console.log('Testing prototype enhancements:');
for (const f of files) {
  const buf = await fs.readFile(f);
  const eng = await loadDocx(buf, path.basename(f));
  
  // Custom runSmartMatching with S3->S4 flow, multi-line address splitting, and unlabeled row continuation
  const records = (eng.records || []).filter((r) => r.kind === 'table' && r.sectionNumber);
  const crossSectionFacts = { 4: [] };
  let totalMatched = 0;
  let totalPruned = 0;
  let totalUnmatched = 0;

  for (let s = 1; s <= 16; s++) {
    const registry = SECTION_SLOT_REGISTRY[s];
    const sourceRecord = records.find((r) => r.sectionNumber === s);
    if (!registry) continue;

    const rawPairs = [];
    if (sourceRecord && sourceRecord.rows) {
      let inSec4Subtable = false;
      for (let rIdx = 1; rIdx < sourceRecord.rows.length; rIdx++) {
        const row = sourceRecord.rows[rIdx];
        const cell0 = row.cells?.[0];
        const cell1 = row.cells?.[1];
        if (!cell0) continue;

        const c0Text = cell0.text?.trim() || '';
        const c1Text = cell1?.text?.trim() || '';

        // S3 -> S4 subtable detection
        if (s === 3) {
          if (/4\.\s*急救措施/i.test(c0Text)) {
            inSec4Subtable = true;
            continue;
          }
          if (inSec4Subtable) {
            crossSectionFacts[4].push({
              rawLabel: c0Text,
              rawValue: c1Text || row.cells?.slice(1).map(c => c.text).join(' ').trim() || '',
              rowObj: row
            });
            continue;
          }
          if (row.cells?.length >= 3 || /Chemical Name|CAS NO|成分|组成|含量/i.test(c0Text)) {
            continue;
          }
        }

        // Section 1 Multi-line address/phone/emergency split in single cell
        if (s === 1 && (cell0.text.includes('地址：') || cell0.text.includes('生产企业名称：') || cell1?.text?.includes('地址：'))) {
          const lines = (cell1?.text || cell0.text).split('\n');
          for (const line of lines) {
            const cs = safeColonSplit(line);
            if (cs.hasColon) {
              rawPairs.push({ rawLabel: cs.label, rawValue: cs.value, rowObj: row });
            }
          }
          continue;
        }

        // Section 1 Product name vs Model split
        if (s === 1 && /^(?:品名|产品名称|中文名称|化学品名称)[:：]?/i.test(c0Text) && /PU-\d+|PA-\d+/i.test(c1Text)) {
          // If value is model code
          rawPairs.push({ rawLabel: '产品型号：', rawValue: c1Text, rowObj: row });
          continue;
        }

        // Check if row is unlabeled continuation of previous row
        if (!c0Text && c1Text && rawPairs.length > 0) {
          const prev = rawPairs[rawPairs.length - 1];
          if (!prev.rawValue) {
            prev.rawValue = c1Text;
          } else {
            prev.rawValue += '\n' + c1Text;
          }
          continue;
        }

        let pairLabel = cell0.labelText || '';
        let pairValue = cell1 ? (cell1.valueText || cell1.text || '') : (cell0.valueText || '');

        if (!pairLabel && c0Text) {
          const cs = safeColonSplit(c0Text);
          if (cs.hasColon) {
            pairLabel = cs.label;
            pairValue = cs.value + (c1Text ? ` ${c1Text}` : '');
          } else if (cell1) {
            pairLabel = c0Text;
            pairValue = c1Text;
          } else {
            pairValue = c0Text;
          }
        }

        if (pairLabel || pairValue) {
          rawPairs.push({ rawLabel: pairLabel, rawValue: pairValue, rowObj: row });
        }
      }
    }

    if (crossSectionFacts[s]) {
      rawPairs.push(...crossSectionFacts[s]);
    }

    // Check unmatched
    const unmatched = [];
    for (const p of rawPairs) {
      if (/^(?:8\.1控制参数|8\.2暴露控制|8\.1暴露控制|4\.急救措施|8\.接触控制)$/i.test(p.rawLabel?.trim())) continue;
      const res = resolveSlotBySemantics(p.rawLabel, s);
      if (!res) {
        unmatched.push(p);
      }
    }
    if (unmatched.length > 0) {
      console.log(`  [${path.basename(f)}] Sec ${s} remaining UNMATCHED (${unmatched.length}):`, unmatched.map(u => `${u.rawLabel}: ${u.rawValue?.slice(0, 30)}`));
    }
  }
}
