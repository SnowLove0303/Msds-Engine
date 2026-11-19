import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalPath = path.resolve(__dirname, '../src/msds-db.js');
const proposedPath = path.resolve(__dirname, '../data/proposed_msds-db.js');

let content = fs.readFileSync(originalPath, 'utf8');

// Replace table def if needed to use waste_disposal_specs_json
content = content.replace(
  `      waste_disposal_json TEXT NOT NULL,`,
  `      waste_disposal_specs_json TEXT NOT NULL,`
);

// Add alter table column check in initTables
const alterCheck = `  try {
    db.exec("ALTER TABLE benchmark_category_specs ADD COLUMN applicable_patterns TEXT DEFAULT '[]';");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE benchmark_category_specs ADD COLUMN waste_disposal_specs_json TEXT DEFAULT '{}';");
  } catch {
    // column already exists
  }
  seedBenchmarkCategorySpecs(db);`;

content = content.replace('  seedBenchmarkCategorySpecs(db);', alterCheck);

// Replace insert statement and getters in benchmark specs
content = content.replace(
  `        ppe_hand_specs_json, waste_disposal_json, regulatory_specs_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_code) DO UPDATE SET
        category_name = excluded.category_name,
        applicable_patterns = excluded.applicable_patterns,
        ppe_hand_specs_json = excluded.ppe_hand_specs_json,
        waste_disposal_json = excluded.waste_disposal_json,
        regulatory_specs_json = excluded.regulatory_specs_json,`,
  `        ppe_hand_specs_json, waste_disposal_specs_json, regulatory_specs_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_code) DO UPDATE SET
        category_name = excluded.category_name,
        applicable_patterns = excluded.applicable_patterns,
        ppe_hand_specs_json = excluded.ppe_hand_specs_json,
        waste_disposal_specs_json = excluded.waste_disposal_specs_json,
        regulatory_specs_json = excluded.regulatory_specs_json,`
);

content = content.replace(
  `wasteDisposalSpecs: JSON.parse(row.waste_disposal_json || '{}'),`,
  `wasteDisposalSpecs: JSON.parse(row.waste_disposal_specs_json || row.waste_disposal_json || '{}'),`
);

fs.writeFileSync(proposedPath, content, 'utf8');
console.log('Fixed proposed msds-db.js generated.');
