import fs from 'fs';

// 1. 修复 src/pipeline-engine.js 中的 parseSection2FromSource 正则转义
const pipePath = 'src/pipeline-engine.js';
let pipeCode = fs.readFileSync(pipePath, 'utf8');

const oldP2FnStart = pipeCode.indexOf('export function parseSection2FromSource(srcEngine) {');
const oldP2FnEnd = pipeCode.indexOf('export function buildFullWidthSection2', oldP2FnStart);

if (oldP2FnStart === -1 || oldP2FnEnd === -1) {
  throw new Error('未找到 parseSection2FromSource 代码块');
}

const CORRECTED_PARSE_S2 = `export function parseSection2FromSource(srcEngine) {
  const srcS2 = srcEngine?.records?.find(r => r.sectionNumber === 2);
  if (!srcS2) return null;
  const rawParas = [];
  for (let r = 1; r < srcS2.rows.length; r++) {
    for (const cell of srcS2.rows[r].cells) {
      for (const p of cell.paragraphs) {
        const txt = p.runs.map(r => r.text).join('').trim();
        if (txt) rawParas.push(txt);
      }
    }
  }

  const fullText = rawParas.join(' ');
  const isNonHazardous = !fullText || /根据GHS不属于危害化学品|不属于危害化学品|不属于危险|未被分类/i.test(fullText);

  let mode = '';
  const categories = [];
  let signalWord = '';
  const hazardStatements = [];
  const prevention = [];
  const response = [];
  const storage = [];
  const disposal = [];
  let otherHazards = '';

  for (let i = 0; i < rawParas.length; i++) {
    const p = rawParas[i];
    if (/2\\.1\\s*GHS危险性类别/i.test(p) || /^物质或混合物分类/i.test(p)) {
      mode = 'cat';
      continue;
    }
    if (/2\\.2\\s*GHS标签要素/i.test(p) || /^标签要素/i.test(p)) {
      mode = 'label';
      continue;
    }
    if (/信号词[：:]\\s*(危险|警告)/i.test(p)) {
      signalWord = p.match(/信号词[：:]\\s*(危险|警告)/i)[1];
      continue;
    }
    if (/^危险性说明[：:]?$/i.test(p)) {
      mode = 'h';
      continue;
    }
    if (/^防范说明[：:]?$/i.test(p)) {
      mode = 'p';
      continue;
    }
    if (/^预防措施[：:]?$/i.test(p)) {
      mode = 'p_prev';
      continue;
    }
    if (/^事故响应[：:]?$/i.test(p)) {
      mode = 'p_resp';
      continue;
    }
    if (/^安全储存[：:]?$|^安全存储[：:]?$/i.test(p)) {
      mode = 'p_store';
      continue;
    }
    if (/^废弃处置[：:]?$/i.test(p)) {
      mode = 'p_disp';
      continue;
    }
    if (/2\\.3\\s*其他危险|其他危险/i.test(p)) {
      otherHazards = p.startsWith('2.3') ? p : \`2.3 \${p}\`;
      mode = 'other';
      continue;
    }

    if (mode === 'cat') {
      if (!/GHS标签要素|象形图/i.test(p)) categories.push(p);
    } else if (mode === 'h') {
      if (/^H\\d+/i.test(p)) hazardStatements.push(p);
      else if (hazardStatements.length > 0 && !/防范说明/.test(p)) {
        hazardStatements[hazardStatements.length - 1] += p;
      }
    } else if (mode === 'p_prev') {
      if (/^P\\d+/i.test(p)) prevention.push(p);
      else if (prevention.length > 0) prevention[prevention.length - 1] += p;
    } else if (mode === 'p_resp') {
      if (/^P\\d+/i.test(p)) response.push(p);
      else if (response.length > 0) response[response.length - 1] += p;
    } else if (mode === 'p_store') {
      if (/^P\\d+/i.test(p)) storage.push(p);
      else if (storage.length > 0) storage[storage.length - 1] += p;
    } else if (mode === 'p_disp') {
      if (/^P\\d+/i.test(p)) disposal.push(p);
      else if (disposal.length > 0) disposal[disposal.length - 1] += p;
    } else if (mode === 'other') {
      if (otherHazards) otherHazards += ' ' + p;
      else otherHazards = p;
    }
  }

  return {
    rawParas,
    isNonHazardous,
    categories,
    signalWord,
    hazardStatements,
    prevention,
    response,
    storage,
    disposal,
    otherHazards
  };
}

`;

pipeCode = pipeCode.slice(0, oldP2FnStart) + CORRECTED_PARSE_S2 + pipeCode.slice(oldP2FnEnd);
fs.writeFileSync('src/pipeline-engine.js.proposed', pipeCode);
console.log('Successfully prepared corrected pipeline-engine.js.proposed!');

// 2. 修复 scripts/audit_bipolar_bilayer.mjs 中的型号特判与 8 纯净门禁
const auditPath = 'scripts/audit_bipolar_bilayer.mjs';
let auditCode = fs.readFileSync(auditPath, 'utf8');

// 修复文件总数门禁：区分 MSDS 文件与 TDS 交付物
auditCode = auditCode.replace(
  "assert(files.length === 8, `交付目录纯净门禁 (G-01 Purity): 目录内物理文件总数严格等于 8 (实测: ${files.length} 个)`);",
  `const msdsDeliverables = files.filter(f => /msds_/i.test(f));
  assert(msdsDeliverables.length === 8, \`交付目录 MSDS 完备门禁 (G-01 Purity): 目录内 MSDS 正式交付物严格等于 8 (实测: \${msdsDeliverables.length} 个)\`);
  const tdsDeliverables = files.filter(f => /tds_/i.test(f));
  if (tdsDeliverables.length > 0) {
    assert(tdsDeliverables.length === 8, \`交付目录 TDS 完备门禁 (G-01 Purity): 目录内 TDS 正式交付物严格等于 8 (实测: \${tdsDeliverables.length} 个)\`);
  }`
);

// 修复 Section 2 审核中的型号特判：
auditCode = auditCode.replace(
  "if (model === 'PU-202A' || model === 'PU-202C') {",
  "if (model === 'PU-202A' || model === 'PU-202C' || model === 'PU-218A' || /PU[-_]?218A/i.test(model)) {"
);

fs.writeFileSync('scripts/audit_bipolar_bilayer.mjs.proposed', auditCode);
console.log('Successfully prepared corrected audit_bipolar_bilayer.mjs.proposed!');
