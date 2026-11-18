import fs from 'fs';

// 1. In pipeline-engine.js, lock Section 13, Section 2.5, Section 11 565 dxa, Section 8 Recommendation, and Value Cell left alignment
let pipe = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\web\\src\\pipeline-engine.js', 'utf8');

// Lock Section 13 in standardizeMsdsToStandardEnglish
const s13Target = `  // Section 13 (标准 4 行：标题行 + 2 行独立说明行 + 处置方法行)
  let s13 = engine.records.find(r => r.sectionNumber === 13);`;
const s13Locked = `  // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 13 必须严格保持 4 行独立结构（两行单列独立说明行 + 处置方法行），严禁合并删行
  // Section 13 (标准 4 行：标题行 + 2 行独立说明行 + 处置方法行)
  let s13 = engine.records.find(r => r.sectionNumber === 13);`;
pipe = pipe.replace(s13Target, s13Locked);

const s13EndTarget = `    } else {
      if (s13.rows[1]?.cells[0]) safeWrite(s13.rows[1].cells[0], enValues['sec13.line1']);
      if (s13.rows[2]?.cells[1]) safeWrite(s13.rows[2].cells[1], enValues['sec13.methods']);
    }
  }`;
const s13EndLocked = `    } else {
      if (s13.rows[1]?.cells[0]) safeWrite(s13.rows[1].cells[0], enValues['sec13.line1']);
      if (s13.rows[2]?.cells[1]) safeWrite(s13.rows[2].cells[1], enValues['sec13.methods']);
    }
  }
  // @ANTIGRAVITY_INVARIANT_LOCK_END`;
pipe = pipe.replace(s13EndTarget, s13EndLocked);

// Lock formatValueCell
const valTarget = `function formatValueCell(cell, W_NS) {`;
const valLocked = `// @ANTIGRAVITY_INVARIANT_LOCK_START: 值格 100% 纯左对齐与自然词距公理，根治 Word 两端对齐造成的字词拉大间距
function formatValueCell(cell, W_NS) {`;
pipe = pipe.replace(valTarget, valLocked);

// Lock Section 11 565 dxa and Recommendation
const labelTarget = `function formatEnglishLabelCell(cell, W_NS, sectionNumber) {`;
const labelLocked = `// @ANTIGRAVITY_INVARIANT_LOCK_START: 第一列双基准悬挂缩进 (常规 420 dxa / Sec 11 565 dxa 防弹飞) 与无序号标签右缩进对齐
function formatEnglishLabelCell(cell, W_NS, sectionNumber) {`;
pipe = pipe.replace(labelTarget, labelLocked);

fs.writeFileSync('C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\29d1acd7-309a-4775-b722-78688bb1d302/scratch/pipeline-engine.proposed.js', pipe, 'utf8');

// 2. In smart-matching.js, lock Section 2 clean double-column matching & anti-prune protection
let smart = fs.readFileSync('F:\\App Location\\Guanzhi Tong\\Skill\\MSDS-Engine\\web\\src\\smart-matching.js', 'utf8');

const smTarget = `        // Section 2 专属：单/双单元格复合块前置解耦 (Decouple Section 2 Compound Blocks)`;
const smLocked = `        // @ANTIGRAVITY_INVARIANT_LOCK_START: Section 2 规整双列行免复合解耦与 REVIEW_AMBIGUOUS 核心分类行防误删保护
        // Section 2 专属：单/双单元格复合块前置解耦 (Decouple Section 2 Compound Blocks)`;
smart = smart.replace(smTarget, smLocked);

fs.writeFileSync('C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\29d1acd7-309a-4775-b722-78688bb1d302/scratch/smart-matching.proposed.js', smart, 'utf8');

console.log('Invariant lock proposals prepared.');
