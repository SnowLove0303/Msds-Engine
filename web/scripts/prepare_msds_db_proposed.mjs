import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalPath = path.resolve(__dirname, '../src/msds-db.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_msds-db.js');

let content = fs.readFileSync(originalPath, 'utf8');

// 1. In initTables, add benchmark_category_specs table definition
const tableDef = `    CREATE INDEX IF NOT EXISTS idx_presets_language ON presets(language);

    CREATE TABLE IF NOT EXISTS benchmark_category_specs (
      category_code TEXT PRIMARY KEY,
      category_name TEXT NOT NULL,
      applicable_patterns TEXT NOT NULL,
      ppe_hand_specs_json TEXT NOT NULL,
      waste_disposal_json TEXT NOT NULL,
      regulatory_specs_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
`;

content = content.replace('    CREATE INDEX IF NOT EXISTS idx_presets_language ON presets(language);', tableDef);

// 2. In initTables, call seedBenchmarkCategorySpecs(db) after seedDefaultPresets(db)
content = content.replace('  seedDefaultPresets(db);', '  seedDefaultPresets(db);\n  seedBenchmarkCategorySpecs(db);');

// 3. Append DEFAULT_BENCHMARK_CATEGORY_SPECS, seedBenchmarkCategorySpecs, getBenchmarkSpecsByCategory
const additionalCode = `
export const DEFAULT_BENCHMARK_CATEGORY_SPECS = [
  {
    category_code: '02-1',
    category_name: '单组份水性丙烯酸乳液 PA',
    applicable_patterns: JSON.stringify(['02-1', 'PA-', '水性丙烯酸', '丙烯酸乳液']),
    ppe_hand_specs_json: JSON.stringify({
      standard: 'EN 374-3',
      fkm: '厚度≧0.4mm；穿透时间≧480min.',
      fkm_en: 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min',
      iir: '厚度≧0.5mm；穿透时间≧480min.',
      iir_en: 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min',
      nbr: '厚度≧0.35mm；穿透时间≧480min.',
      nbr_en: 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min',
      recommendation: '及时更换受污染手套，脱手套后彻底洗手。',
      recommendation_en: 'Discard contaminated gloves and wash hands thoroughly.',
      engineering_controls_en: 'Provide adequate ventilation and local exhaust.'
    }),
    waste_disposal_json: JSON.stringify({
      general_law_cn: '必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。',
      general_law_en: 'Dispose of in accordance with applicable national standards and national or local regulations.',
      ewc_en: 'Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
      methods_supplement_cn: '尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。不能将废弃物通过废水排放。',
      methods_supplement_en: 'Empty containers as completely as possible (e. g., by pouring, scraping, or draining until "drip-dry"). They may be sent to an appropriate collection point under existing chemical industry recycling schemes. Recycle containers in accordance with national regulations and applicable environmental requirements. Do not discharge waste via wastewater.'
    }),
    regulatory_specs_json: JSON.stringify({
      regulations_cn: [
        '《危险化学品安全管理条例》（国务院令第591号）',
        'GB/T 16483-2008《化学品安全技术说明书 内容和项目顺序》',
        'GB 13690-2009《化学品分类和危险性公示 通则》',
        'GB 30000系列《化学品分类和标签规范》'
      ],
      regulations_en: [
        'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.',
        'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections.',
        'GB 13690-2009 General rules for classification and hazard communication of chemicals.',
        'GB 30000.2-29 Rules for classification and labelling of chemicals.'
      ]
    })
  },
  {
    category_code: 'default',
    category_name: '通用化工水性树脂/乳液基准',
    applicable_patterns: JSON.stringify(['default', '水性树脂', '乳液']),
    ppe_hand_specs_json: JSON.stringify({
      standard: 'EN 374-3',
      fkm: '厚度≧0.4mm；穿透时间≧480min.',
      fkm_en: 'Thickness ≥ 0.4 mm; Breakthrough time ≥ 480 min',
      iir: '厚度≧0.5mm；穿透时间≧480min.',
      iir_en: 'Thickness ≥ 0.5 mm; Breakthrough time ≥ 480 min',
      nbr: '厚度≧0.35mm；穿透时间≧480min.',
      nbr_en: 'Thickness ≥ 0.35 mm; Breakthrough time ≥ 480 min',
      recommendation: '及时更换受污染手套，脱手套后彻底洗手。',
      recommendation_en: 'Discard contaminated gloves and wash hands thoroughly.',
      engineering_controls_en: 'Provide adequate ventilation and local exhaust.'
    }),
    waste_disposal_json: JSON.stringify({
      general_law_cn: '必须遵守适用的国标、国家或当地法规进行废弃。严格按照国家和地方危废与环保管理法规执行。',
      general_law_en: 'Dispose of in accordance with applicable national standards and national or local regulations.',
      ewc_en: 'Within the European Union, dispose of in accordance with the applicable provisions of the European Waste Catalogue (EWC).',
      methods_supplement_cn: '尽可能将容器倒空（例如经倾倒，刮擦或排干直至“滴干”）。可根据化学工业现存的回收方案送往适当的收集点处理。容器应按照国家法令和环境相关法规进行回收。不能将废弃物通过废水排放。',
      methods_supplement_en: 'Empty containers as completely as possible (e. g., by pouring, scraping, or draining until "drip-dry"). They may be sent to an appropriate collection point under existing chemical industry recycling schemes. Recycle containers in accordance with national regulations and applicable environmental requirements. Do not discharge waste via wastewater.'
    }),
    regulatory_specs_json: JSON.stringify({
      regulations_cn: [
        '《危险化学品安全管理条例》（国务院令第591号）',
        'GB/T 16483-2008《化学品安全技术说明书 内容和项目顺序》',
        'GB 13690-2009《化学品分类和危险性公示 通则》',
        'GB 30000系列《化学品分类和标签规范》'
      ],
      regulations_en: [
        'Regulations on the Safety Management of Hazardous Chemicals, State Council Decree No. 591.',
        'GB/T 16483-2008 Safety data sheet for chemical products - Content and order of sections.',
        'GB 13690-2009 General rules for classification and hazard communication of chemicals.',
        'GB 30000.2-29 Rules for classification and labelling of chemicals.'
      ]
    })
  }
];

export function seedBenchmarkCategorySpecs(db = getDb()) {
  try {
    const insertStmt = db.prepare(\`
      INSERT INTO benchmark_category_specs (
        category_code, category_name, applicable_patterns,
        ppe_hand_specs_json, waste_disposal_json, regulatory_specs_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_code) DO UPDATE SET
        category_name = excluded.category_name,
        applicable_patterns = excluded.applicable_patterns,
        ppe_hand_specs_json = excluded.ppe_hand_specs_json,
        waste_disposal_json = excluded.waste_disposal_json,
        regulatory_specs_json = excluded.regulatory_specs_json,
        updated_at = excluded.updated_at
    \`);
    const now = Date.now();
    for (const spec of DEFAULT_BENCHMARK_CATEGORY_SPECS) {
      insertStmt.run(
        spec.category_code,
        spec.category_name,
        spec.applicable_patterns,
        spec.ppe_hand_specs_json,
        spec.waste_disposal_json,
        spec.regulatory_specs_json,
        now
      );
    }
  } catch (e) {
    console.warn('seedBenchmarkCategorySpecs error:', e);
  }
}

export function getBenchmarkSpecsByCategory(categoryCodeOrKeyword = 'default') {
  const db = getDb();
  let row = null;
  if (categoryCodeOrKeyword) {
    row = db.prepare('SELECT * FROM benchmark_category_specs WHERE category_code = ?').get(categoryCodeOrKeyword);
    if (!row) {
      row = db.prepare('SELECT * FROM benchmark_category_specs WHERE category_name LIKE ? OR applicable_patterns LIKE ?').get(\`%\${categoryCodeOrKeyword}%\`, \`%\${categoryCodeOrKeyword}%\`);
    }
  }
  if (!row) {
    row = db.prepare('SELECT * FROM benchmark_category_specs WHERE category_code = "default"').get();
  }
  if (!row) return null;
  return {
    categoryCode: row.category_code,
    categoryName: row.category_name,
    applicablePatterns: JSON.parse(row.applicable_patterns || '[]'),
    ppeHandSpecs: JSON.parse(row.ppe_hand_specs_json || '{}'),
    wasteDisposalSpecs: JSON.parse(row.waste_disposal_json || '{}'),
    regulatorySpecs: JSON.parse(row.regulatory_specs_json || '{}'),
    updatedAt: row.updated_at
  };
}
`;

content += additionalCode;

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Proposed msds-db.js written successfully.');
