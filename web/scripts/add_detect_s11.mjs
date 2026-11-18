import fs from 'fs';

const origPath = 'src/pipeline-engine.js';
let code = fs.readFileSync(origPath, 'utf8');

const DETECT_S11_PARADIGM_CODE = `/**
 * Section 11 双范式动态路由判定算法 (对齐 OpenSpec handcraft-typography-and-s11-dual-paradigm)
 * @param {object|Array} section11FactsOrRecords
 * @returns {'PARADIGM_1_FULL_WIDTH_MERGED'|'PARADIGM_2_STANDARD_SLOTS'}
 */
export function detectSection11Paradigm(section11FactsOrRecords) {
  if (!section11FactsOrRecords) return 'PARADIGM_2_STANDARD_SLOTS';
  
  if (section11FactsOrRecords.isMultiComponentComposite || section11FactsOrRecords.isMultiComponentS11) {
    return 'PARADIGM_1_FULL_WIDTH_MERGED';
  }

  let rawText = '';
  if (typeof section11FactsOrRecords === 'string') {
    rawText = section11FactsOrRecords;
  } else if (Array.isArray(section11FactsOrRecords)) {
    rawText = section11FactsOrRecords.map(item => (typeof item === 'string' ? item : item?.text || '')).join(' ');
  } else if (section11FactsOrRecords.rows && Array.isArray(section11FactsOrRecords.rows)) {
    rawText = section11FactsOrRecords.rows.map(r => (r.cells || []).map(c => c.text || '').join(' ')).join(' ');
  } else if (section11FactsOrRecords.node && typeof section11FactsOrRecords.node.textContent === 'string') {
    rawText = section11FactsOrRecords.node.textContent;
  } else {
    try {
      rawText = JSON.stringify(section11FactsOrRecords, (key, value) => {
        if (key === 'node' || key === 'record' || key === 'table' || key === 'parent') return undefined;
        return value;
      });
    } catch {
      rawText = String(section11FactsOrRecords);
    }
  }

  const componentMatches = new Set();
  const casMatches = rawText.match(/\\b\\d{2,7}-\\d{2}-\\d\\b/g) || [];
  casMatches.forEach(c => componentMatches.add(c));

  const knownComponentKeywords = [
    '分散体', '丙二醇丁醚', '二乙二醇丁醚', '聚合物', '溶剂', '添加剂'
  ];
  knownComponentKeywords.forEach(kw => {
    if (rawText.includes(kw)) componentMatches.add(kw);
  });

  if (componentMatches.size >= 2) {
    return 'PARADIGM_1_FULL_WIDTH_MERGED';
  }

  return 'PARADIGM_2_STANDARD_SLOTS';
}

`;

const target = 'export function buildThreeTierSection11(engine, facts = {}, isEnglish = false) {';
if (!code.includes('export function detectSection11Paradigm')) {
  code = code.replace(target, DETECT_S11_PARADIGM_CODE + target);
  console.log('Successfully added detectSection11Paradigm!');
} else {
  console.log('detectSection11Paradigm already exists');
}

fs.writeFileSync('src/pipeline-engine.js.proposed', code);
