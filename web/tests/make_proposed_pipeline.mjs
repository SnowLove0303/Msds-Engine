import fs from 'fs';
import path from 'path';

const filePath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/pipeline-engine.js';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

function doReplace(target, replacement, desc) {
  const idx = content.indexOf(target);
  if (idx === -1) {
    console.error(`ERROR: Target for ${desc} not found!`);
    process.exit(1);
  }
  content = content.replace(target, replacement);
  console.log(`✓ Replaced ${desc}`);
}

// 1. Add GHS_H_TO_CATEGORY_EN and translateGhsCategory
const categoryMapTarget = `const GHS_CATEGORY_TRANS_MAP = {`;
const categoryAddition = `export const GHS_H_TO_CATEGORY_EN = {
  'H332': 'Acute toxicity, Inhalation (Category 4), H332',
  'H317': 'Skin sensitization (Category 1B), H317',
  'H335': 'Specific target organ toxicity - single exposure (Category 3), H335',
  'H412': 'Chronic aquatic toxicity (Category 3), H412',
  'H302': 'Acute toxicity, Oral (Category 4), H302',
  'H312': 'Acute toxicity, Dermal (Category 4), H312',
  'H315': 'Skin corrosion/irritation (Category 2), H315',
  'H316': 'Skin corrosion/irritation (Category 3), H316',
  'H319': 'Serious eye damage/eye irritation (Category 2A), H319',
  'H320': 'Serious eye damage/eye irritation (Category 2B), H320',
  'H360': 'Reproductive toxicity (Category 1B), H360',
  'H370': 'Specific target organ toxicity - single exposure (Category 1), H370',
  'H373': 'Specific target organ toxicity - repeated exposure (Category 2), H373',
  'H226': 'Flammable liquid (Category 3), H226'
};

export function translateGhsCategory(cat) {
  if (!cat) return '';
  const trimmed = cat.trim();
  if (GHS_CATEGORY_TRANS_MAP[trimmed]) return GHS_CATEGORY_TRANS_MAP[trimmed];
  const hMatch = trimmed.match(/H\\d{3}[A-Za-z]?/i);
  if (hMatch) {
    const code = hMatch[0].toUpperCase();
    if (GHS_H_TO_CATEGORY_EN[code]) return GHS_H_TO_CATEGORY_EN[code];
  }
  if (/急性毒性.*吸入/i.test(trimmed)) return 'Acute toxicity, Inhalation (Category 4), H332';
  if (/皮肤致敏/i.test(trimmed)) return 'Skin sensitization (Category 1B), H317';
  if (/靶器官.*一次/i.test(trimmed)) return 'Specific target organ toxicity - single exposure (Category 3), H335';
  if (/慢性.*水/i.test(trimmed)) return 'Chronic aquatic toxicity (Category 3), H412';
  return trimmed;
}

const GHS_CATEGORY_TRANS_MAP = {`;
doReplace(categoryMapTarget, categoryAddition, 'GHS_H_TO_CATEGORY_EN');

// 2. Add missing P codes and translateGhsPrecautionary
const pMapTarget = `  'P403+P233': 'P403+P233 Store in a well-ventilated place. Keep container tightly closed.',
};`;
const pMapAddition = `  'P403+P233': 'P403+P233 Store in a well-ventilated place. Keep container tightly closed.',
  'P403': 'P403 Store in a well-ventilated place.',
  'P233': 'P233 Keep container tightly closed.',
  'P312': 'P312 Call a POISON CENTER/doctor if you feel unwell.',
  'P304+P312': 'P304+P312 IF INHALED: Call a POISON CENTER/doctor if you feel unwell.',
  'P234': 'P234 Keep only in original packaging.',
  'P391': 'P391 Collect spillage.',
  'P333+P313': 'P333+P313 If skin irritation or rash occurs: Get medical advice/attention.',
  'P363': 'P363 Wash contaminated clothing before reuse.',
};

export function translateGhsPrecautionary(p) {
  if (!p) return '';
  const normalized = p.replace(/P(\\d+)\\s*\\+\\s*\\.?\\s*P?(\\d+)/gi, 'P$1+P$2');
  const codeMatch = normalized.match(/^(P\\d+(?:\\+P\\d+)*)/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : '';
  if (code && GHS_P_TRANS_MAP[code]) {
    return GHS_P_TRANS_MAP[code];
  }
  return GHS_P_TRANS_MAP[code] || p;
}`;
doReplace(pMapTarget, pMapAddition, 'GHS_P_TRANS_MAP additions');

