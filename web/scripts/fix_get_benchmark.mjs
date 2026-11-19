import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../src/msds-db.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_msds-db.js');

let content = fs.readFileSync(targetPath, 'utf8');

const targetFn = `export function getBenchmarkSpecsByCategory(categoryCodeOrKeyword = 'default') {
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
    wasteDisposalSpecs: JSON.parse(row.waste_disposal_specs_json || '{}'),
    regulatorySpecs: JSON.parse(row.regulatory_specs_json || '{}'),
    updatedAt: row.updated_at
  };
}`;

const robustFn = `export function getBenchmarkSpecsByCategory(categoryCodeOrKeyword = 'default') {
  const db = getDb();
  let row = null;
  if (categoryCodeOrKeyword && categoryCodeOrKeyword !== 'default') {
    row = db.prepare('SELECT * FROM benchmark_category_specs WHERE category_code = ?').get(categoryCodeOrKeyword);
    if (!row) {
      const allRows = db.prepare('SELECT * FROM benchmark_category_specs').all();
      for (const r of allRows) {
        if (r.category_code === 'default') continue;
        if (r.category_name && categoryCodeOrKeyword.includes(r.category_name)) {
          row = r;
          break;
        }
        let patterns = [];
        try { patterns = JSON.parse(r.applicable_patterns || '[]'); } catch {}
        if (patterns.some(p => categoryCodeOrKeyword.toUpperCase().includes(p.toUpperCase()) || p.toUpperCase().includes(categoryCodeOrKeyword.toUpperCase()))) {
          row = r;
          break;
        }
      }
    }
  }
  if (!row) {
    row = db.prepare("SELECT * FROM benchmark_category_specs WHERE category_code = 'default'").get();
  }
  if (!row) return null;
  return {
    categoryCode: row.category_code,
    categoryName: row.category_name,
    applicablePatterns: JSON.parse(row.applicable_patterns || '[]'),
    ppeHandSpecs: JSON.parse(row.ppe_hand_specs_json || '{}'),
    wasteDisposalSpecs: JSON.parse(row.waste_disposal_specs_json || '{}'),
    regulatorySpecs: JSON.parse(row.regulatory_specs_json || '{}'),
    updatedAt: row.updated_at
  };
}`;

content = content.replace(targetFn, robustFn);

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Robust getBenchmarkSpecsByCategory proposed.');
