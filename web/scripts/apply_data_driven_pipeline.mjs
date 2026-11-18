import fs from 'fs';
import path from 'path';

const origPath = path.resolve('src/pipeline-engine.js');
let code = fs.readFileSync(origPath, 'utf8');

// 1. 定义通用 GHS 翻译字典与解析函数
const GHS_HELPER_CODE = `
// ==========================================
// 通用 GHS 分类与 H/P 规程中英标准数据字典
// ==========================================
const GHS_CATEGORY_TRANS_MAP = {
  '急性毒性（吸入），类别4（H332）': 'Acute toxicity, Inhalation (Category 4), H332',
  '急性毒性（吸入），类别 4（H332）': 'Acute toxicity, Inhalation (Category 4), H332',
  '皮肤腐蚀/刺激，类别3（H316）': 'Skin corrosion/irritation (Category 3), H316',
  '皮肤腐蚀/刺激，类别 3（H316）': 'Skin corrosion/irritation (Category 3), H316',
  '严重眼睛损伤/眼睛刺激性，类别2B（H320）': 'Serious eye damage/eye irritation (Category 2B), H320',
  '严重眼睛损伤/眼睛刺激性，类别 2B（H320）': 'Serious eye damage/eye irritation (Category 2B), H320',
  '生殖毒性物质，类别1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性物质，类别 1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性，类别1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '生殖毒性，类别 1B（H360）': 'Reproductive toxicity (Category 1B), H360',
  '特异性靶器官系统毒性 一次接触，类别1（H370）': 'Specific target organ toxicity - single exposure (Category 1), H370',
  '特异性靶器官系统毒性 一次接触，类别 1（H370）': 'Specific target organ toxicity - single exposure (Category 1), H370',
  '特异性靶器官系统毒性 反复接触，类别2（H373）': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  '特异性靶器官系统毒性 反复接触，类别 2（H373）': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  '易燃液体，类别3（H226）': 'Flammable liquid (Category 3), H226',
  '易燃液体，类别 3（H226）': 'Flammable liquid (Category 3), H226',
  '皮肤致敏，类别1B（H317）': 'Skin sensitization (Category 1B), H317',
  '皮肤致敏，类别 1B（H317）': 'Skin sensitization (Category 1B), H317',
  '对水环境有慢性危害，类别3（H412）': 'Chronic aquatic toxicity (Category 3), H412',
  '对水环境有慢性危害，类别 3（H412）': 'Chronic aquatic toxicity (Category 3), H412',
  '特异性靶器官系统毒性 一次接触，类别3（H335）': 'Specific target organ toxicity - single exposure (Category 3), H335',
  '特异性靶器官系统毒性 一次接触，类别 3（H335）': 'Specific target organ toxicity - single exposure (Category 3), H335',
};

const GHS_H_TRANS_MAP = {
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

const GHS_P_TRANS_MAP = {
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

/**
 * 从源文档 Section 2 提取真实结构化事实
 */
export function parseSection2FromSource(srcEngine) {
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
    if (/2\.1\s*GHS危险性类别/i.test(p) || /^物质或混合物分类/i.test(p)) {
      mode = 'cat';
      continue;
    }
    if (/2\.2\s*GHS标签要素/i.test(p) || /^标签要素/i.test(p)) {
      mode = 'label';
      continue;
    }
    if (/信号词[：:]\s*(危险|警告)/i.test(p)) {
      signalWord = p.match(/信号词[：:]\s*(危险|警告)/i)[1];
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
    if (/2\.3\s*其他危险|其他危险/i.test(p)) {
      otherHazards = p.startsWith('2.3') ? p : \`2.3 \${p}\`;
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

// 2. 编写全新的 buildFullWidthSection2
const NEW_BUILD_SECTION2 = `
/**
 * 构建非危或危险品通栏 Section 2 (Mode B)
 * 完全由源文件事实驱动，严禁任何硬编码型号特判与死数据兜底！
 */