// 3. Update buildFullWidthSection2 to use translateGhsCategory and translateGhsPrecautionary
doReplace(
  `      for (const cat of parsed.categories) {\n        paragraphs.push(GHS_CATEGORY_TRANS_MAP[cat] || cat);\n      }`,
  `      for (const cat of parsed.categories) {\n        paragraphs.push(translateGhsCategory(cat));\n      }`,
  'buildFullWidthSection2 category translation'
);

doReplace(
  `      for (const p of parsed.prevention) {\n        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);\n        const code = codeMatch ? codeMatch[1] : '';\n        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));\n      }`,
  `      for (const p of parsed.prevention) {\n        paragraphs.push('        ' + translateGhsPrecautionary(p));\n      }`,
  'buildFullWidthSection2 prevention translation'
);

doReplace(
  `      for (const p of parsed.response) {\n        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);\n        const code = codeMatch ? codeMatch[1] : '';\n        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));\n      }`,
  `      for (const p of parsed.response) {\n        paragraphs.push('        ' + translateGhsPrecautionary(p));\n      }`,
  'buildFullWidthSection2 response translation'
);

doReplace(
  `      for (const p of parsed.storage) {\n        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);\n        const code = codeMatch ? codeMatch[1] : '';\n        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));\n      }`,
  `      for (const p of parsed.storage) {\n        paragraphs.push('        ' + translateGhsPrecautionary(p));\n      }`,
  'buildFullWidthSection2 storage translation'
);

doReplace(
  `      for (const p of parsed.disposal) {\n        const codeMatch = p.match(/^(P\\d+(?:\\+P\\d+)*)/);\n        const code = codeMatch ? codeMatch[1] : '';\n        paragraphs.push('        ' + (GHS_P_TRANS_MAP[code] || p));\n      }`,
  `      for (const p of parsed.disposal) {\n        paragraphs.push('        ' + translateGhsPrecautionary(p));\n      }`,
  'buildFullWidthSection2 disposal translation'
);

// 4. Update Section 3 multiline parsing and component translation in buildBaseEnglishEngine
const oldSec3Block = `    // 优先从 baseCnEngine 真实提取组分列表
    let comps = facts.components;
    if (!comps && baseCnEngine) {
      const cnS3 = baseCnEngine.records.find(r => r.sectionNumber === 3);
      if (cnS3 && cnS3.rows.length > 4) {
        comps = [];
        for (let i = 4; i < cnS3.rows.length; i++) {
          const r = cnS3.rows[i];
          const cnName = (r.cells[0]?.text || '').trim();
          let cas = (r.cells[1]?.text || '').trim();
          const conc = (r.cells[2]?.text || '').trim();
          let enName = cnName;
          if (/封闭型脂肪族聚异氰酸酯/i.test(cnName)) enName = 'Blocked aliphatic polyisocyanate';
          else if (/丙酮/i.test(cnName)) enName = 'Acetone';
          else if (/乙酸/i.test(cnName)) enName = 'Acetic acid';
          else if (/聚乙烯蜡/i.test(cnName)) enName = 'Polyethylene wax';
          else if (/蜡/i.test(cnName)) enName = 'Wax';
          else if (/二甲基乙酰胺|DMAC/i.test(cnName)) enName = 'N,N-Dimethylacetamide (DMAC)';
          else if (/甲基吡咯烷酮|NMP/i.test(cnName)) enName = 'N-Methyl-2-pyrrolidone (NMP)';
          else if (/乙基吡咯烷酮|NEP/i.test(cnName)) enName = '1-Ethylpyrrolidin-2-one (NEP)';
          else if (/去离子水/i.test(cnName)) enName = 'Deionized water';
          else if (/聚氨酯.*分散体|水性聚氨酯/i.test(cnName)) enName = 'Polyurethane dispersion';
          else if (/聚氨酯/i.test(cnName)) enName = 'Polyurethane';
          else if (/水$/i.test(cnName)) enName = 'Water';
          else if (/环氧改性丙烯酸聚合物|环氧.*丙烯酸/i.test(cnName)) enName = 'Epoxy modified acrylic polymer';
          else if (/丁氧基乙醇|乙二醇丁醚/i.test(cnName)) enName = '2-Butoxyethanol';
          else if (/羟基丙烯酸酯.*聚合物|丙烯酸酯.*聚合物/i.test(cnName)) enName = 'Hydroxy acrylic polymer';
          else if (/丙二醇.*丁醚|丙二醇单丁醚/i.test(cnName)) enName = 'Propylene glycol butyl ether';
          else if (/N,N[－\\-—\\s]*二甲基乙醇胺|二甲基乙醇胺|DMEA/i.test(cnName)) enName = '2-Dimethylaminoethanol';
          if (/商业机密|商业秘密/i.test(cas)) cas = 'Trade secret';

          comps.push({
            name: enName,
            cas: /商业机密|商业秘密/i.test(cas) ? 'Trade secret' : cas,
            conc: conc
          });
        }
      }
    }`;

