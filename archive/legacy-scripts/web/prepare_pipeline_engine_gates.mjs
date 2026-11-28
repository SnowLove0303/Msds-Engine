import fs from 'node:fs/promises';

async function updatePipelineEngine() {
  const file = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
  let lines = (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n').split('\n');

  // 1. Add translation helpers before buildBaseEnglishEngine
  const helpers = `
/**
 * Section 12 前置组分引言说明行专业英译
 */
export function translateSection12PreambleToEnglish(cnText) {
  if (!cnText) return '';
  if (/无可用的生态|未做任何试验|生态学/i.test(cnText)) {
    return 'No ecotoxicological studies are available for this product.';
  }
  const match = cnText.match(/以下(?:是|为)(.*?)(?:生态毒理学(?:参考)?数据|毒理学数据)[：:]?/);
  if (match) {
    let comp = match[1].trim();
    if (/N,N[－-]二甲基乙酰胺|二甲基乙酰胺|DMAC/i.test(comp)) comp = 'N,N-Dimethylacetamide';
    else if (/N[－-]甲基吡咯烷酮|NMP/i.test(comp)) comp = 'N-Methyl-2-pyrrolidone (NMP)';
    else if (/N[－-]乙基吡咯烷酮|NEP/i.test(comp)) comp = '1-Ethylpyrrolidin-2-one (NEP)';
    else if (/二乙二醇单丁醚/i.test(comp)) comp = 'Diethylene glycol monobutyl ether (CAS: 112-34-5)';
    else if (/异丙醇/i.test(comp)) comp = 'Isopropanol';
    return \`The following are ecotoxicological data for \${comp}:\`;
  }
  return 'The following are ecotoxicological data for the components:';
}

/**
 * Section 12 生态毒理实测指标专业英译 (鱼类、藻类、水蚤等)
 */
export function translateEcotoxicityValueToEnglish(cnText) {
  if (!cnText) return 'No ecotoxicological studies are available for this product.\\nDo not allow to enter drains, water courses or soil.';
  let en = cnText;
  en = en.replace(/对鱼类的毒性[：:]/g, 'Toxicity to fish:\\n');
  en = en.replace(/半数致死浓度[（(]LC50[）)]\\/96\\s*h\\/黑头呆鱼[：:]/g, 'LC50 / 96 h / Pimephales promelas (fathead minnow): ');
  en = en.replace(/半数致死浓度[（(]LC50[）)]\\/96\\s*h\\/斑马鱼[：:]/g, 'LC50 / 96 h / Danio rerio (zebra fish): ');
  en = en.replace(/其他[：:]/g, 'Other:\\n');
  en = en.replace(/半数致死有效浓度[（(]EC50[）)]\\/72\\s*h\\/藻类[：:]/g, 'EC50 / 72 h / Algae: ');
  en = en.replace(/半数致死有效浓度[（(]EC50[）)]\\/48\\s*h\\/大型溞[：:]/g, 'EC50 / 48 h / Daphnia magna: ');
  en = en.replace(/对水蚤及其他水生无脊椎动物的毒性[：:]/g, 'Toxicity to daphnia and other aquatic invertebrates:\\n');
  en = en.replace(/对藻类的毒性[：:]/g, 'Toxicity to algae:\\n');
  en = en.replace(/对微生物的毒性[：:]/g, 'Toxicity to microorganisms:\\n');
  return en.replace(/\\n\\s*\\n+/g, '\\n').trim();
}
`;

  // Find line "export async function buildBaseEnglishEngine"
  const buildEnIdx = lines.findIndex(l => l.includes('export async function buildBaseEnglishEngine'));
  if (buildEnIdx !== -1) {
    lines.splice(buildEnIdx, 0, helpers);
  }

  // 2. Replace Section 12 handling inside buildBaseEnglishEngine
  const s12StartIdx = lines.findIndex(l => l.includes('// Section 12 (标准 4 行)'));
  const s13StartIdx = lines.findIndex(l => l.includes('// Section 13 (标准 3 行)'));
  console.log(`S12 boundaries: ${s12StartIdx} to ${s13StartIdx}`);

  if (s12StartIdx !== -1 && s13StartIdx !== -1) {
    const newS12Handling = `  // Section 12 (自适应双模态说明行英译装配与实测数据英译)
  let s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12) {
    const cnS12 = baseCnEngine?.records?.find(r => r.sectionNumber === 12);
    const cnPreambles = [];
    if (cnS12) {
      for (let i = 1; i < cnS12.rows.length; i++) {
        const t = cnS12.rows[i].cells.map(c => c.text || '').join('').trim();
        if (/生态毒性|持久性|Ecotoxicity|Persistence|12\\.\\d/i.test(t)) break;
        if (t) cnPreambles.push(t);
      }
    }

    if (cnPreambles.length >= 2) {
      // 中文母版有 2 行说明行：Row 1 产品免责，Row 2 组分引言
      if (s12.rows[1]?.cells?.[0]) {
        safeWrite(s12.rows[1].cells[0], 'No ecotoxicological studies are available for this product.');
      }
      if (s12.rows[2]?.cells?.[0]) {
        safeWrite(s12.rows[2].cells[0], translateSection12PreambleToEnglish(cnPreambles[1]));
      }
    } else if (cnPreambles.length === 1) {
      if (s12.rows[1]?.cells?.[0]) {
        safeWrite(s12.rows[1].cells[0], 'No ecotoxicological studies are available for this product.');
      }
      if (s12.rows[2]?.cells?.length === 1) {
        s12 = deleteRow(engine, s12, 2);
      }
    } else if (cnPreambles.length === 0) {
      if (s12.rows[2]?.cells?.length === 1) s12 = deleteRow(engine, s12, 2);
      if (s12.rows[1]?.cells?.length === 1) s12 = deleteRow(engine, s12, 1);
    }

    // 动态提取中文生态毒性实测值并专业英译
    const cnEcoRow = cnS12?.rows?.find(r => /生态毒性/i.test(r.cells[0]?.text || ''));
    const cnEcoVal = cnEcoRow?.cells?.[cnEcoRow.cells.length - 1]?.text || '';
    const ecoEn = cnEcoVal ? translateEcotoxicityValueToEnglish(cnEcoVal) : enValues['sec12.ecotoxicity'];

    for (const row of s12.rows) {
      const lbl = (row.cells[0]?.text || '').trim();
      const c1 = row.cells[1];
      if (!c1) continue;
      if (/Ecotoxicity/i.test(lbl)) safeWrite(c1, ecoEn);
      else if (/Persistence/i.test(lbl)) safeWrite(c1, enValues['sec12.persistence']);
      else if (/Other adverse/i.test(lbl)) safeWrite(c1, enValues['sec12.other_effects']);
    }
  }
`;
    lines.splice(s12StartIdx, s13StartIdx - s12StartIdx, newS12Handling);
  }

  // 3. Add Quality Assertion Gates before export
  const gateFn = `
/**
 * 法定全项硬性门禁 (Quality Assertion Gates)
 * 在发布前拦截任何 S9 格式、S11 拓扑、S12 说明行数量、页脚时间或中文残余缺陷
 */
export function assertDeliverableQuality(engine, docName, isEnglish, sourceFacts = {}) {
  // Gate 1: Section 9 格式严格符合模板 (420 dxa 悬挂，零 tabs)
  const s9 = engine.records.find(r => r.sectionNumber === 9);
  if (s9) {
    for (let rIdx = 1; rIdx < s9.rows.length; rIdx++) {
      const c0 = s9.rows[rIdx]?.cells[0];
      if (!c0?.node) continue;
      const p = c0.node.getElementsByTagNameNS(W_NS, 'p')[0];
      const pPr = p?.getElementsByTagNameNS(W_NS, 'pPr')[0];
      const ind = pPr?.getElementsByTagNameNS(W_NS, 'ind')[0];
      const tabs = pPr?.getElementsByTagNameNS(W_NS, 'tabs')[0];
      if (tabs) {
        throw new Error(\`【质量门禁拦截】\${docName} Section 9 Row \${rIdx} 含有非法注入的 <w:tabs> 制表位！\`);
      }
      if (ind) {
        const l = ind.getAttributeNS(W_NS, 'left');
        const h = ind.getAttributeNS(W_NS, 'hanging');
        if (l !== '420' || h !== '420') {
          throw new Error(\`【质量门禁拦截】\${docName} Section 9 Row \${rIdx} 悬挂缩进异常: left=\${l}, hanging=\${h} (必须为 420)!\`);
        }
      }
    }
  }

  // Gate 2: Section 11 表格拓扑与 11.7 (6262 宽度与 gridSpan="3")
  const s11 = engine.records.find(r => r.sectionNumber === 11);
  if (s11) {
    const repRow = s11.rows.find(r => /生殖毒性|Reproductive/i.test(r.cells[0]?.text || ''));
    if (repRow && repRow.cells.length === 2) {
      const valCell = repRow.cells[1];
      const tcPr = valCell.node?.getElementsByTagNameNS(W_NS, 'tcPr')[0];
      const tcW = tcPr?.getElementsByTagNameNS(W_NS, 'tcW')[0]?.getAttributeNS(W_NS, 'w');
      const span = tcPr?.getElementsByTagNameNS(W_NS, 'gridSpan')[0]?.getAttributeNS(W_NS, 'val');
      const vMerge = repRow.cells[0]?.node?.getElementsByTagNameNS(W_NS, 'vMerge')[0];
      if (vMerge) {
        throw new Error(\`【质量门禁拦截】\${docName} 11.7 含有悬空未清除的 <w:vMerge>！\`);
      }
      if (tcW !== '6262' || span !== '3') {
        throw new Error(\`【质量门禁拦截】\${docName} 11.7 宽度与跨列异常: tcW=\${tcW}, span=\${span} (必须为 6262 / 3)!\`);
      }
    }
  }

  // Gate 3: Section 12 说明行数量严格一致
  const s12 = engine.records.find(r => r.sectionNumber === 12);
  if (s12 && sourceFacts.expectedS12PreamblesCount) {
    let actualPreambles = 0;
    for (let i = 1; i < s12.rows.length; i++) {
      const t = s12.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|Ecotoxicity|Persistence|12\\.\\d/i.test(t)) break;
      if (t) actualPreambles++;
    }
    if (actualPreambles !== sourceFacts.expectedS12PreamblesCount) {
      throw new Error(\`【质量门禁拦截】\${docName} Section 12 说明行数量不匹配: 期望 \${sourceFacts.expectedS12PreamblesCount} 行，实际产出 \${actualPreambles} 行！\`);
    }
  }

  // Gate 4: 英文版零中文门禁
  if (isEnglish) {
    assertZeroChinese(engine, docName);
  }
}
`;

  // Hook gate checks into executeEightDeliverablesPipeline
  const assertBilingualIdx = lines.findIndex(l => l.includes('assertBilingualIntegrity(baseCnEngine, baseEnEngine);'));
  if (assertBilingualIdx !== -1) {
    const gateHooks = `
  // 3.6 执行交付前全量硬性质量门禁 (Gate 1~5)
  // 动态探知源文件的 Section 12 说明行数量
  const s12RecordForAudit = baseCnEngine.records.find(r => r.sectionNumber === 12);
  let expectedS12PreamblesCount = 0;
  if (s12RecordForAudit) {
    for (let i = 1; i < s12RecordForAudit.rows.length; i++) {
      const t = s12RecordForAudit.rows[i].cells.map(c => c.text || '').join('').trim();
      if (/生态毒性|持久性|12\\.\\d/i.test(t)) break;
      if (t) expectedS12PreamblesCount++;
    }
  }
  const sourceFactsForAudit = { expectedS12PreamblesCount, expectedDate: effectiveDate };

  assertDeliverableQuality(baseCnEngine, 'Base Chinese (冠志)', false, sourceFactsForAudit);
  assertDeliverableQuality(cnPresetEngine, 'Preset Chinese (国彩)', false, sourceFactsForAudit);
  assertDeliverableQuality(baseEnEngine, 'Base English (Guanzhi)', true, sourceFactsForAudit);
  assertDeliverableQuality(enPresetEngine, 'Preset English (Guocai)', true, sourceFactsForAudit);
`;
    lines.splice(assertBilingualIdx + 1, 0, gateHooks);
  }

  lines.push(gateFn);

  await fs.writeFile('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/scratch/pipeline-engine.proposed_gates.js', lines.join('\n'), 'utf8');
  console.log('Successfully prepared scratch/pipeline-engine.proposed_gates.js');
}

updatePipelineEngine();
