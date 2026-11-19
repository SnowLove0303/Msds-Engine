import fs from 'fs';

const original = fs.readFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/msds-db.js', 'utf8');

const addition = `

/**
 * 获取化工大类的基准规格（配合智能匹配引擎受控补充）
 * @param {string} categoryCode 大类代码，如 '02-1', '01-1', 'default'
 * @returns {object|null}
 */
export function getBenchmarkSpecsByCategory(categoryCode = 'default') {
  const db = getDb();
  let code = String(categoryCode || 'default').trim();
  const m = code.match(/^(\\d+-\\d+|\\d+)/);
  if (m) code = m[1];

  let stmt = db.prepare('SELECT * FROM benchmark_category_specs WHERE category_code = ?');
  let row = stmt.get(code);
  if (!row) {
    row = stmt.get('default');
  }
  if (!row) return null;

  return {
    categoryCode: row.category_code,
    categoryName: row.category_name,
    ppeHandSpecs: JSON.parse(row.ppe_hand_specs_json || '{}'),
    wasteDisposalSpecs: JSON.parse(row.waste_disposal_specs_json || '{}'),
    regulatorySpecs: JSON.parse(row.regulatory_specs_json || '{}'),
    updatedAt: row.updated_at
  };
}
`;

fs.writeFileSync('F:/App Location/Guanzhi Tong/Skill/MSDS-Engine/web/src/msds-db.js.new', original + addition, 'utf8');
console.log('Saved new content to msds-db.js.new');