const newSec3Block = `    // 优先从 baseCnEngine 真实提取组分列表
    let comps = facts.components;
    if (!comps && baseCnEngine) {
      const cnS3 = baseCnEngine.records.find(r => r.sectionNumber === 3);
      if (cnS3 && cnS3.rows.length >= 5) {
        comps = [];
        for (let i = 4; i < cnS3.rows.length; i++) {
          const r = cnS3.rows[i];
          const rawC0 = (r.cells[0]?.text || '').trim();
          const rawC1 = (r.cells[1]?.text || '').trim();
          const rawC2 = (r.cells[2]?.text || '').trim();

          const subNames = rawC0.includes('\\n') ? rawC0.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean) : [rawC0];
          const subCas = rawC1.includes('\\n') ? rawC1.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean) : [rawC1];
          const subConc = rawC2.includes('\\n') ? rawC2.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean) : [rawC2];

          for (let k = 0; k < subNames.length; k++) {
            const cnName = subNames[k];
            let cas = subCas[k] || subCas[0] || '';
            const conc = subConc[k] || subConc[0] || '';
            let enName = cnName;
            if (/封闭型脂肪族聚异氰酸酯/i.test(cnName)) enName = 'Blocked aliphatic polyisocyanate';
            else if (/六甲撑二异氰酸酯基均聚物|六亚甲基二异氰酸酯.*均聚物|HDI.*均聚物|HDI.*低聚物/i.test(cnName)) {
              if (/亲水/i.test(cnName)) enName = 'Hydrophilically modified hexamethylene diisocyanate homopolymer';
              else enName = 'Hexamethylene diisocyanate oligomers';
            }
            else if (/亲水改性.*异氰酸酯/i.test(cnName)) enName = 'Hydrophilically modified polyisocyanate';
            else if (/六甲撑二异氰酸酯|六亚甲基二异氰酸酯|HDI/i.test(cnName)) enName = 'Hexamethylene diisocyanate';
            else if (/丙二醇二乙酸酯|PGDA/i.test(cnName)) enName = 'Propylene glycol diacetate';
            else if (/丙二醇甲醚醋酸酯|PMA/i.test(cnName)) enName = 'Propylene glycol monomethyl ether acetate (PMA)';
            else if (/丙酮/i.test(cnName)) enName = 'Acetone';
            else if (/乙酸/i.test(cnName)) enName = 'Acetic acid';
            else if (/聚乙烯蜡/i.test(cnName)) enName = 'Polyethylene wax';
            else if (/蜡/i.test(cnName)) enName = 'Wax';
            else if (/二甲基乙酰胺|DMAC/i.test(cnName)) enName = 'N,N-Dimethylacetamide (DMAC)';
            else if (/甲基吡咯烷酮|NMP/i.test(cnName)) enName = 'N-Methyl-2-pyrrolidone (NMP)';
            else if (/乙基吡咯烷酮|NEP/i.test(cnName)) enName = '1-Ethylpyrrolidin-2-one (NEP)';
            else if (/去离子水/i.test(cnName)) enName = 'Deionized water';
            else if (/聚氨酯.*分散体|水性聚氨酯/i.test(cnName)) enName = 'Polyurethane dispersion';
            else if (/聚氨酯/i.test(cnName)) enName = 'Polyurethane';
            else if (/水$/i.test(cnName)) enName = 'Water';
            else if (/环氧改性丙烯酸聚合物|环氧.*丙烯酸/i.test(cnName)) enName = 'Epoxy modified acrylic polymer';
            else if (/丁氧基乙醇|乙二醇丁醚/i.test(cnName)) enName = '2-Butoxyethanol';
            else if (/羟基丙烯酸酯.*聚合物|丙烯酸酯.*聚合物/i.test(cnName)) enName = 'Hydroxy acrylic polymer';
            else if (/丙二醇.*丁醚|丙二醇单丁醚/i.test(cnName)) enName = 'Propylene glycol butyl ether';
            else if (/N,N[－\\-—\\s]*二甲基乙醇胺|二甲基乙醇胺|DMEA/i.test(cnName)) enName = '2-Dimethylaminoethanol';

            comps.push({
              name: enName,
              cas: /商业机密|商业秘密/i.test(cas) ? 'Trade secret' : cas,
              conc: conc
            });
          }
        }
      }
    }`;