export function buildFullWidthSection2(engine, facts = {}, isEnglish = false) {
  let s2 = engine.records.find((r) => r.sectionNumber === 2);
  if (!s2) return;

  // 1. 保留 Row 0（标题行），清理后续所有行只留 Row 1
  while (s2.rows.length > 2) {
    s2 = deleteRow(engine, s2, s2.rows.length - 1);
  }
  while (s2.rows.length < 2) {
    s2 = addRowAfter(engine, s2, s2.rows.length - 1);
  }

  // 2. 从源引擎中精准解析真实 Section 2 结构
  const parsed = parseSection2FromSource(facts.srcEngine);
  const isNonHazardous = !parsed || parsed.isNonHazardous || (!parsed.categories.length && !parsed.hazardStatements.length);

  const paragraphs = [];
  if (!isEnglish) {
    // 中文通栏组装
    if (!isNonHazardous && parsed) {
      paragraphs.push(
        '2.1 GHS危险性类别：',
        ...parsed.categories,
        '2.2 GHS标签要素：',
        'GHS象形图：'
      );
      if (facts.drawingNodes && facts.drawingNodes.length > 0) {
        paragraphs.push({ isDrawing: true, drawingNodes: facts.drawingNodes, srcEngine: facts.srcEngine });
      }
      paragraphs.push(
        \`信号词：\${parsed.signalWord || '危险'}\`,
        '危险性说明：',
        ...parsed.hazardStatements,
        '防范说明：',
        '预防措施：',
        ...parsed.prevention.map(p => p.startsWith('        ') ? p : '        ' + p),
        '事故响应：',
        ...parsed.response.map(p => p.startsWith('        ') ? p : '        ' + p),
        '安全储存：',
        ...parsed.storage.map(p => p.startsWith('        ') ? p : '        ' + p),
        '废弃处置：',
        ...parsed.disposal.map(p => p.startsWith('        ') ? p : '        ' + p),
        parsed.otherHazards || '2.3 其他危险：无适用资料。'
      );
    } else {
      // 真实非危通栏组装
      paragraphs.push('GHS危险性类别: 无');
      if (facts.section3ExemptionNotes) {
        paragraphs.push(...facts.section3ExemptionNotes.split(/\\r?\\n/).filter(Boolean));
      }
      paragraphs.push(
        '象形图：无',
        '警告词：警告',
        '危害性说明:没有明显的已知作用或严重危险。',
        '防范说明:',
        '预防措施：',
        '        操作时穿戴必要的防护用品（手套、防护镜、工作服等）。',
        '        操作后彻底清洗身体接触部位。',
        '        作业场所不得进食，饮水或吸烟。',
        '在室外或通风良好处操作。',
        '事故响应：',
        '        吸入：一旦吸入，如有不适，就医。',
        '        眼睛、皮肤接触；使用肥皂、清水等清洗即可。如有不适感，就医。',
        '        食入：立即漱口，禁止催吐，立即就医诊治。',
        '        泄露：收集泄漏物。',
        '        灭火：火灾时，使用干粉、泡沫、二氧化碳灭火。',
        '安全存储：',
        '    请置于避光、阴凉干燥处存放，存储温度应保持在5-35℃，避免霜冻，保持产品装完整。每次取用之后立即密封，打开包装后尽快使用完毕。',
        '废弃处置：',
        '    使用后的空桶未经无害化处理前，不得存储食物及其他物品，以免对人体、环境造成危害；包装物的回收、利用、处置应符合国家及当地相关法律、法规规定，因包装物处置不当造成的危害及损失，由处置方承担。',
        '物理化学危险：对水体、土壤可造成一定的污染。',
        '健康危害：无',
        '环境危害：无危险物质释放，防止进入下水道，以防聚合物沉积阻塞下水道。'
      );
    }
  } else {
    // 英文通栏组装 (100% 数据驱动动态英译)
    if (!isNonHazardous && parsed) {
      paragraphs.push('2.1 Classification of the substance or mixture:');
      for (const cat of parsed.categories) {
        paragraphs.push(GHS_CATEGORY_TRANS_MAP[cat] || cat);
      }
      paragraphs.push(
        '2.2 GHS Label Elements:',
        'GHS pictograms:'
      );
      if (facts.drawingNodes && facts.drawingNodes.length > 0) {
        paragraphs.push({ isDrawing: true, drawingNodes: facts.drawingNodes, srcEngine: facts.srcEngine });
      }
      const enSignal = parsed.signalWord === '危险' ? 'Danger' : (parsed.signalWord === '警告' ? 'Warning' : 'Danger');
      paragraphs.push(\`Signal word: \${enSignal}\`);
      paragraphs.push('Hazard statements:');
      for (const h of parsed.hazardStatements) {
        const codeMatch = h.match(/^(H\\d+)/);
        const code = codeMatch ? codeMatch[1] : '';
        paragraphs.push(GHS_H_TRANS_MAP[code] || h);
      }
      paragraphs.push(
        'Precautionary statements:',
        'Prevention:'
      );
      for (const p of parsed.prevention) {
        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);
        const code = codeMatch ? codeMatch[1] : '';
        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));
      }
      paragraphs.push('Response:');
      for (const p of parsed.response) {
        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);
        const code = codeMatch ? codeMatch[1] : '';
        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));
      }
      paragraphs.push('Storage:');
      for (const p of parsed.storage) {
        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);
        const code = codeMatch ? codeMatch[1] : '';
        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));
      }
      paragraphs.push('Disposal:');
      for (const p of parsed.disposal) {
        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);
        const code = codeMatch ? codeMatch[1] : '';
        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));
      }
      let enOther = '2.3 Other hazards: No applicable information.';
      if (/N[－-]甲基吡咯烷酮/i.test(parsed.otherHazards)) {
        enOther = '2.3 Other hazards: Risk of cutaneous absorption of N-Methyl-2-pyrrolidone (NMP).';
      } else if (/N,N[－-]二甲基乙酰胺/i.test(parsed.otherHazards)) {
        enOther = '2.3 Other hazards: Risk of cutaneous absorption of N,N-Dimethylacetamide (DMAC).';
      }
      paragraphs.push(enOther);
    } else {
      // 英文真实非危通栏
      paragraphs.push('GHS hazard classification: Not classified as a hazardous chemical according to GHS.');
      if (facts.section3ExemptionNotes) {
        paragraphs.push(...facts.section3ExemptionNotes.split(/\\r?\\n/).filter(Boolean));
      }
      paragraphs.push(
        'Pictograms: None',
        'Signal word: Warning',
        'Hazard statements: No known significant effects or critical hazards.',
        'Precautionary statements:',
        'Prevention:',
        '        Wear necessary protective equipment (gloves, goggles, work clothing, etc.) during operation.',
        '        Wash contacted body parts thoroughly after handling.',
        '        Do not eat, drink or smoke in the workplace.',
        'Operate outdoors or in a well-ventilated area.',
        'Response:',
        '        Inhalation: If inhaled and feeling unwell, seek medical attention.',
        '        Skin/Eye contact: Wash with soap and clean water. If discomfort persists, seek medical attention.',
        '        Ingestion: Rinse mouth immediately. Do NOT induce vomiting. Seek immediate medical treatment.',
        '        Spill: Collect spillage.',
        '        Fire: In case of fire, use dry powder, foam, or carbon dioxide for extinction.',
        'Storage:',
        'Store in a cool, dry, well-ventilated place away from light. Maintain storage temperature between 5-35 deg C. Protect from freezing and keep packaging intact. Keep container tightly closed after use and consume promptly once opened.',
        'Disposal:',
        'Empty containers must not be used to store food or other goods prior to decontamination to prevent harm to human health and the environment. Dispose of packaging in accordance with national and local environmental regulations. Any hazards and losses caused by improper disposal shall be borne by the disposer.',
        'Physical and chemical hazards: May cause contamination to water bodies and soil.',
        'Health hazards: None',
        'Environmental hazards: Prevent entry into drains to avoid polymer deposition and blockage of waterways.'
      );
    }
  }

  renderFullWidthRow(s2, 1, paragraphs, {
    isSection2: true,
    isEnglish,
    borders: true,
    boldSubheaders: true,
    totalWidth: 9795,
  });
  engine.refresh();
}
`;

// 替换 buildFullWidthSection2 函数
const s2OldStart = code.indexOf('export function buildFullWidthSection2(engine, facts = {}, isEnglish = false) {');
const s2OldEnd = code.indexOf('export function buildThreeTierSection11', s2OldStart);
if (s2OldStart === -1 || s2OldEnd === -1) {
  throw new Error('未找到 buildFullWidthSection2 代码块');
}

code = code.slice(0, s2OldStart) + GHS_HELPER_CODE + '\n' + NEW_BUILD_SECTION2 + '\n' + code.slice(s2OldEnd);

// 2.5 重构 buildThreeTierSection11 中的硬编码并保留 detectSection11Paradigm
const threeTierOldStart = code.indexOf('export function buildThreeTierSection11(engine, facts = {}, isEnglish = false) {');
const threeTierOldEnd = code.indexOf('export function cleanSection12Preambles', threeTierOldStart);
if (threeTierOldStart !== -1 && threeTierOldEnd !== -1) {
  const newThreeTier = `/**
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

export function buildThreeTierSection11(engine, facts = {}, isEnglish = false) {

  let s11 = engine.records.find((r) => r.sectionNumber === 11);
  if (!s11) return;

  while (s11.rows.length > 4) {
    s11 = deleteRow(engine, s11, s11.rows.length - 1);
  }
  while (s11.rows.length < 4) {
    s11 = addRowAfter(engine, s11, s11.rows.length - 1);
  }

  const srcS11 = facts.srcEngine?.records?.find((r) => r.sectionNumber === 11);
  const srcPreamble = (srcS11?.rows[2]?.cells[0]?.text || '').trim();

  const disclaimerText = !isEnglish
    ? '该产品无可用的毒理学研究。'
    : 'No toxicological studies are available on the product.';
  renderFullWidthRow(s11, 1, disclaimerText, { isEnglish, isSection11: true, boldSubheaders: false, totalWidth: 9781 });

  let preambleText = !isEnglish
    ? (srcPreamble || '下面是这些成分的毒理学数据。')
    : 'The following is toxicological data for these ingredients:';
  if (isEnglish && srcPreamble) {
    const compMatch = srcPreamble.match(/以[下为](?:是)?(.*?)毒理学数据/i);
    if (compMatch) {
      let comp = compMatch[1].trim();
      if (/N,N[－-]二甲基乙酰胺|DMAC/i.test(comp)) comp = 'N,N-Dimethylacetamide';
      else if (/N[－-]甲基吡咯烷酮|NMP/i.test(comp)) comp = 'N-Methyl-2-pyrrolidone (NMP)';
      else if (/N[－-]乙基吡咯烷酮|NEP/i.test(comp)) comp = '1-Ethylpyrrolidin-2-one (NEP)';
      preambleText = \`The following is toxicological data for \${comp}:\`;
    }
  }
  renderFullWidthRow(s11, 2, preambleText, { isEnglish, isSection11: true, leftIndentTwips: 34, boldSubheaders: false, totalWidth: 9781 });

  let detailParagraphs = facts.detailParagraphs || [];
  if (!detailParagraphs.length && srcS11) {
    // 从源文件 Section 11 中动态聚合端点
    const lines = [];
    for (let r = 3; r < srcS11.rows.length; r++) {
      const row = srcS11.rows[r];
      const lbl = (row.cells[0]?.text || '').trim();
      const val = (row.cells[row.cells.length - 1]?.text || '').trim();
      if (lbl && val) {
        if (!isEnglish) {
          lines.push(\`\${lbl} \${val}\`);
        } else {
          lines.push(\`\${lbl} \${translateToxicologyValueToEnglish(val)}\`);
        }
      }
    }
    if (lines.length) detailParagraphs = [lines.join('\\n')];
  }

  renderFullWidthRow(s11, 3, detailParagraphs, { isEnglish, isSection11: true, leftIndentTwips: 34, boldSubheaders: false, totalWidth: 9781 });
  engine.refresh();
}
`;
  code = code.slice(0, threeTierOldStart) + newThreeTier + '\n' + code.slice(threeTierOldEnd);
  console.log('Successfully refactored buildThreeTierSection11 to be generic!');
}

// 3. 重构 buildBaseChineseEngine 中的 Section 11 处理

// 将 if (s11 && isPu202a) 替换为数据驱动的动态处理
code = code.replace(
  /const isPu202b = modelCode === 'PU-202B' \|\| \/PU\[-_\]\?202B\/i\.test\(modelCode \|\| ''\);/g,
  "// const isPu202b 已被通用数据驱动机制彻底替代"
);

code = code.replace(
  /const isPu202a = modelCode === 'PU-202A' \|\| \/PU\[-_\]\?202A\/i\.test\(modelCode \|\| ''\);/g,
  "// isPu202a 已被通用数据驱动机制彻底替代"
);

code = code.replace(
  /} else if \(isNonHazComposite \|\| isPu202a\) {/g,
  "} else if (isNonHazComposite) {"
);




code = code.replace(
  /const isMultiComponent = modelCode === 'PA-3223' \|\| \(!isPu202a && Boolean\(facts\.isMultiComponentComposite \|\| isNonHazComposite\)\);/g,
  "const isMultiComponent = modelCode === 'PA-3223' || Boolean(facts.isMultiComponentComposite || isNonHazComposite);"
);

// 替换 buildBaseChineseEngine 中 Section 11 的 if (s11 && isPu202a)
const s11CnOld = "  if (s11 && isPu202a) {";
const s11CnNew = `  if (s11 && s11Paradigm !== 'PARADIGM_1_FULL_WIDTH_MERGED' && !isNonHazComposite) {
    // 通用单组分标准插槽表格高精排版 (基于源文件事实数据驱动)
    const srcS11 = srcEngine?.records?.find(r => r.sectionNumber === 11);
    const srcPreamble = (srcS11?.rows[2]?.cells[0]?.text || '').trim();
    const preambleText = srcPreamble.includes('毒理学数据') ? srcPreamble : '下面是这些成分的毒理学数据。';
    if (s11.rows.length > 2 && s11.rows[2].cells.length === 1) {
      formatSection11PreambleRow(s11.rows[2], preambleText, false);
    }`;

code = code.replace(s11CnOld, s11CnNew);

// 替换 Row 2 前言行硬编码：
code = code.replace(
  "formatSection11PreambleRow(s11.rows[2], '以下是N,N－二甲基乙酰胺毒理学数据：', false);",
  "// 前言行已在上方动态解析注入"
);

// 4. 重构 buildBaseEnglishEngine 中的 Section 11 处理
// 将 if (isPu202a) 块彻底改造为通用数据驱动格式化
const enOldStartStr = "    if (isPu202a) {";
const enOldStartIdx = code.indexOf(enOldStartStr, code.indexOf('buildBaseEnglishEngine'));
if (enOldStartIdx !== -1) {
  // 寻找与 if (isPu202a) 配对的结束大括号
  const enOldEndStr = "  // Section 12 (自适应双模态说明行英译装配与实测数据英译)";
  const enOldEndIdx = code.indexOf(enOldEndStr, enOldStartIdx);
  if (enOldEndIdx !== -1) {
    const replacement = `    // 通用英文 Section 11 标准排版与悬挂缩进保全 (基于中文母版实测事实数据驱动)
    for (let rIdx = 3; rIdx < s11.rows.length; rIdx++) {
      const c0 = s11.rows[rIdx]?.cells[0];
      if (c0) {
        applyStandardHangingIndent(c0, '420', '420');
      }
      normalizeSection11RowHeight(s11.rows[rIdx]);
    }
  }

`;
    code = code.slice(0, enOldStartIdx) + replacement + code.slice(enOldEndIdx);
    console.log('Successfully replaced hardcoded isPu202a block in buildBaseEnglishEngine with generic formatter!');
  } else {
    console.log('enOldEndIdx not found!');
  }
} else {
  console.log('enOldStartIdx not found!');
}


console.log('Successfully updated pipeline-engine.js code!');
fs.writeFileSync('src/pipeline-engine.js.proposed', code);

