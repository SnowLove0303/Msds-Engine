import { getDb } from '../src/msds-db.js';

const db = getDb();
const info = db.prepare('PRAGMA table_info(benchmark_category_specs)').all();
console.log('Columns in benchmark_category_specs:', info);