doReplace(oldSec3Block, newSec3Block, 'Section 3 multiline and component translations');

// 5. Update Section 9 solubility, solids and overrides handling in buildEnglishFacts
const oldSolubilityBlock = `        } else if (/水溶性/i.test(lbl)) {\n          if (/混溶|互溶|完全/i.test(val)) sec9Facts.solubility = 'Miscible';\n          else sec9Facts.solubility = val;`;
const newSolubilityBlock = `        } else if (/水溶性/i.test(lbl)) {\n          if (/混溶|互溶|完全/i.test(val)) sec9Facts.solubility = 'Miscible';\n          else if (/分散|乳化/i.test(val)) sec9Facts.solubility = 'Dispersible in water';\n          else sec9Facts.solubility = val;`;
doReplace(oldSolubilityBlock, newSolubilityBlock, 'Section 9 solubility translation');

const oldSolidsBlock = `        } else if (/固体含量|固含/i.test(lbl)) {\n          sec9Facts.solids = val;`;
const newSolidsBlock = `        } else if (/固体含量|固含/i.test(lbl)) {\n          sec9Facts.solids = val.replace(/约\\s*/g, 'Approx. ');`;
doReplace(oldSolidsBlock, newSolidsBlock, 'Section 9 solids translation');

const oldSec9EndBlock = `        } else if (/固体含量|固含/i.test(lbl)) {\n          sec9Facts.solids = val.replace(/约\\s*/g, 'Approx. ');\n        }\n      }\n    }\n  }`;
const newSec9EndBlock = `        } else if (/固体含量|固含/i.test(lbl)) {\n          sec9Facts.solids = val.replace(/约\\s*/g, 'Approx. ');\n        }\n      }\n    }\n    if (facts.viscosityOverride) {\n      sec9Facts.viscosity = facts.viscosityOverride;\n    }\n    if (facts.section9Overrides) {\n      for (const [pattern, val] of Object.entries(facts.section9Overrides)) {\n        if (/粘度|动力粘度/i.test(pattern)) sec9Facts.viscosity = val;\n        else if (/固体含量|固含/i.test(pattern)) sec9Facts.solids = val;\n        else if (/密度/i.test(pattern)) sec9Facts.density = val.replace(/约\\s*/g, 'Approx. ');\n        else if (/外观/i.test(pattern)) {\n          if (/无色.*微黄|微黄.*透明/i.test(val)) sec9Facts.appearance = 'Colorless to slightly yellow transparent liquid';\n          else if (/无色.*淡黄|淡黄.*粘稠/i.test(val)) sec9Facts.appearance = 'Colorless to light yellow transparent viscous liquid';\n          else sec9Facts.appearance = val;\n        }\n      }\n    }\n  }`;
doReplace(oldSec9EndBlock, newSec9EndBlock, 'Section 9 overrides in buildEnglishFacts');

// 6. Update translateToxicologyValueToEnglish for Section 11 terms
const oldToxTarget = `  if (isDermal) {
    t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*[/／]\\s*大鼠\\s*[:：]\\s*/g, 'LD50 / Dermal / Rat: ');
  } else {
    t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*[/／]\\s*大鼠\\s*[:：]\\s*/g, 'LD50 / Oral / Rat: ');
  }`;

const newToxTarget = `  if (isDermal) {
    t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*[/／]?\\s*大鼠\\s*[:：]\\s*/g, 'LD50 / Dermal / Rat: ');
  } else {
    t = t.replace(/半数致死剂量\\s*[（(]\\s*LD50\\s*[）)]\\s*[/／]?\\s*大鼠\\s*[:：]\\s*/g, 'LD50 / Oral / Rat: ');
  }
  t = t.replace(/，/g, ',');
  t = t.replace(/轻微刺激/g, 'Slight irritation');
  t = t.replace(/皮肤接触可能致敏/g, 'May cause sensitization by skin contact.');
  t = t.replace(/在\\s*AMES\\s*试验中无致突变性。?/gi, 'Non-mutagenic in Ames test.');`;

doReplace(oldToxTarget, newToxTarget, 'translateToxicologyValueToEnglish additions');

const outPath = 'F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/proposed_pipeline_engine.js';
fs.writeFileSync(outPath, content, 'utf8');
console.log('Successfully written web/src/proposed_pipeline_engine.js');
