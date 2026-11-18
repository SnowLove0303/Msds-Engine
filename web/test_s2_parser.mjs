import fs from 'fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

import { loadDocx } from './src/docx-engine.js';

const GHS_CATEGORY_MAP = {
  '急性毒性（吸入），类别4（H332）': 'Acute toxicity, Inhalation (Category 4), H332',
  '急性毒性（吸入），类别 4（H332）': 'Acute toxicity, Inhalation (Category 4), H332',
  '皮肤腐蚀/刺激，类别3（H316）': 'Skin corrosion/irritation (Category 3), H316',
  '皮肤腐蚀/刺激，类别 3（H316）': 'Skin corrosion/irritation (Category 3), H316',
  '严重眼睛损伤/眼睛刺激性，类别2B（H320）': 'Serious eye damage/eye irritation (Category 2B), H320',
  '严重眼睛损伤/眼睛刺激性，类别 2B（H320）': 'Serious eye damage/eye irritation (Category 2B), H320',
  '生殖毒性物质，类别1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性物质，类别 1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性，类别1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '特异性靶器官系统毒性 一次接触，类别1（H370）': 'Specific target organ toxicity - single exposure (Category 1), H370',
  '特异性靶器官系统毒性 一次接触，类别 1（H370）': 'Specific target organ toxicity - single exposure (Category 1), H370',
  '特异性靶器官系统毒性 反复接触，类别2（H373）': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  '特异性靶器官系统毒性 反复接触，类别 2（H373）': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  '易燃液体，类别3（H226）': 'Flammable liquid (Category 3), H226',
  '皮肤致敏，类别1B（H317）': 'Skin sensitization (Category 1B), H317',
  '对水环境有慢性危害，类别3（H412）': 'Chronic aquatic toxicity (Category 3), H412',
  '特异性靶器官系统毒性 一次接触，类别3（H335）': 'Specific target organ toxicity - single exposure (Category 3), H335',
};

const GHS_H_MAP = {
  'H316': 'H316 Causes mild skin irritation.',
  'H320': 'H320 Causes eye irritation.',
  'H332': 'H332 Harmful if inhaled.',
  'H360': 'H360 May damage fertility or the unborn child.',
  'H370': 'H370 Causes damage to organs.',
  'H373': 'H373 May cause damage to organs (Liver) through prolonged or repeated exposure.',
  'H226': 'H226 Flammable liquid and vapour.',
  'H317': 'H317 May cause an allergic skin reaction.',
  'H335': 'H335 May cause respiratory irritation.',
  'H412': 'H412 Harmful to aquatic life with long lasting effects.',
};

const GHS_P_MAP = {
  'P201': 'P201 Obtain special instructions before use.',
  'P202': 'P202 Do not handle until all safety precautions have been read and understood.',
  'P260': 'P260 Do not breathe dust/fume/gas/mist/vapours/spray.',
  'P264': 'P264 Wash hands thoroughly after handling.',
  'P270': 'P270 Do not eat, drink or smoke when using this product.',
  'P271': 'P271 Use only outdoors or in a well-ventilated area.',
  'P280': 'P280 Wear protective gloves/clothing/eye protection/face protection.',
  'P304+P340': 'P304+P340 IF INHALED: Remove person to fresh air and keep comfortable for breathing.',
  'P305+P351+P338': 'P305+P351+P338 IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.',
  'P308+P313': 'P308+P313 IF exposed or concerned: Get medical advice/attention.',
  'P337+P313': 'P337+P313 If eye irritation persists: Get medical advice/attention.',
  'P370+P378': 'P370+P378 In case of fire: Use foam, dry powder or carbon dioxide to extinguish.',
  'P405': 'P405 Store locked up.',
  'P501': 'P501 Dispose of contents/container in accordance with local regulations.',
};

function parseSection2Source(srcEngine) {
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
  const isNonHazardous = !fullText || /不属于危害|非危险|不属于危险|未被分类/i.test(fullText);

  // Parse structured elements
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
    if (/2\.1\s*GHS危险性类别/i.test(p) || /物质或混合物分类/i.test(p)) {
      mode = 'cat';
      continue;
    }
    if (/2\.2\s*GHS标签要素/i.test(p) || /标签要素/i.test(p)) {
      mode = 'label';
      continue;
    }
    if (/信号词[：:]\s*(危险|警告)/i.test(p)) {
      signalWord = p.match(/信号词[：:]\s*(危险|警告)/i)[1];
      continue;
    }
    if (/危险性说明/i.test(p)) {
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

    if (/2\.3\s*其他危险|其他危险/i.test(p)) {
      otherHazards = p.startsWith('2.3') ? p : `2.3 ${p}`;
      mode = 'other';
      continue;
    }

    if (mode === 'cat') {
      if (!/GHS标签要素|象形图/i.test(p)) categories.push(p);
    } else if (mode === 'h') {
      if (/^H\d+/.test(p)) hazardStatements.push(p);
      else if (hazardStatements.length > 0 && !/防范说明/.test(p)) {
        hazardStatements[hazardStatements.length - 1] += p;
      }
    } else if (mode === 'p_prev') {
      if (/^P\d+/.test(p)) prevention.push(p);
      else if (prevention.length > 0) prevention[prevention.length - 1] += p;
    } else if (mode === 'p_resp') {
      if (/^P\d+/.test(p)) response.push(p);
      else if (response.length > 0) response[response.length - 1] += p;
    } else if (mode === 'p_store') {
      if (/^P\d+/.test(p)) storage.push(p);
      else if (storage.length > 0) storage[storage.length - 1] += p;
    } else if (mode === 'p_disp') {
      if (/^P\d+/.test(p)) disposal.push(p);
      else if (disposal.length > 0) disposal[disposal.length - 1] += p;
    } else if (mode === 'other') {
      if (otherHazards) otherHazards += ' ' + p;
      else otherHazards = p;
    }
  }

  return {
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

function buildEnglishSection2Paragraphs(parsed, drawingNodes, srcEngine) {
  const paragraphs = [
    '2.1 Classification of the substance or mixture:'
  ];
  for (const cat of parsed.categories) {
    const enCat = GHS_CATEGORY_MAP[cat] || cat;
    paragraphs.push(enCat);
  }
  paragraphs.push(
    '2.2 GHS Label Elements:',
    'GHS pictograms:'
  );
  if (drawingNodes && drawingNodes.length > 0) {
    paragraphs.push({ isDrawing: true, drawingNodes, srcEngine });
  }
  const enSignal = parsed.signalWord === '危险' ? 'Danger' : (parsed.signalWord === '警告' ? 'Warning' : 'None');
  paragraphs.push(`Signal word: ${enSignal}`);
  paragraphs.push('Hazard statements:');
  for (const h of parsed.hazardStatements) {
    const hCodeMatch = h.match(/^(H\d+)/);
    const code = hCodeMatch ? hCodeMatch[1] : '';
    const enH = GHS_H_MAP[code] || h;
    paragraphs.push(enH);
  }
  paragraphs.push(
    'Precautionary statements:',
    'Prevention:'
  );
  for (const p of parsed.prevention) {
    const pCodeMatch = p.match(/^(P\d+(?:\+P\d+)*)/);
    const code = pCodeMatch ? pCodeMatch[1] : '';
    const enP = GHS_P_MAP[code] || p;
    paragraphs.push('        ' + enP);
  }
  paragraphs.push('Response:');
  for (const p of parsed.response) {
    const pCodeMatch = p.match(/^(P\d+(?:\+P\d+)*)/);
    const code = pCodeMatch ? pCodeMatch[1] : '';
    const enP = GHS_P_MAP[code] || p;
    paragraphs.push('        ' + enP);
  }
  paragraphs.push('Storage:');
  for (const p of parsed.storage) {
    const pCodeMatch = p.match(/^(P\d+(?:\+P\d+)*)/);
    const code = pCodeMatch ? pCodeMatch[1] : '';
    const enP = GHS_P_MAP[code] || p;
    paragraphs.push('        ' + enP);
  }
  paragraphs.push('Disposal:');
  for (const p of parsed.disposal) {
    const pCodeMatch = p.match(/^(P\d+(?:\+P\d+)*)/);
    const code = pCodeMatch ? pCodeMatch[1] : '';
    const enP = GHS_P_MAP[code] || p;
    paragraphs.push('        ' + enP);
  }

  let enOther = '2.3 Other hazards: No applicable information.';
  if (/N[－-]甲基吡咯烷酮/i.test(parsed.otherHazards)) {
    enOther = '2.3 Other hazards: Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).';
  } else if (/N,N[－-]二甲基乙酰胺/i.test(parsed.otherHazards)) {
    enOther = '2.3 Other hazards: Risk of cutaneous absorption of N,N-Dimethylacetamide (DMAC).';
  }
  paragraphs.push(enOther);
  return paragraphs;
}

async function test(name, path) {
  const buf = fs.readFileSync(path);
  const engine = await loadDocx(buf, 'test.docx');
  const parsed = parseSection2Source(engine);
  console.log(`\n================== [${name}] ==================`);
  console.log('categories:', parsed.categories);
  console.log('prevention items:', parsed.prevention);
  const enParas = buildEnglishSection2Paragraphs(parsed, [], engine);
  console.log('--- EN Section 2 paras ---');
  enParas.forEach((p, idx) => {
    if (typeof p === 'string') console.log(`  [${idx}] ${p}`);
  });
}



async function main() {
  await test('PU-218A', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-218A/PU-218A msds_CN 冠志.docx');
  await test('PU-202B', 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/算法训练材料/源文件材料/1-1 单组份水性聚氨酯树脂 PU/PU-202B/PU-202B msds_CN 冠志.docx');
}

main().catch(console.error);
